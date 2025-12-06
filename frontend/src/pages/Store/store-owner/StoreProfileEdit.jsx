// StoreProfileEdit.jsx
import React, { useEffect, useState } from "react";
import { updateStoreProfile, storeOwnerMe } from "../api/storeOwner";
import { useNavigate } from "react-router-dom";
import StoreOwnerLayout from "../components/StoreOwnerLayout";
import styles from "../css/StoreProfileEdit.module.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ---------------- Fix Leaflet Marker ----------------
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ---------------- Map Picker ----------------
const MapPicker = ({ coords, setCoords }) => {
  const [position, setPosition] = useState(coords || { lat: 28, lon: 78 });

  // ✅ Sync marker when coords change from backend
  useEffect(() => {
    if (coords?.lat && coords?.lon) {
      setPosition(coords);
    }
  }, [coords]);

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition({ lat, lon: lng });
        setCoords({ lat, lon: lng });
      },
    });

    return position ? <Marker position={[position.lat, position.lon]} /> : null;
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

// ---------------- Auto Detect Location ----------------
const useMyLocation = (setForm) => {
  if (!navigator.geolocation) return alert("Geolocation not supported");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      setForm((prev) => ({
        ...prev,
        location: {
          lat: Number(latitude.toFixed(6)),
          lon: Number(longitude.toFixed(6)),
          accuracy,
        },
      }));
    },
    () => alert("Failed to get location"),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
};

export default function StoreProfileEdit() {
  const [store, setStore] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    address: "",
    description: "",
    phone: "",
    openingTime: "",
    closingTime: "",
    storeImage: null,

    // ✅ NEW
    location: null,
  });

  const navigate = useNavigate();

  // ---------------- Load Store ----------------
  useEffect(() => {
    const loadData = async () => {
      const res = await storeOwnerMe();
      if (res?.data?.store) {
        const s = res.data.store;
        setStore(s);

        setForm({
          address: s.address || "",
          description: s.description || "",
          phone: s.phone || "",
          openingTime: s.openingTime || "",
          closingTime: s.closingTime || "",
          storeImage: null,

          // ✅ load saved store location
          location: s.location || null,
        });

        if (s.storeImage) setImagePreview(s.storeImage);
      }
    };
    loadData();
  }, []);

  if (!store) return <p>Loading store profile...</p>;

  // ---------------- Handlers ----------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, storeImage: file });
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.location?.lat || !form.location?.lon) {
      return alert("Please pick store location on map");
    }

    const fd = new FormData();
    fd.append("address", form.address);
    fd.append("description", form.description);
    fd.append("phone", form.phone);
    fd.append("openingTime", form.openingTime);
    fd.append("closingTime", form.closingTime);

    // ✅ IMPORTANT: Send location as JSON
    fd.append("location", JSON.stringify(form.location));

    if (form.storeImage) fd.append("storeImage", form.storeImage);

    const res = await updateStoreProfile(fd);
    if (res) navigate("/store-owner/dashboard");
  };

  return (
    <StoreOwnerLayout>
      <div className={styles.container}>
        {/* ===== HEADER ===== */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Store Profile</h2>
            <p className={styles.subtitle}>
              Manage how your store appears to customers
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.grid}>
            {/* ===== LEFT COLUMN ===== */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>Store Information</div>

              {/* IMAGE */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Store Image</label>
                <div className={styles.imageRow}>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Store"
                      className={styles.imagePreview}
                    />
                  ) : (
                    <div className={styles.imagePlaceholder}>No Image</div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                </div>
              </div>

              {/* ADDRESS */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Store Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              {/* PHONE */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              {/* DESCRIPTION */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className={styles.textarea}
                />
              </div>
            </div>

            {/* ===== RIGHT COLUMN ===== */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>Location & Timings</div>

              {/* MAP */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Store Location</label>
                <div className={styles.mapWrap}>
                  <MapPicker
                    coords={form.location}
                    setCoords={(location) => setForm({ ...form, location })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => useMyLocation(setForm)}
                  className={styles.locationBtn}
                >
                  Use My Current Location
                </button>
              </div>

              {/* TIME */}
              <div className={styles.timeRow}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>Opening Time</label>
                  <input
                    type="time"
                    name="openingTime"
                    value={form.openingTime}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>Closing Time</label>
                  <input
                    type="time"
                    name="closingTime"
                    value={form.closingTime}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ===== STICKY SAVE BAR ===== */}
          <div className={styles.saveBar}>
            <button type="submit" className={styles.saveBtn}>
              Save Store Changes
            </button>
          </div>
        </form>
      </div>
    </StoreOwnerLayout>
  );
}
