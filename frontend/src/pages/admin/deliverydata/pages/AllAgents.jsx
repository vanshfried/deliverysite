import React, { useEffect, useState } from "react";
import API from "../../../../api/api";
import styles from "../css/DeliveryApplicants.module.css"; // reuse CSS

export default function AllDeliveryAgents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/admin/delivery/all"); // create this route
      if (res?.data?.success) {
        setAgents(res.data.deliveryAgents);
      } else {
        setMsg(res?.data?.error || "Failed to fetch agents");
      }
    } catch (err) {
      setMsg(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  if (loading)
    return <p className={styles.loading}>Loading delivery agents...</p>;

  return (
    <div className={styles.container}>
      <h2>All Delivery Agents</h2>
      {msg && <p className={styles.error}>{msg}</p>}

      {agents.length === 0 ? (
        <p>No delivery agents found.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Active</th>
              <th>Rating</th>
              <th>Accepted</th>
              <th>Delivered</th>
              <th>Ignored</th>
              <th>City</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent._id}>
                <td>{agent.name}</td>
                <td>{agent.phone}</td>
                <td>{agent.status}</td>
                <td>{agent.isActive ? "Yes" : "No"}</td>
                <td>{agent.stats?.rating || 0}</td>
                <td>{agent.stats?.accepted || 0}</td>
                <td>{agent.stats?.delivered || 0}</td>
                <td>{agent.stats?.ignored || 0}</td>
                <td>{agent.serviceArea?.city || "-"}</td>
                <td>
                  {agent.address
                    ? `${agent.address.street || ""}, ${
                        agent.address.city || ""
                      }, ${agent.address.state || ""} - ${
                        agent.address.pincode || ""
                      }`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
