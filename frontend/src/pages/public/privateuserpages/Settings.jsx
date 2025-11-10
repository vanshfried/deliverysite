import React, { useEffect, useState } from "react";
import API from "../../../api/api";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
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
  const [addForm, setAddForm] = useState({});

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 2300);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await API.get("/users/me");
      const u = res.data.user;
      setUser(u);
      setName(u.name || "");
      setAddresses(u.addresses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateName = async () => {
    if (!name.trim()) return showToast("Enter a valid name", "error");
    try {
      await API.put("/users/update", { name });
      setUser((prev) => ({ ...prev, name }));
      showToast("Name updated ✅");
    } catch {
      showToast("Failed to update name ❌", "error");
    }
  };

  // ------------------ MapPicker ------------------
  const MapPicker = ({ coords, setCoords }) => {
    const [position, setPosition] = useState(coords || { lat: 28, lon: 78 });

    const LocationMarker = () => {
      useMapEvents({
        click(e) {
          const { lat, lng } = e.latlng;
          setPosition({ lat, lon: lng });
          setCoords({ lat, lon: lng });
        },
      });
      return position ? (
        <Marker position={[position.lat, position.lon]} />
      ) : null;
    };

    return (
      <MapContainer
        center={[position.lat, position.lon]}
        zoom={15}
        style={{ height: "250px", width: "100%", marginBottom: "1rem" }}
      >
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
        />
        <LocationMarker />
      </MapContainer>
    );
  };

  const useMyLocation = (targetForm, setTargetForm) => {
    if (!navigator.geolocation)
      return showToast("Geolocation not supported ❌", "error");

    showToast("Fetching location...");
    const tryGetPosition = (retries = 3) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          if (accuracy > 20 && retries > 0) {
            tryGetPosition(retries - 1);
            return;
          }
          setTargetForm((prev) => ({
            ...prev,
            coords: {
              lat: Number(latitude.toFixed(6)),
              lon: Number(longitude.toFixed(6)),
            },
            accuracy,
          }));
          showToast("Location set ✅");
        },
        () => showToast("Failed to get location ❌", "error"),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };
    tryGetPosition();
  };

  const isValidCoords = (addr) =>
    addr &&
    addr.coords &&
    typeof addr.coords.lat === "number" &&
    typeof addr.coords.lon === "number";

  // ------------------ Address Handlers ------------------
  const handleAddAddress = async () => {
    if (!addForm.houseNo || !addForm.laneOrSector || !addForm.pincode)
      return showToast("Missing required fields ❌", "error");
    if (!/^\d{6}$/.test(addForm.pincode))
      return showToast("Pincode must be 6 digits ❌", "error");
    if (!isValidCoords(addForm))
      return showToast("Pick location on map ❌", "error");

    try {
      const res = await API.post("/users/address", addForm);
      if (res.data.addresses) setAddresses(res.data.addresses);
      if (res.data.defaultAddress)
        setUser((prev) => ({
          ...prev,
          defaultAddress: res.data.defaultAddress,
        }));
      setAddForm({});
      setAddMode(false);
      showToast("Address added ✅");
    } catch {
      showToast("Failed to add address ❌", "error");
    }
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
    if (!isValidCoords(editForm))
      return showToast("Pick location on map ❌", "error");

    try {
      const res = await API.put(`/users/address/${editId}`, editForm);
      if (res.data.addresses) setAddresses(res.data.addresses);
      setEditId(null);
      setEditForm({});
      showToast("Address updated ✅");
    } catch {
      showToast("Failed to update address ❌", "error");
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm({});
    setAddMode(false);
    setAddForm({});
  };

  const setDefaultAddress = async (id) => {
    try {
      const res = await API.put(`/users/address/default/${id}`);
      if (res.data.addresses) setAddresses(res.data.addresses);
      if (res.data.defaultAddress)
        setUser((prev) => ({
          ...prev,
          defaultAddress: res.data.defaultAddress,
        }));
      showToast("Default updated ✅");
    } catch {
      showToast("Failed to set default ❌", "error");
    }
  };

  const removeAddress = async (id) => {
    try {
      const res = await API.delete(`/users/address/${id}`);
      if (res.data.addresses) setAddresses(res.data.addresses);
      showToast("Removed ✅");
    } catch {
      showToast("Failed to remove ❌", "error");
    }
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
            cancelEdit();
          }}
          className={activeTab === "account" ? styles.activeTab : ""}
        >
          Account
        </button>
        <button
          onClick={() => {
            setActiveTab("addresses");
            cancelEdit();
          }}
          className={activeTab === "addresses" ? styles.activeTab : ""}
        >
          Addresses
        </button>
        <button
          onClick={() => {
            setActiveTab("delete");
            cancelEdit();
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
        {/* === Account Tab === */}
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

        {/* === Addresses Tab === */}
        {activeTab === "addresses" && (
          <section className={styles.section}>
            <h2>Saved Addresses</h2>

            {/* List Addresses */}
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className={`${styles.addressCard} ${
                  isDefault(addr) ? styles.defaultAddressCard : ""
                }`}
              >
                {editId === addr._id ? (
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
                    <MapPicker
                      coords={editForm.coords}
                      setCoords={(coords) =>
                        setEditForm({ ...editForm, coords })
                      }
                    />
                    <button
                      className={styles.useLocationBtn}
                      onClick={() => useMyLocation(editForm, setEditForm)}
                    >
                      Use My Location
                    </button>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.saveBtn}
                        onClick={saveEdit}
                        disabled={!isValidCoords(editForm)}
                      >
                        Save
                      </button>
                      <button className={styles.cancelBtn} onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
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
                )}
              </div>
            ))}

            {/* Add Address */}
            {addresses.length < 3 && editId === null && (
              <>
                {!addMode && (
                  <div className={styles.addButtonWrap}>
                    <button
                      className={styles.addBtnPrimary}
                      onClick={() => setAddMode(true)}
                    >
                      + Add New Address
                    </button>
                  </div>
                )}
                {addMode && (
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
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          pincode: e.target.value.replace(/\D/g, ""),
                        })
                      }
                    />
                    <MapPicker
                      coords={addForm.coords}
                      setCoords={(coords) => setAddForm({ ...addForm, coords })}
                    />
                    <button
                      className={styles.useLocationBtn}
                      onClick={() => useMyLocation(addForm, setAddForm)}
                    >
                      Use My Location
                    </button>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.saveBtn}
                        onClick={handleAddAddress}
                        disabled={!isValidCoords(addForm)}
                      >
                        Save
                      </button>
                      <button className={styles.cancelBtn} onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* === Delete Tab === */}
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
