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

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ------------------------ Map Picker ------------------------
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
  const [distanceKm, setDistanceKm] = useState(null);

  // NEW STATE FOR ROUTE
  const [route, setRoute] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);

  const msgTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const watchIdRef = useRef(null);

  // ------------------------ Helper ------------------------
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

  // ------------------------ ROUTE FETCHER (REAL ROAD ROUTING) ------------------------
  const fetchRoute = async (from, to) => {
    if (!from || !to) return;

    const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;

    try {
      setRouteLoading(true);
      const res = await fetch(url);
      const json = await res.json();

      if (!json.routes || !json.routes[0]) {
        setRoute([]);
        setDistanceKm(null);
        return;
      }

      const routeData = json.routes[0];

      // extract distance in km
      const km = routeData.distance / 1000;
      setDistanceKm(km.toFixed(2));

      // convert geometry
      const coordinates = routeData.geometry.coordinates;
      const formatted = coordinates.map((c) => [c[1], c[0]]);

      setRoute(formatted);
    } catch (err) {
      console.error("Route fetch failed:", err);
      setRoute([]);
      setDistanceKm(null);
    } finally {
      setRouteLoading(false);
    }
  };

  // ------------------------ GEO TRACKING ------------------------
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

          if (currentOrder?.deliveryAddress?.coords) {
            fetchRoute(coords, currentOrder.deliveryAddress.coords);
          }

          if (accuracy > 100)
            showMessage(`GPS accuracy: ±${Math.round(accuracy)}m ⚠️`);
          else
            showMessage(`Live location accurate ±${Math.round(accuracy)}m ✅`);
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

  // ------------------------ API ------------------------
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

      if (nextOrder?.deliveryAddress?.coords) {
        fetchRoute(liveCoords, nextOrder.deliveryAddress.coords);
      }

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

      if (activeOrder?.deliveryAddress?.coords) {
        fetchRoute(liveCoords, activeOrder.deliveryAddress.coords);
      }
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
        setCurrentOrder(null);
        await fetchProfile();
        fetchNextOrder();
      } else showMessage(res?.data?.message || `Failed to ${decision} order`);
    } catch {
      showMessage("Request failed");
    }
  };

  // ------------------------ Effects ------------------------
  useEffect(() => {
    mountedRef.current = true;
    fetchProfile();
    startTracking();
    return () => {
      mountedRef.current = false;
      if (msgTimeoutRef.current) clearTimeout(msgTimeoutRef.current);
      stopTracking();
    };
  }, []);

  useEffect(() => {
    if (deliveryBoy?.isActive && locationSet) {
      startTracking();
      if (!deliveryBoy?.currentOrder) fetchNextOrder();
    } else {
      stopTracking();
      setCurrentOrder(null);
    }
  }, [deliveryBoy?.isActive, locationSet]);

  // ------------------------ Helpers ------------------------
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

  // ------------------------ MAP WITH REAL ROUTE ------------------------
  const renderMap = (coords) => {
    if (!coords) return null;

    return (
      <MapContainer
        center={[coords.lat, coords.lon]}
        zoom={15}
        className={`${styles.mapContainer} ${mapShrink ? styles.shrink : ""}`}
      >
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
        />

        <Marker position={[coords.lat, coords.lon]}>
          <Popup>Delivery Location</Popup>
        </Marker>

        <Marker position={[liveCoords.lat, liveCoords.lon]}>
          <Popup>My Live Location</Popup>
        </Marker>

        {/* REAL ROUTE HERE */}
        {!routeLoading && route.length > 0 && (
          <Polyline positions={route} color="#1976d2" weight={5} />
        )}
      </MapContainer>
    );
  };

  // ------------------------ RENDER ------------------------
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

      {/* Stats */}
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

      {/* Location Setup */}
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
                fetchNextOrder();
              }}
            >
              Save Location
            </button>
          </div>
        </section>
      )}

      {/* Orders */}
      {locationSet && deliveryBoy.isActive && (
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
              {distanceKm && (
                <p className={styles.distanceInfo}>
                  <strong>Distance:</strong> {distanceKm} km
                </p>
              )}

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

      {/* Collapsible Location */}
      {locationSet && (
        <details className={styles.locationPicker}>
          <summary>Update My Location</summary>
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

                    if (currentOrder?.deliveryAddress?.coords) {
                      fetchRoute(coords, currentOrder.deliveryAddress.coords);
                    }
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

                if (currentOrder?.deliveryAddress?.coords) {
                  fetchRoute(liveCoords, currentOrder.deliveryAddress.coords);
                }
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
