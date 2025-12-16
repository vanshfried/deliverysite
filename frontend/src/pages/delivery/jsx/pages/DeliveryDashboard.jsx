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
import deliveryBoyImg from "../../../../Images/deliveryboy.png";
import locationlogo from "../../../../Images/locationlogo.png";
import storelogo from "../../../../Images/storelogo.png";

// ------------------------ Custom Icons ------------------------
const icons = {
  deliveryBoy: new L.Icon({
    iconUrl: deliveryBoyImg,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  }),
  store: new L.Icon({
    iconUrl: storelogo,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  }),
  customer: new L.Icon({
    iconUrl: locationlogo,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  }),
};

// ------------------------ Map Picker ------------------------
function MapPicker({ coords, setCoords, label, shrink, styles }) {
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
      <Marker position={[position.lat, position.lon]} icon={icons.deliveryBoy}>
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

// ------------------------ Main Component ------------------------
export default function DeliveryDashboard() {
  const [deliveryBoy, setDeliveryBoy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [liveCoords, setLiveCoords] = useState({ lat: 20.5937, lon: 78.9629 });
  const [mapShrink, setMapShrink] = useState(false);
  const [locationSet, setLocationSet] = useState(false);
  const [locationAllowed, setLocationAllowed] = useState(true);
  const [route, setRoute] = useState([]);
  const [storeRoute, setStoreRoute] = useState([]);
  const msgTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const watchIdRef = useRef(null);

  // OTP states
  const [pickupOTP, setPickupOTP] = useState(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const otpTimerRef = useRef(null);

  // ------------------------ Helpers ------------------------
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

  const fetchRoute = async (from, to, setRouteFn) => {
    if (!from || !to) return;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const json = await res.json();
      if (!json.routes || !json.routes[0]) return setRouteFn([]);
      const coordinates = json.routes[0].geometry.coordinates.map((c) => [
        c[1],
        c[0],
      ]);
      setRouteFn(coordinates);
    } catch (err) {
      console.error("Route fetch failed:", err);
      setRouteFn([]);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setLocationAllowed(false);
      return showMessage("Geolocation not supported ❌");
    }
    showMessage("Tracking live location...");
    setLocationAllowed(true);
    let bestAccuracy = Infinity;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy < bestAccuracy || bestAccuracy === Infinity) {
          bestAccuracy = accuracy;
          const coords = {
            lat: Number(latitude.toFixed(6)),
            lon: Number(longitude.toFixed(6)),
          };
          setLiveCoords(coords);
          updateLiveLocation(coords);

          if (currentOrder?.store?.location)
            fetchRoute(coords, currentOrder.store.location, setStoreRoute);
          if (currentOrder?.deliveryAddress?.coords)
            fetchRoute(
              currentOrder.store.location,
              currentOrder.deliveryAddress.coords,
              setRoute
            );

          showMessage(
            `GPS accuracy: ±${Math.round(accuracy)}m ${
              accuracy > 100 ? "⚠️" : "✅"
            }`
          );
        }
      },
      (err) => {
        console.error("Location fetch failed:", err);
        setLocationAllowed(false);
        showMessage("Your location is off — turn it on or set manually ⚠️");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
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
          setLocationSet(true);
        }
      } else showMessage(res?.data?.error || "Failed to fetch profile");
    } catch (err) {
      showMessage(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fetchNextOrder = async () => {
    setOrderLoading(true);
    try {
      const res = await API.get("/api/delivery/orders/available");
      if (!mountedRef.current) return;
      const nextOrder = res?.data?.orders?.[0] || null;
      setCurrentOrder(nextOrder);
      if (nextOrder?.deliveryAddress?.coords)
        fetchRoute(liveCoords, nextOrder.deliveryAddress.coords, setRoute);
      if (!nextOrder) showMessage("No pending orders");
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to fetch orders");
    } finally {
      setOrderLoading(false);
    }
  };

  const fetchCurrentOrder = async (orderId) => {
    setOrderLoading(true);
    try {
      const res = await API.get("/api/delivery/orders/my");
      if (!mountedRef.current) return;
      const activeOrder = res.data.orders.find((o) => o._id === orderId);
      setCurrentOrder(activeOrder || null);
      if (activeOrder?.pickupOTP && activeOrder?.pickupOTPExpires) {
        setPickupOTP(activeOrder.pickupOTP);
        setOtpExpiresAt(activeOrder.pickupOTPExpires);
        startOtpTimer(activeOrder.pickupOTPExpires);
      } else {
        setPickupOTP(null);
        setOtpExpiresAt(null);
        setOtpCountdown(0);
      }

      if (activeOrder?.deliveryAddress?.coords)
        fetchRoute(liveCoords, activeOrder.deliveryAddress.coords, setRoute);
    } catch {
      showMessage("Failed to fetch active order");
      setCurrentOrder(null);
    } finally {
      setOrderLoading(false);
    }
  };

  const toggleStatus = async () => {
    try {
      const res = await API.patch("/api/delivery/status", {
        isActive: !deliveryBoy.isActive,
      });
      if (res?.data?.success) {
        setDeliveryBoy((p) => ({ ...p, isActive: !p.isActive }));
        showMessage(res.data.message);
      } else showMessage(res?.data?.error || "Failed to update status");
    } catch {
      showMessage("Request failed");
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
      if (res?.data?.success) {
        showMessage(res.data.message);
        await fetchProfile();
        if (decision === "accept") fetchCurrentOrder(currentOrder._id);
        else {
          setCurrentOrder(null);
          fetchNextOrder();
        }
      } else showMessage(res?.data?.message || `Failed to ${decision} order`);
    } catch {
      showMessage("Request failed");
    }
  };

  // ------------------------ OTP Countdown Timer ------------------------
  const startOtpTimer = (expiresAt) => {
    if (otpTimerRef.current) clearInterval(otpTimerRef.current);

    const tick = () => {
      const diff = Math.floor((new Date(expiresAt) - new Date()) / 1000);
      if (diff <= 0) {
        clearInterval(otpTimerRef.current);
        setOtpCountdown(0);
        return;
      }
      setOtpCountdown(diff);
    };

    tick();
    otpTimerRef.current = setInterval(tick, 1000);
  };

  const generatePickupOtp = async () => {
    if (!currentOrder) return;

    try {
      const res = await API.patch(
        `/api/delivery/orders/generate-otp/${currentOrder._id}`
      );

      if (res?.data?.success) {
        const { otp, expiresAt } = res.data;

        setPickupOTP(otp);
        setOtpExpiresAt(expiresAt);
        startOtpTimer(expiresAt);

        showMessage("Pickup OTP generated ✔️");
      }
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to generate OTP ❌");
    }
  };

  const openGoogleNavigation = (from, to) => {
    if (!to?.lat || !to?.lon) {
      showMessage("Destination not available ❌");
      return;
    }
    const url = from
      ? `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lon}&destination=${to.lat},${to.lon}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lon}&travelmode=driving`;

    window.open(url, "_blank");
  };

  // ------------------------ Effects ------------------------
  useEffect(() => {
    mountedRef.current = true;
    fetchProfile();
    startTracking();
    return () => {
      mountedRef.current = false;
      if (msgTimeoutRef.current) clearTimeout(msgTimeoutRef.current);
      if (otpTimerRef.current) clearInterval(otpTimerRef.current);
      stopTracking();
    };
  }, []);

  useEffect(() => {
    if (deliveryBoy?.isActive && locationSet) {
      startTracking();
      if (deliveryBoy?.currentOrder)
        fetchCurrentOrder(deliveryBoy.currentOrder);
      else fetchNextOrder();
    } else {
      stopTracking();
      setCurrentOrder(null);
    }
  }, [deliveryBoy?.isActive, locationSet, deliveryBoy?.currentOrder]);

  // ------------------------ Render Helpers ------------------------
  const renderAddress = (a) => {
    if (!a) return <p className={styles.noOrder}>No address</p>;
    const line = [a.label, a.houseNo, a.laneOrSector, a.landmark, a.pincode]
      .filter(Boolean)
      .join(", ");
    return (
      <div className={styles.addressCardCompact}>
        {line}
        {a.coords && (
          <span>
            {" "}
            | Lat: {a.coords.lat}, Lon: {a.coords.lon}
          </span>
        )}
      </div>
    );
  };

  const renderMap = (coords) => {
    if (!coords) return null;
    return (
      <MapContainer
        center={[coords.lat, coords.lon]}
        zoom={15}
        className={styles.mapContainer}
      >
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
        />
        <Marker
          position={[liveCoords.lat, liveCoords.lon]}
          icon={icons.deliveryBoy}
        >
          <Popup>My Live Location</Popup>
        </Marker>
        {currentOrder?.store?.location && (
          <Marker
            position={[
              currentOrder.store.location.lat,
              currentOrder.store.location.lon,
            ]}
            icon={icons.store}
          >
            <Popup>Pickup: {currentOrder.store.storeName}</Popup>
          </Marker>
        )}
        {currentOrder?.deliveryAddress?.coords && (
          <Marker
            position={[
              currentOrder.deliveryAddress.coords.lat,
              currentOrder.deliveryAddress.coords.lon,
            ]}
            icon={icons.customer}
          >
            <Popup>Delivery Location</Popup>
          </Marker>
        )}
        {route.length > 0 && (
          <Polyline positions={route} color="#1976d2" weight={5} />
        )}
        {storeRoute.length > 0 && (
          <Polyline positions={storeRoute} color="#f39c12" weight={5} />
        )}
      </MapContainer>
    );
  };

  // ------------------------ Main Render ------------------------
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

      {!locationSet && (
        <section className={styles.locationSetup}>
          <h2>
            {locationAllowed
              ? "Set your starting location"
              : "Your location is off — turn it on or set manually ⚠️"}
          </h2>
          <MapPicker
            coords={liveCoords}
            setCoords={setLiveCoords}
            label="My Location"
            shrink={mapShrink}
            styles={styles}
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
                    showMessage("Live location updated ✅");
                  },
                  () => {
                    setLocationAllowed(false);
                    showMessage("Your location is off — set manually ⚠️");
                  },
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
                setLocationSet(true);
                setMapShrink(true);
                showMessage("Location saved ✅");
                if (deliveryBoy?.currentOrder)
                  fetchCurrentOrder(deliveryBoy.currentOrder);
                else fetchNextOrder();
              }}
            >
              Save Location
            </button>
          </div>
        </section>
      )}

      {locationSet && deliveryBoy.isActive && (
        <section className={styles.currentOrder}>
          <h2>
            {deliveryBoy.currentOrder ? "Active Order" : "Next Available Order"}
          </h2>
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
              {renderMap(currentOrder.deliveryAddress?.coords)}

              <div className={styles.orderButtons}>
                {/* --- Navigation Buttons --- */}
                {currentOrder?.store?.location && (
                  <button
                    className={styles.navigateBtn}
                    onClick={() =>
                      openGoogleNavigation(
                        liveCoords,
                        currentOrder.store.location
                      )
                    }
                  >
                    Navigate to Store 🏪
                  </button>
                )}

                {currentOrder?.deliveryAddress?.coords && (
                  <button
                    className={styles.navigateBtnBlue}
                    onClick={() =>
                      openGoogleNavigation(
                        liveCoords,
                        currentOrder.deliveryAddress.coords
                      )
                    }
                  >
                    Navigate to Customer 🏠
                  </button>
                )}

                {/* --- Action Buttons --- */}
                {!deliveryBoy.currentOrder ? (
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
                ) : (
                  <div className={styles.activeOrderNote}>
                    <p>✓ You are currently working on this order</p>
                  </div>
                )}
              </div>

              {/* --- OTP Section --- */}
              <div className={styles.otpSection}>
                <h3 className={styles.otpTitle}>Pickup OTP</h3>

                {pickupOTP ? (
                  <div className={styles.otpDisplay}>
                    <p
                      className={`${styles.otpCode} ${
                        otpCountdown <= 0 ? styles.otpExpiredText : ""
                      }`}
                    >
                      {pickupOTP}
                    </p>

                    <p
                      className={`${styles.otpTimer} ${
                        otpCountdown <= 0
                          ? styles.otpExpiredText
                          : styles.otpActiveText
                      }`}
                    >
                      {otpCountdown > 0
                        ? `Expires in ${Math.floor(otpCountdown / 60)}:${String(
                            otpCountdown % 60
                          ).padStart(2, "0")}`
                        : "OTP expired"}
                    </p>

                    <button
                      onClick={generatePickupOtp}
                      disabled={otpCountdown > 0}
                      className={`${styles.otpRegenBtn} ${
                        otpCountdown > 0 ? styles.btnDisabled : ""
                      }`}
                    >
                      {otpCountdown > 0
                        ? "You can regenerate after expiry"
                        : "Regenerate OTP"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={generatePickupOtp}
                    className={styles.otpGenerateBtn}
                  >
                    Generate Pickup OTP
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className={styles.noOrder}>No pending orders</p>
          )}
        </section>
      )}

      {locationSet && (
        <details className={styles.locationPicker}>
          <summary>Update My Location</summary>
          <MapPicker
            coords={liveCoords}
            setCoords={setLiveCoords}
            label="My Location"
            shrink={mapShrink}
            styles={styles}
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
                    if (currentOrder?.deliveryAddress?.coords)
                      fetchRoute(
                        coords,
                        currentOrder.deliveryAddress.coords,
                        setRoute
                      );
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
                setMapShrink(true);
                if (currentOrder?.deliveryAddress?.coords)
                  fetchRoute(
                    liveCoords,
                    currentOrder.deliveryAddress.coords,
                    setRoute
                  );
              }}
            >
              Save Location
            </button>
          </div>
        </details>
      )}
    </div>
  );
}
