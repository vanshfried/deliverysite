import React, { useEffect, useState } from "react";
import API from "../../../api/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./css/Settings.module.css";

// Fix default leaflet marker issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("account");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const [name, setName] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [addMode, setAddMode] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 2300);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const res = await API.get("/users/me");
    if (!res) return setLoading(false);
    const u = res.data.user;
    setUser(u);
    setName(u.name || "");
    setAddresses(u.addresses || []);
    setLoading(false);
  };

  const updateName = async () => {
    if (!name.trim()) return showToast("Enter a valid name", "error");
    const res = await API.put("/users/update", { name });
    if (!res) return;
    setUser((prev) => ({ ...prev, name }));
    showToast("Name updated ✅");
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      return showToast("Geolocation not supported ❌", "error");
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setEditForm((prev) => ({
          ...prev,
          coords: { lat: latitude, lon: longitude },
        }));
        showToast("Location set ✅");
      },
      () => showToast("Failed to get location ❌", "error")
    );
  };

  const isValidCoords = (addr) =>
    addr &&
    addr.coords &&
    typeof addr.coords.lat === "number" &&
    typeof addr.coords.lon === "number";

  // ---------------------------- Address handlers ----------------------------
  const handleAddAddress = async () => {
    if (!editForm.houseNo || !editForm.laneOrSector || !editForm.pincode)
      return showToast("Missing required fields ❌", "error");
    if (!/^\d{6}$/.test(editForm.pincode))
      return showToast("Pincode must be 6 digits ❌", "error");
    if (!isValidCoords(editForm)) return showToast("Set location ❌", "error");

    const res = await API.post("/users/address", editForm);
    if (!res) return;
    if (res.data.addresses) setAddresses(res.data.addresses);
    if (res.data.defaultAddress)
      setUser((prev) => ({ ...prev, defaultAddress: res.data.defaultAddress }));
    setEditForm({});
    setAddMode(false);
    showToast("Address added ✅");
  };

  const startEdit = (addr) => {
    setAddMode(false);
    setEditId(addr._id);
    setEditForm({ ...addr });
  };

  const saveEdit = async () => {
    if (!editForm.houseNo || !editForm.laneOrSector || !editForm.pincode)
      return showToast("Missing required fields ❌", "error");
    if (!/^\d{6}$/.test(editForm.pincode))
      return showToast("Pincode must be 6 digits ❌", "error");
    if (!isValidCoords(editForm)) return showToast("Set location ❌", "error");

    const res = await API.put(`/users/address/${editId}`, editForm);
    if (!res) return;
    if (res.data.addresses) setAddresses(res.data.addresses);
    setEditId(null);
    setEditForm({});
    showToast("Updated ✅");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm({});
    setAddMode(false);
  };

  const setDefaultAddress = async (id) => {
    const res = await API.put(`/users/address/default/${id}`);
    if (!res) return;
    if (res.data.addresses) setAddresses(res.data.addresses);
    if (res.data.defaultAddress)
      setUser((prev) => ({ ...prev, defaultAddress: res.data.defaultAddress }));
    showToast("Default updated ✅");
  };

  const removeAddress = async (id) => {
    const res = await API.delete(`/users/address/${id}`);
    if (!res) return;
    if (res.data.addresses) setAddresses(res.data.addresses);
    showToast("Removed ✅");
  };

  const deleteAccount = async () => {
    await API.delete("/users/delete");
    window.location.href = "/";
  };

  const logout = async () => {
    await API.post("/users/logout");
    window.location.href = "/";
  };

  const isDefault = (addr) =>
    user && String(user.defaultAddress) === String(addr._id);

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.settingsLayout}>
      {toast.show && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}

      <aside className={styles.sidebar}>
        <button
          onClick={() => {
            setActiveTab("account");
            setEditId(null);
            setAddMode(false);
          }}
          className={activeTab === "account" ? styles.activeTab : ""}
        >
          Account
        </button>
        <button
          onClick={() => {
            setActiveTab("addresses");
            setEditId(null);
            setAddMode(false);
          }}
          className={activeTab === "addresses" ? styles.activeTab : ""}
        >
          Addresses
        </button>
        <button
          onClick={() => {
            setActiveTab("delete");
            setEditId(null);
            setAddMode(false);
          }}
          className={activeTab === "delete" ? styles.activeTab : ""}
        >
          Delete Account
        </button>
        <button className={styles.logoutBtn} onClick={logout}>
          Logout
        </button>
      </aside>

      <main className={styles.content}>
        {activeTab === "account" && (
          <section className={styles.section}>
            <h2>Profile</h2>
            <p className={styles.phoneDisplay}>📞 {user.phone}</p>
            <label>Full Name</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className={styles.btn} onClick={updateName}>
              Save
            </button>

            {user.defaultAddress && (
              <div className={styles.defaultInfo}>
                <strong>Default delivery:</strong>{" "}
                {(() => {
                  const da = addresses.find(
                    (a) => String(a._id) === String(user.defaultAddress)
                  );
                  if (!da) return <span>Not set</span>;
                  return (
                    <span>
                      {da.label || "Address"} — {da.houseNo}, {da.laneOrSector}{" "}
                      ({da.pincode})
                    </span>
                  );
                })()}
              </div>
            )}
          </section>
        )}

        {activeTab === "addresses" && (
          <section className={styles.section}>
            <h2>Saved Addresses</h2>
            {addresses.length === 0 && (
              <p className={styles.emptyText}>No addresses added yet.</p>
            )}

            {addresses.map((addr) => (
              <div
                key={addr._id}
                className={`${styles.addressCard} ${
                  isDefault(addr) ? styles.defaultAddressCard : ""
                }`}
              >
                {editId !== addr._id ? (
                  <>
                    <div className={styles.cardHeader}>
                      <strong className={styles.addrLabel}>
                        {addr.label || "Address"}
                      </strong>
                      {isDefault(addr) && (
                        <span className={styles.defaultBadge}>Default</span>
                      )}
                    </div>
                    <p className={styles.addrLine}>
                      {addr.houseNo}, {addr.laneOrSector}
                    </p>
                    {addr.landmark && (
                      <p className={styles.addrLine}>{addr.landmark}</p>
                    )}
                    <p className={styles.addrLine}>{addr.pincode}</p>
                    {addr.coords && (
                      <div className={styles.smallMap}>
                        <MapContainer
                          center={[addr.coords.lat, addr.coords.lon]}
                          zoom={16}
                          style={{ height: "100%", width: "100%" }}
                          scrollWheelZoom={false}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={[addr.coords.lat, addr.coords.lon]}>
                            <Popup>{addr.label || "Address"}</Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    )}
                    <div className={styles.cardActions}>
                      {!isDefault(addr) && (
                        <button
                          className={styles.setDefaultBtn}
                          onClick={() => setDefaultAddress(addr._id)}
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        className={styles.editBtn}
                        onClick={() => startEdit(addr)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => removeAddress(addr._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      placeholder="Label"
                      className={styles.input}
                      value={editForm.label || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, label: e.target.value })
                      }
                    />
                    <input
                      placeholder="House No"
                      className={styles.input}
                      value={editForm.houseNo || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, houseNo: e.target.value })
                      }
                    />
                    <input
                      placeholder="Lane / Sector"
                      className={styles.input}
                      value={editForm.laneOrSector || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          laneOrSector: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Landmark"
                      className={styles.input}
                      value={editForm.landmark || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, landmark: e.target.value })
                      }
                    />
                    <input
                      placeholder="Pincode"
                      className={styles.input}
                      maxLength="6"
                      inputMode="numeric"
                      value={editForm.pincode || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          pincode: e.target.value.replace(/\D/g, ""),
                        })
                      }
                    />

                    <button
                      className={styles.useLocationBtn}
                      onClick={useMyLocation}
                    >
                      Use My Location
                    </button>

                    {editForm.coords && (
                      <div className={styles.smallMap}>
                        <MapContainer
                          center={[editForm.coords.lat, editForm.coords.lon]}
                          zoom={16}
                          style={{ height: "100%", width: "100%" }}
                          scrollWheelZoom={false}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker
                            position={[
                              editForm.coords.lat,
                              editForm.coords.lon,
                            ]}
                          >
                            <Popup>{editForm.label || "Address"}</Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    )}

                    <div className={styles.cardActions}>
                      <button
                        className={styles.saveBtn}
                        onClick={editId ? saveEdit : handleAddAddress}
                        disabled={!isValidCoords(editForm)}
                      >
                        Save
                      </button>
                      <button className={styles.cancelBtn} onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {addresses.length < 3 && editId === null && !addMode && (
              <div className={styles.addButtonWrap}>
                <button
                  className={styles.addBtnPrimary}
                  onClick={() => {
                    setAddMode(true);
                    setEditForm({});
                  }}
                >
                  + Add New Address
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === "delete" && (
          <section className={styles.sectionDanger}>
            <h2>Delete Account</h2>
            <p className={styles.warningText}>
              This action is permanent and cannot be undone.
            </p>
            <button className={styles.deleteAccountBtn} onClick={deleteAccount}>
              Delete My Account
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
