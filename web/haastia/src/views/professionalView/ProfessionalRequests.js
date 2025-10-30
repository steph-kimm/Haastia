import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ProfessionalRequests.css";
import { jwtDecode } from "jwt-decode";

const ProfessionalRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const professionalId = (() => {
    try {
      return token ? jwtDecode(token)._id : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const fetchRequests = async () => {
      if (!professionalId) return;
      try {
        const res = await axios.get(
          `http://localhost:8000/api/bookings/professional/${professionalId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Show newest first; only pending at top
        const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRequests(sorted);
      } catch (err) {
        console.error("Error fetching booking requests:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [professionalId, token]);

  const updateStatus = async (bookingId, status) => {
    try {
      await axios.put(
        `http://localhost:8000/api/bookings/${bookingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Optimistic update
      setRequests((prev) =>
        prev.map((req) => (req._id === bookingId ? { ...req, status } : req))
      );
    } catch (err) {
      console.error("Error updating booking:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to update booking");
    }
  };

  if (loading) return <div className="pro-reqs-loading">Loading requests...</div>;

  return (
    <div className="pro-reqs-container">
      <h2>Booking Requests</h2>

      {requests.length === 0 ? (
        <p className="empty">No booking requests yet.</p>
      ) : (
        <div className="reqs-list">
          {requests.map((req) => (
            <div key={req._id} className={`req-card ${req.status}`}>
              <div className="card-top">
                <div className="service-line">
                  <span className="label">Service: </span>
                  <span className="value">{req.service?.title} (${req.service?.price})</span>
                </div>

                <div className="who-line">
                  <span className="label">Customer: </span>
                  {req.customer ? (
                    <span className="value">{req.customer?.name} ({req.customer?.email})</span>
                  ) : (
                    <span className="value">
                      {req.guestInfo?.name} ({req.guestInfo?.email} · {req.guestInfo?.phone})
                    </span>
                  )}
                </div>

                <div className="when-line">
                  <span className="label">When: </span>
                  <span className="value">
                    {new Date(req.date).toLocaleDateString()} · {req.timeSlot?.start}–{req.timeSlot?.end}
                  </span>
                </div>
              </div>

              <div className="card-bottom">
                <span className={`status-badge ${req.status}`}>{req.status}</span>

                {req.status === "pending" ? (
                  <div className="actions">
                    <button className="accept" onClick={() => updateStatus(req._id, "accepted")}>
                      Accept
                    </button>
                    <button className="decline" onClick={() => updateStatus(req._id, "declined")}>
                      Decline
                    </button>
                  </div>
                ) : (
                  <div className="actions readonly">
                    {/* Optional: add "Reopen" or "Message" buttons later */}
                    <button disabled>{req.status === "accepted" ? "Accepted" : "Declined"}</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfessionalRequests;
