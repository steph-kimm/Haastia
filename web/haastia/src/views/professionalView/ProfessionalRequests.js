// web/haastia/src/views/professionalView/ProfessionalRequests.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ProfessionalRequests.css";
import { getValidToken } from "../../utils/auth";

const statusFilters = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "accepted", label: "Accepted" },
  { id: "completed", label: "Completed" },
];

const statusLabels = {
  pending: "Pending response",
  accepted: "Confirmed",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
};

const normalizeStatus = (status) => (status ? status.toLowerCase() : "pending");

const formatDay = (dateString) => {
  if (!dateString) return "Date TBD";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (slot) => {
  if (!slot?.start && !slot?.end) return "Time TBD";
  if (slot?.start && slot?.end) return `${slot.start} - ${slot.end}`;
  return slot?.start || slot?.end || "Time TBD";
};

const ProfessionalRequests = () => {
  const navigate = useNavigate();
  const auth = getValidToken();
  const token = auth?.token;
  const professionalId = auth?.payload?._id || auth?.payload?.id || null;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!token || !professionalId) {
      navigate("/login");
      return;
    }

    const fetchRequests = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/bookings/professional/${professionalId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRequests(sorted);
      } catch (err) {
        console.error("Error fetching booking requests:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [navigate, professionalId, token]);

  const cancel = async (booking) => {
    const ok = window.confirm(
      "Are you sure you want to cancel this appointment?\nYou will not be paid for cancelled appointments."
    );
    if (!ok || !token) return;

    try {
      const res = await axios.put(
        `http://localhost:8000/api/bookings/${booking._id}/cancel`,
        { reason: "Provider cancelled via dashboard" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests((prev) => prev.map((b) => (b._id === booking._id ? res.data : b)));
    } catch (err) {
      console.error("Cancel error:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to cancel booking");
    }
  };

  const complete = async (bookingId) => {
    const ok = window.confirm("Mark this appointment as completed?");
    if (!ok || !token) return;

    try {
      const res = await axios.put(
        `http://localhost:8000/api/bookings/${bookingId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests((prev) => prev.map((b) => (b._id === bookingId ? res.data : b)));
    } catch (err) {
      console.error("Complete error:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to complete booking");
    }
  };

  const updateStatus = async (bookingId, status) => {
    if (!token) return;
    try {
      await axios.put(
        `http://localhost:8000/api/bookings/${bookingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests((prev) => prev.map((req) => (req._id === bookingId ? { ...req, status } : req)));
    } catch (err) {
      console.error("Error updating booking:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to update booking");
    }
  };

  const statusCounts = useMemo(() => {
    return requests.reduce((acc, curr) => {
      const key = normalizeStatus(curr.status);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return requests.filter((req) => {
      const status = normalizeStatus(req.status);
      if (activeFilter !== "all" && status !== activeFilter) return false;

      if (!query) return true;
      const haystack = [
        req.service?.title,
        req.customer?.name,
        req.customer?.email,
        req.guestInfo?.name,
        req.guestInfo?.email,
        req.guestInfo?.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [requests, activeFilter, searchTerm]);

  if (loading) {
    return <div className="pro-requests-loading">Loading booking requests...</div>;
  }

  return (
    <div className="pro-requests-page">
      <header className="requests-hero">
        <div className="requests-hero__intro">
          <p className="eyebrow">Requests</p>
          <h1>Keep every client touchpoint on track</h1>
          <p className="sub">
            Track new inquiries, stay on top of pending approvals, and complete work orders from one
            streamlined dashboard.
          </p>

          {/* <div className="requests-kpis">
            <div>
              <span>Total</span>
              <strong>{requests.length}</strong>
            </div>
            <div>
              <span>Pending</span>
              <strong>{statusCounts.pending || 0}</strong>
            </div>
            <div>
              <span>Accepted</span>
              <strong>{statusCounts.accepted || 0}</strong>
            </div>
            <div>
              <span>Completed</span>
              <strong>{statusCounts.completed || 0}</strong>
            </div>
          </div> */}
        </div>

        <aside className="requests-hero__panel">
          <h2>Workflow tip</h2>
          <p>
            Accept or decline requests within 24 hours to maintain a strong response rate. When a
            service wraps, mark it completed so your availability updates instantly.
          </p>
        </aside>
      </header>

      <section className="requests-toolbar">
        <div className="status-filters">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={filter.id === activeFilter ? "is-active" : ""}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
              {filter.id !== "all" ? ` (${statusCounts[filter.id] || 0})` : ""}
            </button>
          ))}
        </div>

        <label className="requests-search">
          <span className="sr-only">Search requests</span>
          <input
            type="search"
            placeholder="Search client or service"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm("")}>
              Clear
            </button>
          )}
        </label>
      </section>

      {filteredRequests.length === 0 ? (
        <div className="requests-empty">
          <h3>No requests found</h3>
          <p>
            {searchTerm
              ? "Try adjusting your search or choose a different status."
              : "New booking requests will appear here as soon as clients reach out."}
          </p>
        </div>
      ) : (
        <div className="requests-grid">
          {filteredRequests.map((req) => {
            const status = normalizeStatus(req.status);
            const statusText = statusLabels[status] || status;
            const customerName = req.customer?.name || req.guestInfo?.name || "Guest";
            const customerEmail = req.customer?.email || req.guestInfo?.email || "N/A";
            const customerPhone = req.customer?.phone || req.guestInfo?.phone || "N/A";

            return (
              <article key={req._id} className={`request-card ${status}`}>
                <header className="request-card__header">
                  <div>
                    <p className="service-name">{req.service?.title || "Custom service"}</p>
                    <p className="service-price">
                      {req.service?.price ? `$${req.service.price}` : "Price TBD"}
                    </p>
                  </div>
                  <span className={`status-pill ${status}`}>{statusText}</span>
                </header>

                <ul className="request-details">
                  <li>
                    <span>Client</span>
                    <p>
                      {customerName}
                      <br />
                      {customerEmail}
                    </p>
                  </li>
                  <li>
                    <span>Phone</span>
                    <p>{customerPhone}</p>
                  </li>
                  <li>
                    <span>When</span>
                    <p>
                      {formatDay(req.date)}
                      <br />
                      {formatTime(req.timeSlot)}
                    </p>
                  </li>
                  <li>
                    <span>Notes</span>
                    <p>{req.notes || "No notes provided."}</p>
                  </li>
                </ul>

                <div className="request-card__actions">
                  {status === "pending" && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => updateStatus(req._id, "accepted")}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => updateStatus(req._id, "declined")}
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {status === "accepted" && (
                    <>
                      <button type="button" className="btn btn-danger" onClick={() => cancel(req)}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => complete(req._id)}
                      >
                        Mark completed
                      </button>
                    </>
                  )}

                  {status === "completed" && (
                    <span className="status-pill accepted">Completed</span>
                  )}

                  {(status === "declined" || status === "cancelled") && (
                    <span className="status-pill declined">{statusText}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfessionalRequests;
