import React, { useEffect, useState } from "react";
import API from "../../../../api/api";
import styles from "../css/DeliveryApplicants.module.css";

export default function DeliveryApplicants() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/admin/delivery/applicants");
      if (res?.data?.success) {
        setApplicants(res.data.applicants);
      } else {
        setMsg(res?.data?.error || "Failed to fetch applicants");
        setMsgType("error");
      }
    } catch (err) {
      setMsg(err.response?.data?.error || "Something went wrong");
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const res = await API.post(`/api/admin/delivery/${action}/${id}`);
      if (res?.data?.success) {
        if (action === "approve") {
          setApplicants((prev) =>
            prev.map((a) =>
              a._id === id ? { ...a, status: "approved", isApproved: true } : a
            )
          );
          setMsg("✅ Applicant approved successfully");
          setMsgType("success");
        } else if (action === "reject") {
          setApplicants((prev) =>
            prev.map((a) =>
              a._id === id ? { ...a, status: "rejected", isApproved: false } : a
            )
          );
          setMsg("❌ Applicant rejected");
          setMsgType("error");
        }
      } else {
        setMsg(res?.data?.error || "Action failed");
        setMsgType("error");
      }
    } catch (err) {
      setMsg(err.response?.data?.error || "Request failed");
      setMsgType("error");
    }

    setTimeout(() => {
      setMsg("");
      setMsgType("");
    }, 3000);
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  if (loading) return <p className={styles.loading}>Loading applicants...</p>;

  return (
    <div className={styles.container}>
      <h2>Delivery Partner Applicants</h2>

      {msg && (
        <p
          className={`${styles.message} ${
            msgType === "success" ? styles.success : styles.error
          }`}
        >
          {msg}
        </p>
      )}

      {applicants.length === 0 ? (
        <p>No applicants found.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Action</th> 
            </tr>
          </thead>
          <tbody>
            {applicants.map((app) => (
              <tr key={app._id}>
                <td>{app.name}</td>
                <td>{app.phone}</td>
                <td
                  className={
                    app.status === "approved"
                      ? styles.approved
                      : app.status === "rejected"
                      ? styles.rejected
                      : styles.pending
                  }
                >
                  {app.status}
                </td>
                <td>
                  {app.status === "pending" ? (
                    <>
                      <button
                        className={styles.approveBtn}
                        onClick={() => handleAction(app._id, "approve")}
                      >
                        Approve
                      </button>
                      <button
                        className={styles.rejectBtn}
                        onClick={() => handleAction(app._id, "reject")}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
