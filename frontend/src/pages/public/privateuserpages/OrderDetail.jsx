import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../api/api";
import { AuthContext } from "../../admin/Context/AuthContext";
import styles from "./css/OrderDetail.module.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function OrderDetail() {
  const { slug } = useParams();
  const { userLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [route, setRoute] = useState([]);

  /* ------------------------------ Fetch Order ------------------------------ */
  useEffect(() => {
    if (!userLoggedIn) return navigate("/login");

    const fetchOrder = async () => {
      try {
        const res = await API.get(`/orders/${slug}`);
        setOrder(res.data.order);
      } catch {
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [slug, userLoggedIn, navigate]);

  /* ------------------------------ Fetch Route ------------------------------ */
  useEffect(() => {
    if (!order?.deliveryBoyLocation || !order?.deliveryAddress?.coords) return;

    const fetchRoute = async () => {
      const { lat: fromLat, lon: fromLon } = order.deliveryBoyLocation;
      const { lat: toLat, lon: toLon } = order.deliveryAddress.coords;

      const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;

      try {
        const res = await fetch(url);
        const json = await res.json();

        if (json.routes?.[0]) {
          const coords = json.routes[0].geometry.coordinates.map((c) => [
            c[1],
            c[0],
          ]);
          setRoute(coords);
        }
      } catch (err) {
        console.error("Route fetch failed:", err);
      }
    };

    fetchRoute();
  }, [order]);

  /* ------------------------------ Loading/Error ----------------------------- */
  if (loading)
    return (
      <div className={styles.centerMessage}>
        <div className={styles.spinner}></div>
        <p>Loading order details...</p>
      </div>
    );

  if (error)
    return (
      <div className={styles.centerMessage}>
        <div className={styles.errorIcon}>⚠️</div>
        <p className={styles.errorText}>{error}</p>
        <button
          className={styles.retryBtn}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );

  if (!order)
    return (
      <div className={styles.centerMessage}>
        <div className={styles.errorIcon}>📦</div>
        <p className={styles.errorText}>Order not found</p>
      </div>
    );

  /* ------------------------------ Safe helpers ------------------------------ */
  const safeStatus = order.status?.replaceAll("_", " ") || "Unknown";

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "delivered") return styles.statusDelivered;
    if (statusLower === "out for delivery") return styles.statusOutForDelivery;
    if (statusLower === "accepted" || statusLower === "confirmed")
      return styles.statusAccepted;
    if (statusLower === "pending") return styles.statusPending;
    if (statusLower === "cancelled") return styles.statusCancelled;
    return styles.statusDefault;
  };

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */
  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate("/orders")}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </button>

        <div className={styles.headerContent}>
          <div className={styles.orderInfo}>
            <h1>Order #{order.slug || "UNKNOWN"}</h1>
            <span
              className={`${styles.statusBadge} ${getStatusColor(
                order.status
              )}`}
            >
              {safeStatus}
            </span>
          </div>
          <p className={styles.orderDate}>
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Order Summary Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Order Summary</h2>
            </div>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.label}>Total Amount</span>
                <span className={styles.value}>
                  ₹{order.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.label}>Payment Method</span>
                <span className={styles.value}>{order.paymentMethod}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.label}>Payment Status</span>
                <span className={`${styles.value} ${styles.paymentStatus}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Live Tracking Map */}
          {(order.deliveryBoyLocation || order.deliveryAddress?.coords) && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Live Tracking</h2>
              </div>
              <div className={styles.mapWrapper}>
                <MapContainer
                  bounds={
                    order.deliveryBoyLocation && order.deliveryAddress?.coords
                      ? [
                          [
                            order.deliveryBoyLocation.lat,
                            order.deliveryBoyLocation.lon,
                          ],
                          [
                            order.deliveryAddress.coords.lat,
                            order.deliveryAddress.coords.lon,
                          ],
                        ]
                      : [
                          [
                            order.deliveryAddress?.coords?.lat || 20,
                            order.deliveryAddress?.coords?.lon || 78,
                          ],
                        ]
                  }
                  scrollWheelZoom={true}
                  style={{
                    height: "100%",
                    width: "100%",
                    borderRadius: "12px",
                  }}
                >
                  <TileLayer
                    url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    subdomains={["mt0", "mt1", "mt2", "mt3"]}
                    attribution="&copy; Google Maps"
                  />

                  {order.deliveryAddress?.coords && (
                    <Marker
                      position={[
                        order.deliveryAddress.coords.lat,
                        order.deliveryAddress.coords.lon,
                      ]}
                    >
                      <Popup>Your Delivery Address</Popup>
                    </Marker>
                  )}

                  {order.deliveryBoyLocation && (
                    <Marker
                      position={[
                        order.deliveryBoyLocation.lat,
                        order.deliveryBoyLocation.lon,
                      ]}
                    >
                      <Popup>
                        {order.deliveryBoy?.name || "Delivery Boy"} Live
                        Location
                      </Popup>
                    </Marker>
                  )}

                  {route.length > 0 && (
                    <Polyline
                      positions={route}
                      weight={4}
                      color="#4F46E5"
                      opacity={0.8}
                    />
                  )}
                </MapContainer>
              </div>
            </div>
          )}

          {/* Items Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Order Items</h2>
              <span className={styles.itemCount}>
                {order.items.length} items
              </span>
            </div>
            <div className={styles.itemsList}>
              {order.items.map((item, i) => (
                <div key={i} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemQty}>
                      {item.quantity} × ₹{Number(item.price).toFixed(2)}
                    </p>
                  </div>
                  <div className={styles.itemPrice}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Delivery Address</h2>
            </div>
            <div className={styles.addressContent}>
              <div className={styles.addressIcon}>📍</div>
              <div className={styles.addressText}>
                <p>
                  {order.deliveryAddress.houseNo},{" "}
                  {order.deliveryAddress.laneOrSector}
                </p>
                {order.deliveryAddress.landmark && (
                  <p className={styles.landmark}>
                    Near {order.deliveryAddress.landmark}
                  </p>
                )}
                <p className={styles.pincode}>
                  Pincode: {order.deliveryAddress.pincode}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* Timeline Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Order Timeline</h2>
            </div>
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <div className={styles.timelineDot}></div>
                <div className={styles.timelineContent}>
                  <h4>Order Placed</h4>
                  <p>{new Date(order.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {order.timestampsLog?.acceptedAt && (
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot}></div>
                  <div className={styles.timelineContent}>
                    <h4>Order Accepted</h4>
                    <p>
                      {new Date(
                        order.timestampsLog.acceptedAt
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {order.timestampsLog?.outForDeliveryAt && (
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot}></div>
                  <div className={styles.timelineContent}>
                    <h4>Out for Delivery</h4>
                    <p>
                      {new Date(
                        order.timestampsLog.outForDeliveryAt
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {order.timestampsLog?.deliveredAt && (
                <div className={styles.timelineItem}>
                  <div
                    className={`${styles.timelineDot} ${styles.delivered}`}
                  ></div>
                  <div className={styles.timelineContent}>
                    <h4>Delivered</h4>
                    <p>
                      {new Date(
                        order.timestampsLog.deliveredAt
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
