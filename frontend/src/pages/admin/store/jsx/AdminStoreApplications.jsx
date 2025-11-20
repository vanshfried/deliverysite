import React,{ useEffect, useState } from "react";
import API from "../../../../api/api"; // your admin axios instance

export default function AdminStoreApplications() {
  const [list, setList] = useState([]);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    const res = await API.get("/admin/store/applications");
    if (res) setList(res.data.applications);
  };

  const approve = async (id) => {
    await API.post(`/admin/store/approve/${id}`);
    loadApplications();
  };

  const reject = async (id) => {
    await API.post(`/admin/store/reject/${id}`);
    loadApplications();
  };

  return (
    <div className="page">
      <h2>Store Owner Applications</h2>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Store</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {list.map((owner) => (
            <tr key={owner._id}>
              <td>{owner.fullName}</td>
              <td>{owner.storeName}</td>
              <td>{owner.phone}</td>
              <td>{owner.status}</td>
              <td>
                {owner.status === "pending" && (
                  <>
                    <button onClick={() => approve(owner._id)}>Approve</button>
                    <button onClick={() => reject(owner._id)}>Reject</button>
                  </>
                )}

                {owner.status !== "pending" && <span>Done</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
