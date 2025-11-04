import React, { useEffect, useState } from "react";
import API from "../../../api/api";
import styles from "./css/Settings.module.css";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("account");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const [name, setName] = useState("");

  const [addresses, setAddresses] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [addMode, setAddMode] = useState(false); // new: controls Add New Address form visibility

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
    // optional: update local user
    setUser((prev) => ({ ...prev, name }));
    showToast("Name updated ✅");
  };

  // Add new address (when addMode is true)
  const handleAddAddress = async () => {
    if (!editForm.houseNo || !editForm.laneOrSector || !editForm.pincode) {
      return showToast("Missing required fields ❌", "error");
    }
    if (!/^\d{6}$/.test(editForm.pincode)) {
      return showToast("Pincode must be 6 digits ❌", "error");
    }

    const res = await API.post("/users/address", editForm);
    if (!res) return;
    // backend returns addresses (and possibly defaultAddress)
    if (res.data.addresses) setAddresses(res.data.addresses);
    if (res.data.defaultAddress) setUser((prev) => ({ ...prev, defaultAddress: res.data.defaultAddress }));
    setEditForm({});
    setAddMode(false);
    showToast("Address added ✅");
  };

  const startEdit = (addr) => {
    setAddMode(false); // hide add form while editing
    setEditId(addr._id);
    setEditForm({ ...addr });
  };

  const saveEdit = async () => {
    if (!editForm.houseNo || !editForm.laneOrSector || !editForm.pincode) {
      return showToast("Missing required fields ❌", "error");
    }
    if (!/^\d{6}$/.test(editForm.pincode)) {
      return showToast("Pincode must be 6 digits ❌", "error");
    }

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
  };

  // Note: backend route is /users/address/default/:id
  const setDefaultAddress = async (id) => {
    const res = await API.put(`/users/address/default/${id}`);
    if (!res) return;
    if (res.data.addresses) setAddresses(res.data.addresses);
    if (res.data.defaultAddress) setUser((prev) => ({ ...prev, defaultAddress: res.data.defaultAddress }));
    else fetchUser(); // fallback
    showToast("Default updated ✅");
  };

  const removeAddress = async (id) => {
    const res = await API.delete(`/users/address/${id}`);
    if (!res) return;
    if (res.data.addresses) setAddresses(res.data.addresses);
    if (res.data.defaultAddress) setUser((prev) => ({ ...prev, defaultAddress: res.data.defaultAddress }));
    else fetchUser();
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

  // helpers
  const isDefault = (addr) => {
    if (!user) return false;
    // user.defaultAddress contains ObjectId or null
    return String(user.defaultAddress) === String(addr._id);
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.settingsLayout}>
      {/* toast */}
      {toast.show && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <button
          onClick={() => { setActiveTab("account"); setEditId(null); setAddMode(false); }}
          className={activeTab === "account" ? styles.activeTab : ""}
        >
          Account
        </button>

        <button
          onClick={() => { setActiveTab("addresses"); setEditId(null); setAddMode(false); }}
          className={activeTab === "addresses" ? styles.activeTab : ""}
        >
          Addresses
        </button>

        <button
          onClick={() => { setActiveTab("delete"); setEditId(null); setAddMode(false); }}
          className={activeTab === "delete" ? styles.activeTab : ""}
        >
          Delete Account
        </button>

        <button className={styles.logoutBtn} onClick={logout}>
          Logout
        </button>
      </aside>

      {/* Content */}
      <main className={styles.content}>

        {/* Account */}
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
            <button className={styles.btn} onClick={updateName}>Save</button>

            {/* show default address preview */}
            {user.defaultAddress && (
              <div className={styles.defaultInfo}>
                <strong>Default delivery:</strong>{" "}
                {(() => {
                  const da = addresses.find(a => String(a._id) === String(user.defaultAddress));
                  if (!da) return <span>Not set</span>;
                  return <span>{da.label || "Address"} — {da.houseNo}, {da.laneOrSector} ({da.pincode})</span>;
                })()}
              </div>
            )}
          </section>
        )}

        {/* Addresses */}
        {activeTab === "addresses" && (
          <section className={styles.section}>
            <h2>Saved Addresses</h2>

            {/* existing addresses */}
            {addresses.length === 0 && <p className={styles.emptyText}>No addresses added yet.</p>}

            {addresses.map((addr) => (
              <div
                key={addr._id}
                className={`${styles.addressCard} ${isDefault(addr) ? styles.defaultAddressCard : ""}`}
              >
                {editId !== addr._id ? (
                  <>
                    <div className={styles.cardHeader}>
                      <strong className={styles.addrLabel}>{addr.label || "Address"}</strong>
                      {isDefault(addr) && <span className={styles.defaultBadge}>Default</span>}
                    </div>

                    <p className={styles.addrLine}>{addr.houseNo}, {addr.laneOrSector}</p>
                    {addr.landmark && <p className={styles.addrLine}>{addr.landmark}</p>}
                    <p className={styles.addrLine}>{addr.pincode}</p>

                    <div className={styles.cardActions}>
                      {!isDefault(addr) && (
                        <button className={styles.setDefaultBtn} onClick={() => setDefaultAddress(addr._id)}>
                          Set Default
                        </button>
                      )}
                      <button className={styles.editBtn} onClick={() => startEdit(addr)}>Edit</button>
                      <button className={styles.deleteBtn} onClick={() => removeAddress(addr._id)}>Remove</button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* inline edit */}
                    <input
                      placeholder="Label"
                      className={styles.input}
                      value={editForm.label || ""}
                      onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    />
                    <input
                      placeholder="House No"
                      className={styles.input}
                      value={editForm.houseNo || ""}
                      onChange={(e) => setEditForm({ ...editForm, houseNo: e.target.value })}
                    />
                    <input
                      placeholder="Lane / Sector"
                      className={styles.input}
                      value={editForm.laneOrSector || ""}
                      onChange={(e) => setEditForm({ ...editForm, laneOrSector: e.target.value })}
                    />
                    <input
                      placeholder="Landmark"
                      className={styles.input}
                      value={editForm.landmark || ""}
                      onChange={(e) => setEditForm({ ...editForm, landmark: e.target.value })}
                    />
                    <input
                      placeholder="Pincode"
                      className={styles.input}
                      maxLength="6"
                      inputMode="numeric"
                      value={editForm.pincode || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setEditForm({ ...editForm, pincode: val });
                      }}
                    />

                    <div className={styles.cardActions}>
                      <button className={styles.saveBtn} onClick={saveEdit}>Save</button>
                      <button className={styles.cancelBtn} onClick={cancelEdit}>Cancel</button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Add New Address button (hidden while editing or when max reached) */}
            {addresses.length < 3 && editId === null && !addMode && (
              <div className={styles.addButtonWrap}>
                <button className={styles.addBtnPrimary} onClick={() => { setAddMode(true); setEditForm({}); }}>
                  + Add New Address
                </button>
              </div>
            )}

            {/* Add New Address form (visible when addMode true) */}
            {addMode && editId === null && (
              <div className={styles.addFormCard}>
                <h3 className={styles.addHeading}>Add New Address</h3>

                <input
                  className={styles.input}
                  placeholder="Label (Home / Office)"
                  value={editForm.label || ""}
                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                />
                <input
                  className={styles.input}
                  placeholder="House No *"
                  value={editForm.houseNo || ""}
                  onChange={(e) => setEditForm({ ...editForm, houseNo: e.target.value })}
                />
                <input
                  className={styles.input}
                  placeholder="Lane / Sector *"
                  value={editForm.laneOrSector || ""}
                  onChange={(e) => setEditForm({ ...editForm, laneOrSector: e.target.value })}
                />
                <input
                  className={styles.input}
                  placeholder="Landmark"
                  value={editForm.landmark || ""}
                  onChange={(e) => setEditForm({ ...editForm, landmark: e.target.value })}
                />
                <input
                  className={styles.input}
                  placeholder="Pincode *"
                  maxLength="6"
                  inputMode="numeric"
                  value={editForm.pincode || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setEditForm({ ...editForm, pincode: val });
                  }}
                />

                <div className={styles.addFormActions}>
                  <button className={styles.btnAdd} onClick={handleAddAddress}>Save</button>
                  <button className={styles.cancelBtn} onClick={() => { setAddMode(false); setEditForm({}); }}>Cancel</button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Delete Account */}
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
