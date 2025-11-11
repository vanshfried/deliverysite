import React, { useEffect, useState, useRef } from "react";
import API from "../../api/api";
import styles from "../../css/DeliveryDashboard.module.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ------------------------ Leaflet Default Icon Fix ------------------------
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ------------------------ MapPicker Component ------------------------
function MapPicker({ coords, setCoords, label, shrink }) {
  const [position, setPosition] = useState(coords);

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        const newCoords = { lat, lon: lng };
        setPosition(newCoords);
        setCoords(newCoords);
      },
    });
    return position ? (
      <Marker position={[position.lat, position.lon]}>
        <Popup>{label}</Popup>
      </Marker>
    ) : null;
  };

  return (
    <MapContainer
      center={[position.lat, position.lon]}
      zoom={15}
      minZoom={5}
      className={`${styles.mapContainer} ${shrink ? styles.shrink : ""}`}
    >
      <TileLayer
        url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        subdomains={["mt0", "mt1", "mt2", "mt3"]}
      />
      <LocationMarker />
    </MapContainer>
  );
}

// ------------------------ Main Dashboard Component ------------------------
export default function DeliveryDashboard() {
  const [deliveryBoy, setDeliveryBoy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [liveCoords, setLiveCoords] = useState({ lat: 20.5937, lon: 78.9629 });
  const [mapShrink, setMapShrink] = useState(false);

  const msgTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const watchIdRef = useRef(null);

  // ------------------------ Helper Functions ------------------------
  const showMessage = (text, duration = 3000) => {
    setMsg(text);
    if (msgTimeoutRef.current) clearTimeout(msgTimeoutRef.current);
    msgTimeoutRef.current = setTimeout(() => setMsg(""), duration);
  };

  const updateLiveLocation = async ({ lat, lon }) => {
    try {
      await API.patch("/api/delivery/orders/location", { lat, lon });
    } catch (err) {
      console.error("Failed to update location", err);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation)
      return showMessage("Geolocation not supported ❌");
    showMessage("Tracking live location...");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (accuracy > 50) return;
        const coords = {
          lat: Number(latitude.toFixed(6)),
          lon: Number(longitude.toFixed(6)),
        };
        setLiveCoords(coords);
        updateLiveLocation(coords);
      },
      () => showMessage("Failed to get live location ❌"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current)
      navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
  };

  // ------------------------ API Calls ------------------------
  const fetchProfile = async () => {
    try {
      const res = await API.get("/api/delivery/me");
      if (!mountedRef.current) return;
      if (res?.data?.success) {
        const data = res.data.deliveryBoy;
        setDeliveryBoy(data);
        if (data.location?.coordinates) {
          const [lon, lat] = data.location.coordinates;
          setLiveCoords({ lat, lon });
        }
        if (data.currentOrder) fetchCurrentOrder(data.currentOrder);
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
        await fetchProfile();
        fetchNextOrder();
      } else showMessage(res?.data?.message || `Failed to ${decision} order`);
    } catch (err) {
      if (!mountedRef.current) return;
      showMessage(err.response?.data?.message || "Request failed");
    }
  };

  // ------------------------ Map & Address Rendering ------------------------
  const renderAddress = (address) => {
    if (!address) return <p className={styles.noOrder}>No address</p>;
    const { label, houseNo, laneOrSector, landmark, pincode, coords } = address;
    const addressLine = [label, houseNo, laneOrSector, landmark, pincode]
      .filter(Boolean)
      .join(", ");
    return (
      <div className={styles.addressCardCompact}>
        {addressLine}
        {coords && (
          <span>
            {" "}
            | Lat: {coords.lat}, Lon: {coords.lon}
          </span>
        )}
      </div>
    );
  };

  const renderMap = (orderCoords) => {
    if (!orderCoords) return null;
    const polylinePositions = [
      [liveCoords.lat, liveCoords.lon],
      [orderCoords.lat, orderCoords.lon],
    ];
    return (
      <MapContainer
        center={[orderCoords.lat, orderCoords.lon]}
        zoom={15}
        className={`${styles.mapContainer} ${mapShrink ? styles.shrink : ""}`}
      >
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
        />
        <Marker position={[orderCoords.lat, orderCoords.lon]}>
          <Popup>Delivery Location</Popup>
        </Marker>
        <Marker position={[liveCoords.lat, liveCoords.lon]}>
          <Popup>My Live Location</Popup>
        </Marker>
        <Polyline positions={polylinePositions} color="#2196f3" />
      </MapContainer>
    );
  };

  // ------------------------ Lifecycle ------------------------
  useEffect(() => {
    mountedRef.current = true;
    fetchProfile();
    return () => {
      mountedRef.current = false;
      if (msgTimeoutRef.current) clearTimeout(msgTimeoutRef.current);
      stopTracking();
    };
  }, []);

  useEffect(() => {
    if (deliveryBoy?.isActive) {
      startTracking();
      if (!deliveryBoy?.currentOrder) fetchNextOrder();
    } else {
      stopTracking();
      setCurrentOrder(null);
    }
  }, [deliveryBoy?.isActive]);

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!deliveryBoy)
    return <p className={styles.error}>{msg || "No profile found"}</p>;

  const { stats } = deliveryBoy;
  const totalOrders = stats.accepted + stats.delivered + stats.ignored;

  // ------------------------ Render ------------------------
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

      <section className={styles.locationPicker}>
        <h2>Manual Location Fallback</h2>
        <MapPicker
          coords={liveCoords}
          setCoords={setLiveCoords}
          label="My Location"
          shrink={mapShrink}
        />
        <div className={styles.locationButtons}>
          <button
            className={styles.getLiveBtn}
            onClick={() => {
              if (!navigator.geolocation)
                return showMessage("Geolocation not supported");
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const coords = {
                    lat: Number(pos.coords.latitude.toFixed(6)),
                    lon: Number(pos.coords.longitude.toFixed(6)),
                  };
                  setLiveCoords(coords);
                  updateLiveLocation(coords);
                  showMessage("Live location updated ✅");
                },
                () => showMessage("Failed to get live location ❌"),
                { enableHighAccuracy: true }
              );
            }}
          >
            Get Live Location
          </button>
          <button
            className={styles.saveLocationBtn}
            onClick={() => {
              updateLiveLocation(liveCoords);
              showMessage("Location saved ✅");
              setMapShrink(true); // shrink map after save
            }}
          >
            Save Location
          </button>
        </div>
      </section>
    </div>
  );
}
