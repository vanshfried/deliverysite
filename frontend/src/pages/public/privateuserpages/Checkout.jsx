import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../../api/api";
import { CartContext } from "../../admin/Context/CartContext";
import { AuthContext } from "../../admin/Context/AuthContext";
import styles from "./css/Checkout.module.css";

export default function Checkout() {
  const { cart, clearCart } = useContext(CartContext);
  const { userLoggedIn, user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const buyNowProduct = location.state?.buyNowProduct || null;

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addForm, setAddForm] = useState({});
  const [addMode, setAddMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [accessDenied, setAccessDenied] = useState(false); // 👈 new state

  /* 🚫 Prevent direct access if not coming from cart or buy now */
  useEffect(() => {
    if (!userLoggedIn) return navigate("/login");

    const fromBuyNow = !!location.state?.buyNowProduct;
    const fromCart = !!location.state?.fromCart;
    const hasCartItems = cart?.items?.length > 0;

    if (!fromBuyNow && !fromCart && !hasCartItems) {
      setAccessDenied(true); // 👈 instead of redirect
    }
  }, [userLoggedIn, cart, location, navigate]);

  // Fetch addresses
  useEffect(() => {
    if (!userLoggedIn) return;
    const fetchAddresses = async () => {
      try {
        const res = await API.get("/users/me");
        const u = res.data.user;
        setAddresses(u.addresses || []);
        if (u.defaultAddress) setSelectedAddress(u.defaultAddress);
      } catch (err) {
        console.error("Address fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAddresses();
  }, [userLoggedIn]);

  // Determine items
  const items = buyNowProduct
    ? [{ product: buyNowProduct, quantity: 1 }]
    : cart?.items || [];

  const total = items.reduce(
    (sum, item) =>
      sum +
      (item.product.discountPrice > 0
        ? item.product.discountPrice
        : item.product.price) *
        item.quantity,
    0
  );

  // Add address
  const handleAddAddress = async () => {
    if (addresses.length >= 3) return;
    if (!addForm.houseNo || !addForm.laneOrSector || !addForm.pincode)
      return setError("Missing required fields ❌");

    try {
      const res = await API.post("/users/address", addForm);
      if (res.data.addresses) setAddresses(res.data.addresses);
      if (res.data.defaultAddress) setSelectedAddress(res.data.defaultAddress);
      setAddForm({});
      setAddMode(false);
      setError("");
    } catch {
      setError("Failed to add address");
    }
  };

  // Edit address
  const startEdit = (addr) => {
    setEditId(addr._id);
    setEditForm({ ...addr });
    setAddMode(false);
  };

  const saveEdit = async () => {
    if (!editForm.houseNo || !editForm.laneOrSector || !editForm.pincode)
      return setError("Missing required fields ❌");
    if (!/^\d{6}$/.test(editForm.pincode))
      return setError("Pincode must be 6 digits ❌");

    try {
      const res = await API.put(`/users/address/${editId}`, editForm);
      if (res.data.addresses) setAddresses(res.data.addresses);
      setEditId(null);
      setEditForm({});
      setError("");
    } catch {
      setError("Failed to update address ❌");
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm({});
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (!selectedAddress) return setError("Please select an address");
    setPlacingOrder(true);
    setError("");
    try {
      const orderData = {
        addressId: selectedAddress,
        total,
        paymentMethod: "COD", // or UPI if you want payment option later
        items: items.map((i) => ({
          productName: i.product.name,
          quantity: i.quantity,
          price:
            i.product.discountPrice > 0
              ? i.product.discountPrice
              : i.product.price,
        })),
      };

      await API.post("/orders", orderData);
      if (!buyNowProduct) clearCart();
      setSuccess("Order placed successfully ✅");
      setTimeout(() => navigate("/orders"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Order failed ❌");
    } finally {
      setPlacingOrder(false);
    }
  };

  /* === Early returns === */
  if (accessDenied) {
    return (
      <div className={styles.accessDenied}>
        <h2>We're Sorry</h2>
        <p>
          We're very sorry, but we're having trouble doing what you just asked
          us to do.
          <br />
          Please give us another chance - click the Back button on your browser
          and try your request again
        </p>
        <button onClick={() => navigate("/")} className={styles.goBackBtn}>
          Click to return to Homepage
        </button>
      </div>
    );
  }

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (items.length === 0)
    return <div className={styles.emptyCheckout}>No items to checkout.</div>;

  /* === MAIN CHECKOUT UI === */
  return (
    <div className={styles.checkoutContainer}>
      <h1 className={styles.checkoutTitle}>Checkout</h1>

      {/* === Items === */}
      <div className={styles.itemsSection}>
        {items.map((item) => (
          <div key={item.product._id} className={styles.itemRow}>
            <img
              src={`${API.URL}/${
                item.product.logo ||
                (item.product.images && item.product.images[0])
              }`}
              alt={item.product.name}
            />
            <div className={styles.itemInfo}>
              <p className={styles.itemName}>{item.product.name}</p>
              <p className={styles.itemPrice}>
                ₹
                {item.product.discountPrice > 0
                  ? item.product.discountPrice
                  : item.product.price}{" "}
                × {item.quantity}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* === Address Section === */}
      <div className={styles.addressSection}>
        <h2>Delivery Address</h2>

        {addresses.length > 0 && !addMode && (
          <>
            <div className={styles.addressList}>
              {addresses.map((addr) => (
                <div
                  key={addr._id}
                  className={`${styles.addressCard} ${
                    selectedAddress === addr._id ? styles.default : ""
                  }`}
                >
                  {editId !== addr._id ? (
                    <>
                      <div className={styles.addressHeader}>
                        <label>
                          <input
                            type="radio"
                            name="address"
                            value={addr._id}
                            checked={selectedAddress === addr._id}
                            onChange={() => setSelectedAddress(addr._id)}
                          />
                          <span className={styles.addrLabel}>
                            {addr.label || "Address"}
                          </span>
                        </label>
                        <button
                          className={styles.editBtn}
                          onClick={() => startEdit(addr)}
                        >
                          Edit
                        </button>
                      </div>
                      <p className={styles.addrLine}>
                        {addr.houseNo}, {addr.laneOrSector}
                        {addr.landmark && `, ${addr.landmark}`}, {addr.pincode}
                      </p>
                    </>
                  ) : (
                    <div className={styles.editForm}>
                      <input
                        className={styles.input}
                        placeholder="Label"
                        value={editForm.label || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, label: e.target.value })
                        }
                      />
                      <input
                        className={styles.input}
                        placeholder="House No"
                        value={editForm.houseNo || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, houseNo: e.target.value })
                        }
                      />
                      <input
                        className={styles.input}
                        placeholder="Lane / Sector"
                        value={editForm.laneOrSector || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            laneOrSector: e.target.value,
                          })
                        }
                      />
                      <input
                        className={styles.input}
                        placeholder="Landmark"
                        value={editForm.landmark || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, landmark: e.target.value })
                        }
                      />
                      <input
                        className={styles.input}
                        placeholder="Pincode"
                        maxLength="6"
                        inputMode="numeric"
                        value={editForm.pincode || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setEditForm({ ...editForm, pincode: val });
                        }}
                      />
                      <div className={styles.editActions}>
                        <button className={styles.saveBtn} onClick={saveEdit}>
                          Save
                        </button>
                        <button
                          className={styles.cancelBtn}
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {addresses.length < 3 && editId === null && (
              <div className={styles.addButtonWrap}>
                <button
                  className={styles.addBtnPrimary}
                  onClick={() => setAddMode(true)}
                >
                  + Add New Address
                </button>
              </div>
            )}
          </>
        )}

        {(addresses.length === 0 || addMode) && addresses.length < 3 ? (
          <div className={styles.addFormCard}>
            <h4 className={styles.addHeading}>Add New Address</h4>
            <input
              className={styles.input}
              placeholder="Label (Home / Office)"
              value={addForm.label || ""}
              onChange={(e) =>
                setAddForm({ ...addForm, label: e.target.value })
              }
            />
            <input
              className={styles.input}
              placeholder="House No *"
              value={addForm.houseNo || ""}
              onChange={(e) =>
                setAddForm({ ...addForm, houseNo: e.target.value })
              }
            />
            <input
              className={styles.input}
              placeholder="Lane / Sector *"
              value={addForm.laneOrSector || ""}
              onChange={(e) =>
                setAddForm({ ...addForm, laneOrSector: e.target.value })
              }
            />
            <input
              className={styles.input}
              placeholder="Landmark"
              value={addForm.landmark || ""}
              onChange={(e) =>
                setAddForm({ ...addForm, landmark: e.target.value })
              }
            />
            <input
              className={styles.input}
              placeholder="Pincode *"
              maxLength="6"
              inputMode="numeric"
              value={addForm.pincode || ""}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setAddForm({ ...addForm, pincode: val });
              }}
            />
            <div className={styles.addFormActions}>
              <button className={styles.saveBtn} onClick={handleAddAddress}>
                Save
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => setAddMode(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* === Summary === */}
      <div className={styles.summary}>
        <h3>Total: ₹{total.toFixed(2)}</h3>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
        <button
          className={styles.placeOrderBtn}
          onClick={handlePlaceOrder}
          disabled={placingOrder}
        >
          {placingOrder ? "Placing..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}
