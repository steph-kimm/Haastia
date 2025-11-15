import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getValidToken } from "../../utils/auth";
import "./AppointmentDetails.css";

const normalizeStatus = (status) => (status ? status.toLowerCase() : "pending");

const statusConfig = {
  pending: { label: "Pending response", tone: "pending" },
  accepted: { label: "Confirmed", tone: "accepted" },
  completed: { label: "Completed", tone: "completed" },
  declined: { label: "Declined", tone: "declined" },
  cancelled: { label: "Cancelled", tone: "declined" },
};

const formatDate = (dateString) => {
  if (!dateString) return "Date TBD";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (slot) => {
  if (!slot?.start && !slot?.end) return "Time TBD";
  if (slot?.start && slot?.end) return `${slot.start} – ${slot.end}`;
  return slot?.start || slot?.end || "Time TBD";
};

const AppointmentDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getValidToken();
  const token = auth?.token;
  const professionalId = auth?.payload?._id || auth?.payload?.id || null;

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!location.state?.booking);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !professionalId) {
      navigate("/login");
      return;
    }
    if (booking && booking._id === bookingId) return;

    const fetchBooking = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `http://localhost:8000/api/bookings/professional/${professionalId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const match = res.data.find((item) => item._id === bookingId);
        if (!match) {
          setError("We couldn't find that appointment.");
        }
        setBooking(match || null);
      } catch (err) {
        console.error("Appointment load error", err.response?.data || err.message);
        setError(err.response?.data?.error || "Unable to load appointment");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, booking, professionalId, token, navigate]);

  const status = useMemo(() => normalizeStatus(booking?.status), [booking]);
  const statusLabel = statusConfig[status]?.label || "Pending";
  const statusTone = statusConfig[status]?.tone || "pending";

  const mergeBooking = (nextData) => {
    setBooking((prev) => {
      if (!prev) return nextData || null;
      const merged = { ...prev, ...(nextData || {}) };
      if (prev.service && typeof nextData?.service === "string") merged.service = prev.service;
      if (prev.customer && typeof nextData?.customer === "string") merged.customer = prev.customer;
      if (prev.guestInfo && nextData && !nextData?.guestInfo) merged.guestInfo = prev.guestInfo;
      return merged;
    });
  };

  const setBookingStatus = async (nextStatus) => {
    if (!booking || !token) return;
    try {
      const res = await axios.put(
        `http://localhost:8000/api/bookings/${booking._id}/status`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mergeBooking(res.data || { status: nextStatus });
    } catch (err) {
      console.error("Status update error", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to update status");
    }
  };

  const cancelBooking = async () => {
    if (!booking || !token) return;
    const confirmed = window.confirm("Cancel this appointment? You will not be paid for cancelled work.");
    if (!confirmed) return;
    try {
      const res = await axios.put(
        `http://localhost:8000/api/bookings/${booking._id}/cancel`,
        { reason: "Cancelled by professional" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mergeBooking(res.data);
    } catch (err) {
      console.error("Cancel error", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to cancel booking");
    }
  };

  const markCompleted = async () => {
    if (!booking || !token) return;
    const confirmed = window.confirm("Mark this appointment as completed?");
    if (!confirmed) return;
    try {
      const res = await axios.put(
        `http://localhost:8000/api/bookings/${booking._id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mergeBooking(res.data);
    } catch (err) {
      console.error("Complete error", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to mark completed");
    }
  };

  const customer = booking?.customer || booking?.guestInfo;

  const renderActions = () => {
    if (!booking) return null;
    switch (status) {
      case "pending":
        return (
          <div className="detail-actions">
            <button className="btn primary" onClick={() => setBookingStatus("accepted")}>
              Accept request
            </button>
            <button className="btn ghost" onClick={() => setBookingStatus("declined")}>
              Decline
            </button>
          </div>
        );
      case "accepted":
        return (
          <div className="detail-actions">
            <button className="btn ghost" onClick={cancelBooking}>
              Cancel appointment
            </button>
            <button className="btn primary" onClick={markCompleted}>
              Mark completed
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="appointment-details-page">Loading appointment…</div>;
  }

  if (error || !booking) {
    return (
      <div className="appointment-details-page empty">
        <button className="back-link" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="empty-card">
          <h2>Appointment not available</h2>
          <p>{error || "This booking may have been removed."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-details-page">
      <button className="back-link" onClick={() => navigate(-1)}>
        ← Back to schedule
      </button>

      <section className="details-hero">
        <div>
          <p className="eyebrow">Appointment</p>
          <h1>{booking.service?.title || "Custom service"}</h1>
          <p className="sub">Review every detail and take action on this request.</p>
        </div>
        <div className={`status-chip ${statusTone}`}>{statusLabel}</div>
      </section>

      {renderActions()}

      <div className="details-grid">
        <article className="detail-card">
          <h2>Client</h2>
          <p className="client-name">{customer?.name || "Guest"}</p>
          <dl>
            <div>
              <dt>Email</dt>
              <dd>{customer?.email || "Not provided"}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{customer?.phone || "Not provided"}</dd>
            </div>
          </dl>
        </article>

        <article className="detail-card">
          <h2>When</h2>
          <dl>
            <div>
              <dt>Date</dt>
              <dd>{formatDate(booking.date)}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{formatTime(booking.timeSlot)}</dd>
            </div>
          </dl>
        </article>

        <article className="detail-card">
          <h2>Service</h2>
          <dl>
            <div>
              <dt>Package</dt>
              <dd>{booking.service?.title || "Custom request"}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{booking.service?.price ? `$${booking.service.price}` : "Quote pending"}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{booking.location || booking.address || "TBD"}</dd>
            </div>
          </dl>
        </article>

        <article className="detail-card notes">
          <h2>Notes</h2>
          <p>{booking.notes || "No additional notes from the client."}</p>
        </article>
      </div>
    </div>
  );
};

export default AppointmentDetails;
