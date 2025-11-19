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
  const { slug } = useParams(); // ✅ using slug now
  const { userLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [route, setRoute] = useState([]);

  useEffect(() => {
    if (!userLoggedIn) return navigate("/login");

    const fetchOrder = async () => {
      try {
        const res = await API.get(`/orders/${slug}`); // ✅ fetch by slug
        setOrder(res.data.order);
      } catch {
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [slug, userLoggedIn, navigate]);
  useEffect(() => {
    const fetchRoute = async () => {
      if (!order?.deliveryBoyLocation || !order?.deliveryAddress?.coords)
        return;

      const from = order.deliveryBoyLocation;
      const to = order.deliveryAddress.coords;
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;

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

  if (loading) return <p className={styles.loading}>Loading order...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!order) return <p className={styles.error}>Order not found</p>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate("/orders")}>
          ← Back
        </button>
        <h1>Order #{order.slug || "UNKNOWN"}</h1>
      </div>

      <div className={styles.grid}>
        {/* Order summary */}
        <div className={styles.card}>
          <h3>Order Summary</h3>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`${styles.status} ${
                styles[order.status.toLowerCase()]
              }`}
            >
              {order.status.replaceAll("_", " ")}
            </span>
          </p>
          <p>
            <strong>Placed On:</strong>{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Total Amount:</strong> ₹{order.totalAmount.toFixed(2)}
          </p>
        </div>

        {/* Payment info */}
        <div className={styles.card}>
          <h3>Payment Info</h3>
          <p>
            <strong>Method:</strong> {order.paymentMethod}
          </p>
          <p>
            <strong>Status:</strong> {order.paymentStatus}
          </p>
        </div>

        {/* Delivery address */}
        <div className={styles.card}>
          <h3>Delivery Address :-</h3>
          <p>
            {order.deliveryAddress.houseNo},{" "}
            {order.deliveryAddress.laneOrSector}
            {order.deliveryAddress.landmark
              ? `, ${order.deliveryAddress.landmark}`
              : ""}
          </p>
          <p>Pincode: {order.deliveryAddress.pincode}</p>
        </div>

        {/* Items */}
        <div className={`${styles.card} ${styles.itemsCard}`}>
          <h3>Items</h3>
          {order.items.map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <div className={styles.itemLeft}>
                <p className={styles.itemName}>{item.name}</p>
                <p className={styles.itemQty}>
                  Qty: {item.quantity} × ₹{item.price}
                </p>
              </div>
              <p className={styles.itemPrice}>
                ₹{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <ul className={styles.timeline}>
          <li>
            <strong>Created:</strong>{" "}
            {new Date(order.createdAt).toLocaleString()}
          </li>

          {order.timestampsLog?.acceptedAt && (
            <li>
              <strong>Accepted:</strong>{" "}
              {new Date(order.timestampsLog.acceptedAt).toLocaleString()}
            </li>
          )}

          {order.timestampsLog?.outForDeliveryAt && (
            <li>
              <strong>Out for Delivery:</strong>{" "}
              {new Date(order.timestampsLog.outForDeliveryAt).toLocaleString()}
            </li>
          )}

          {order.timestampsLog?.deliveredAt && (
            <li>
              <strong>Delivered:</strong>{" "}
              {new Date(order.timestampsLog.deliveredAt).toLocaleString()}
            </li>
          )}
        </ul>
      </div>
      {(order.deliveryBoyLocation || order.deliveryAddress?.coords) && (
        <div className={styles.card}>
          <h3>Delivery Tracking</h3>
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
                      order.deliveryAddress?.coords?.lat || 0,
                      order.deliveryAddress?.coords?.lon || 0,
                    ],
                  ]
            }
            scrollWheelZoom={true}
            style={{ height: "300px", width: "100%", borderRadius: "10px" }}
          >
            <TileLayer
              url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              subdomains={["mt0", "mt1", "mt2", "mt3"]}
            />

            {/* Delivery Address Marker */}
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

            {/* Delivery Boy Marker */}
            {order.deliveryBoyLocation && (
              <Marker
                position={[
                  order.deliveryBoyLocation.lat,
                  order.deliveryBoyLocation.lon,
                ]}
              >
                <Popup>
                  {order.deliveryBoy?.name || "Delivery Boy"} Live Location
                </Popup>
              </Marker>
            )}

            {/* Polyline Route */}
            {route.length > 0 && (
              <Polyline positions={route} color="#1e88e5" weight={4} />
            )}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
