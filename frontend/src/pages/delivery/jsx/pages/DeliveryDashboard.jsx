import React, { useEffect, useState, useRef } from "react";
import API from "../../api/api";
import styles from "../../css/DeliveryDashboard.module.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// MapPicker for delivery location
function MapPicker({ coords, setCoords }) {
  const [position, setPosition] = useState(coords);

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition({ lat, lon: lng });
        setCoords({ lat, lon: lng });
      },
    });

    return position ? (
      <Marker position={[position.lat, position.lon]}>
        <Popup>Delivery Location</Popup>
      </Marker>
    ) : null;
  };

  return (
    <MapContainer
      center={[position.lat, position.lon]}
      zoom={15}
      minZoom={5}
      style={{ height: "300px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        subdomains={["mt0", "mt1", "mt2", "mt3"]}
      />
      <LocationMarker />
    </MapContainer>
  );
}

export default function DeliveryDashboard() {
  const [deliveryBoy, setDeliveryBoy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);

  const msgTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const showMessage = (text, duration = 3000) => {
    setMsg(text);
    if (msgTimeoutRef.current) clearTimeout(msgTimeoutRef.current);
    msgTimeoutRef.current = setTimeout(() => setMsg(""), duration);
  };

  // Fetch delivery boy profile
  const fetchProfile = async () => {
    try {
      const res = await API.get("/api/delivery/me");
      if (!mountedRef.current) return;

      if (res?.data?.success) {
        const deliveryBoyData = res.data.deliveryBoy;
        setDeliveryBoy(deliveryBoyData);

        if (deliveryBoyData.currentOrder) {
          fetchCurrentOrder(deliveryBoyData.currentOrder);
        }
      } else showMessage(res?.data?.error || "Failed to fetch profile");
    } catch (err) {
      if (!mountedRef.current) return;
      showMessage(err.response?.data?.error || "Something went wrong");
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  };

  const fetchCurrentOrder = async (orderId) => {
    setOrderLoading(true);
    try {
      const res = await API.get("/api/delivery/orders/my");
      if (!mountedRef.current) return;

      const activeOrder = res.data.orders.find((o) => o._id === orderId);
      setCurrentOrder(activeOrder || null);
    } catch (err) {
      if (!mountedRef.current) return;
      showMessage(
        err.response?.data?.message || "Failed to fetch active order"
      );
      setCurrentOrder(null);
    } finally {
      if (!mountedRef.current) return;
      setOrderLoading(false);
    }
  };

  const toggleStatus = async () => {
    try {
      const res = await API.patch("/api/delivery/status", {
        isActive: !deliveryBoy.isActive,
      });
      if (res?.data?.success) {
        setDeliveryBoy((prev) => ({ ...prev, isActive: !prev.isActive }));
        showMessage(res.data.message);
      } else showMessage(res?.data?.error || "Failed to update status");
    } catch (err) {
      showMessage(err.response?.data?.error || "Request failed");
    }
  };

  const fetchNextOrder = async () => {
    setOrderLoading(true);
    try {
      const res = await API.get("/api/delivery/orders/available");
      if (!mountedRef.current) return;
      const nextOrder = res?.data?.orders?.[0] || null;
      setCurrentOrder(nextOrder);
      if (!nextOrder) showMessage("No pending orders");
    } catch (err) {
      if (!mountedRef.current) return;
      setCurrentOrder(null);
      showMessage(err.response?.data?.message || "Failed to fetch orders");
    } finally {
      if (!mountedRef.current) return;
      setOrderLoading(false);
    }
  };

  const handleOrderDecision = async (decision) => {
    if (!currentOrder) return;

    const endpoint =
      decision === "accept"
        ? `/api/delivery/orders/accept/${currentOrder._id}`
        : `/api/delivery/orders/reject/${currentOrder._id}`;

    try {
      const res = await API.patch(endpoint);
      if (!mountedRef.current) return;

      if (res?.data?.success) {
        showMessage(res.data.message);
        setCurrentOrder(null);

        // Refresh profile stats
        const profileRes = await API.get("/api/delivery/me");
        if (profileRes?.data?.success) {
          setDeliveryBoy(profileRes.data.deliveryBoy);
          if (profileRes.data.deliveryBoy.currentOrder) {
            fetchCurrentOrder(profileRes.data.deliveryBoy.currentOrder);
          }
        }

        // Fetch next available order
        fetchNextOrder();
      } else showMessage(res?.data?.message || `Failed to ${decision} order`);
    } catch (err) {
      if (!mountedRef.current) return;
      showMessage(err.response?.data?.message || "Request failed");
    }
  };

  const useMyLocation = (setCoords) => {
    if (!navigator.geolocation) {
      return showMessage("Geolocation not supported ❌");
    }

    showMessage("Fetching location...");
    const tryGetPosition = (retries = 3) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          if (accuracy > 20 && retries > 0) {
            tryGetPosition(retries - 1);
            return;
          }
          setCoords({
            lat: Number(latitude.toFixed(6)),
            lon: Number(longitude.toFixed(6)),
          });
          showMessage("Location fetched ✅", 2000);
        },
        () => showMessage("Failed to get location ❌"),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };
    tryGetPosition();
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchProfile();
    return () => {
      mountedRef.current = false;
      if (msgTimeoutRef.current) clearTimeout(msgTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (deliveryBoy?.isActive && !deliveryBoy?.currentOrder) fetchNextOrder();
    else if (!deliveryBoy?.isActive) setCurrentOrder(null);
  }, [deliveryBoy?.isActive]);

  const renderAddress = (address) => {
    if (!address) return <p className={styles.noOrder}>No address</p>;
    const { label, houseNo, laneOrSector, landmark, pincode, coords } = address;
    const addressLine = [label, houseNo, laneOrSector, landmark, pincode]
      .filter(Boolean)
      .join(", ");
    return (
      <div className={styles.addressCardCompact}>
        {addressLine}
        {coords && typeof coords === "object" && (
          <span>
            {" "}
            | Lat: {coords.lat}, Lon: {coords.lon}
          </span>
        )}
      </div>
    );
  };

  const renderMap = (coords) => {
    if (!coords) return null;

    return (
      <div className={styles.mapContainer}>
        <MapContainer
          center={[coords.lat, coords.lon]}
          zoom={15}
          minZoom={5}
          style={{ height: "300px", width: "100%" }}
          scrollWheelZoom={false} // disable zoom scrolling
          doubleClickZoom={false} // disable double click zoom
          dragging={false} // disable dragging
          touchZoom={false} // disable touch zoom
          keyboard={false} // disable keyboard controls
        >
          <TileLayer
            url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            subdomains={["mt0", "mt1", "mt2", "mt3"]}
          />
          <Marker position={[coords.lat, coords.lon]}>
            <Popup>Delivery Location</Popup>
          </Marker>
        </MapContainer>
      </div>
    );
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!deliveryBoy)
    return <p className={styles.error}>{msg || "No profile found"}</p>;

  const { stats } = deliveryBoy;
  const totalOrders = stats.accepted + stats.delivered + stats.ignored;

  return (
    <div className={styles.dashboard}>
      {msg && <div className={styles.toast}>{msg}</div>}

      <header className={styles.header}>
        <h1>Welcome, {deliveryBoy.name}</h1>
        <button
          className={`${styles.toggleStatus} ${
            deliveryBoy.isActive ? styles.active : ""
          }`}
          onClick={toggleStatus}
          disabled={!!deliveryBoy.currentOrder}
        >
          {deliveryBoy.isActive ? "Go Inactive" : "Go Active"}
        </button>
      </header>

      <section className={styles.stats}>
        {[
          { label: "Accepted", value: stats.accepted, color: "accepted" },
          { label: "Delivered", value: stats.delivered, color: "delivered" },
          { label: "Rejected", value: stats.ignored, color: "rejected" },
          { label: "Total Orders", value: totalOrders, color: "total" },
          { label: "Rating", value: stats.rating.toFixed(1), color: "rating" },
        ].map((s, idx) => (
          <div key={idx} className={`${styles.statCard} ${styles[s.color]}`}>
            <p className={styles.statLabel}>{s.label}</p>
            <span className={styles.statValue}>{s.value}</span>
          </div>
        ))}
      </section>

      {deliveryBoy.isActive && (
        <section className={styles.currentOrder}>
          <h2>Current Order</h2>
          {orderLoading ? (
            <p>Loading order...</p>
          ) : currentOrder ? (
            <div className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <span>
                  <strong>Order:</strong> {currentOrder.slug}
                </span>
                <span>
                  <strong>Status:</strong> {currentOrder.status}
                </span>
              </div>

              <div className={styles.customerInfo}>
                <p>
                  <strong>Customer:</strong> {currentOrder.user?.name}
                </p>
                <p>
                  <strong>Phone:</strong> {currentOrder.user?.phone}
                </p>
              </div>

              {renderAddress(currentOrder.deliveryAddress)}
              {currentOrder.deliveryAddress?.coords &&
                renderMap(currentOrder.deliveryAddress.coords)}

              {currentOrder.items?.length > 0 && (
                <div className={styles.itemsList}>
                  <h4>Items</h4>
                  {currentOrder.items.map((i, idx) => (
                    <p key={idx}>
                      {i.name} × {i.quantity}
                    </p>
                  ))}
                </div>
              )}

              <div className={styles.orderFooter}>
                <span>
                  <strong>Total:</strong> ₹{currentOrder.totalAmount}
                </span>
                <span>
                  <strong>Payment:</strong> {currentOrder.paymentMethod}
                </span>
              </div>

              <div className={styles.orderButtons}>
                {!deliveryBoy.currentOrder && (
                  <>
                    <button
                      className={styles.acceptBtn}
                      onClick={() => handleOrderDecision("accept")}
                    >
                      Accept
                    </button>
                    <button
                      className={styles.rejectBtn}
                      onClick={() => handleOrderDecision("reject")}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className={styles.noOrder}>No pending orders</p>
          )}
        </section>
      )}
    </div>
  );
}
