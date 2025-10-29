import React, { useEffect, useState } from "react";
import API from "../../api/api";
import styles from "./css/Settings.module.css";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");

  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    label: "",
    houseNo: "",
    laneOrSector: "",
    landmark: "",
    pincode: "",
    coords: { lat: 0, lon: 0 }
  });

  // ✅ Fetch User Details on Load
  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const res = await API.get("/users/me");
    if (!res) return setLoading(false);

    setUser(res.data.user);
    setName(res.data.user.name || "");
    setAddresses(res.data.user.addresses || []);
    setLoading(false);
  };

  // ✅ Update Name
  const updateName = async () => {
    if (!name.trim()) return alert("Enter a valid name");

    const res = await API.put("/users/update", { name });
    if (!res) return;

    setUser(res.data.user);
    alert("✅ Name Updated");
  };

  // ✅ Add Address (limit 3)
  const handleAddAddress = async () => {
    if (!newAddress.houseNo || !newAddress.laneOrSector || !newAddress.pincode) {
      return alert("❌ Required fields missing");
    }

    if (!/^\d{6}$/.test(newAddress.pincode)) {
      return alert("❌ Pincode must be 6 digits");
    }

    const res = await API.post("/users/address", newAddress);
    if (!res) return;

    setAddresses(res.data.addresses);
    setNewAddress({
      label: "",
      houseNo: "",
      laneOrSector: "",
      landmark: "",
      pincode: "",
      coords: { lat: 0, lon: 0 }
    });

    alert("✅ Address added");
  };

  // ✅ Delete Address
  const deleteAddress = async (id) => {
    if (!confirm("Remove this address?")) return;

    const res = await API.delete(`/users/address/${id}`);
    if (!res) return;

    setAddresses(res.data.addresses);
  };

  // ✅ Logout
  const logout = async () => {
    await API.post("/users/logout");
    window.location.href = "/";
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Account Settings</h2>

      {/* ✅ Update Name */}
      <div className={styles.section}>
        <label className={styles.label}>Full Name</label>
        <input
          className={styles.input}
          value={name}
          placeholder="Enter your name"
          onChange={(e) => setName(e.target.value)}
        />
        <button className={styles.btn} onClick={updateName}>
          Save Name
        </button>
      </div>

      {/* ✅ Address Management */}
      <div className={styles.section}>
        <h3>My Addresses</h3>

        {addresses.length === 0 && <p>No addresses added.</p>}

        {addresses.map((addr) => (
          <div key={addr._id} className={styles.addressCard}>
            <strong>{addr.label || "Address"}</strong>
            <p>{addr.houseNo}, {addr.laneOrSector}</p>
            {addr.landmark && <p>{addr.landmark}</p>}
            <p>{addr.pincode}</p>

            <button
              className={styles.deleteBtn}
              onClick={() => deleteAddress(addr._id)}
            >
              Remove
            </button>
          </div>
        ))}

        {/* Only allow max 3 */}
        {addresses.length < 3 && (
          <div className={styles.addForm}>
            <h4>Add New Address</h4>

            <input
              className={styles.input}
              placeholder="Label (Home / Office)"
              value={newAddress.label}
              onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
            />

            <input
              className={styles.input}
              placeholder="House No *"
              value={newAddress.houseNo}
              onChange={(e) => setNewAddress({ ...newAddress, houseNo: e.target.value })}
            />

            <input
              className={styles.input}
              placeholder="Lane / Sector *"
              value={newAddress.laneOrSector}
              onChange={(e) =>
                setNewAddress({ ...newAddress, laneOrSector: e.target.value })
              }
            />

            <input
              className={styles.input}
              placeholder="Landmark"
              value={newAddress.landmark}
              onChange={(e) =>
                setNewAddress({ ...newAddress, landmark: e.target.value })
              }
            />

            <input
              className={styles.input}
              placeholder="Pincode *"
              maxLength="6"
              value={newAddress.pincode}
              onChange={(e) =>
                setNewAddress({ ...newAddress, pincode: e.target.value })
              }
            />

            <button className={styles.btnAdd} onClick={handleAddAddress}>
              Add Address
            </button>
          </div>
        )}
      </div>

      {/* ✅ Logout */}
      <button className={styles.logoutBtn} onClick={logout}>
        Logout
      </button>
    </div>
  );
}
