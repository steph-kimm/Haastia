import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";

import {
  filterSlotsAgainstBlocks,
  getDayAvailabilityForDate,
  groupBlockedTimesByDate,
  toISODateString,
} from "../../../utils/availability";

import "../../customer/booking-form.css";
import "react-datepicker/dist/react-datepicker.css";
import "./BookingManagePage.css";

const formatCurrency = (value) => {
  if (value === undefined || value === null) return "$0.00";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
};

const formatBookingDate = (value) => {
  if (!value) return "Date TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatTimeRange = (slot) => {
  if (slot?.start && slot?.end) return `${slot.start} – ${slot.end}`;
  if (slot?.start || slot?.end) return slot.start || slot.end;
  return "Time TBD";
};

const paymentCopy = {
  paid: "Paid",
  processing: "Payment processing",
  requires_payment: "Payment required",
  failed: "Payment failed",
  refunded: "Refunded",
};

const statusCopy = {
  accepted: "Confirmed",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
};

const normalizeSlotKey = (slot) => `${slot.start}-${slot.end}`;

const BookingManagePage = () => {
  const { token } = useParams();
  const location = useLocation();
  const queryAction = new URLSearchParams(location.search).get("action");

  const [booking, setBooking] = useState(null);
  const [bookingError, setBookingError] = useState("");
  const [loadingBooking, setLoadingBooking] = useState(true);

  const [professionalProfile, setProfessionalProfile] = useState(null);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [blockedTimes, setBlockedTimes] = useState([]);

  const [activePanel, setActivePanel] = useState(() => {
    if (queryAction === "reschedule" || queryAction === "cancel") {
      return queryAction;
    }
    return "summary";
  });

  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleDateObj, setRescheduleDateObj] = useState(null);
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [rescheduleFeedback, setRescheduleFeedback] = useState({ type: "", message: "" });
  const [isRescheduling, setIsRescheduling] = useState(false);

  const [cancelReason, setCancelReason] = useState("");
  const [hasConfirmedCancel, setHasConfirmedCancel] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState({ type: "", message: "" });
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (queryAction === "reschedule" || queryAction === "cancel") {
      setActivePanel(queryAction);
    }
  }, [queryAction]);

  useEffect(() => {
    if (!token) return;

    const fetchBooking = async () => {
      setLoadingBooking(true);
      setBookingError("");
      try {
        const { data } = await axios.get(`/api/bookings/manage/${token}`);
        setBooking(data);
      } catch (error) {
        const message = error.response?.data?.error || "This manage link has expired or is invalid.";
        setBookingError(message);
        setBooking(null);
      } finally {
        setLoadingBooking(false);
      }
    };

    fetchBooking();
  }, [token]);

  useEffect(() => {
    if (!booking?.date) {
      setRescheduleDate("");
      setRescheduleDateObj(null);
    } else {
      const nextDate = new Date(booking.date);
      if (!Number.isNaN(nextDate.getTime())) {
        nextDate.setHours(0, 0, 0, 0);
        setRescheduleDateObj(nextDate);
        setRescheduleDate(toISODateString(nextDate) || "");
      }
    }
    if (booking?.timeSlot?.start && booking?.timeSlot?.end) {
      setRescheduleSlot(`${booking.timeSlot.start}-${booking.timeSlot.end}`);
    } else {
      setRescheduleSlot("");
    }
  }, [booking?.date, booking?.timeSlot?.start, booking?.timeSlot?.end]);

  useEffect(() => {
    if (booking?.service && typeof booking.service === "object" && booking.service?.title) {
      setServiceDetails(booking.service);
    }
  }, [booking?.service]);

  useEffect(() => {
    if (booking?.professional && typeof booking.professional === "object" && booking.professional?.name) {
      setProfessionalProfile(booking.professional);
    }
  }, [booking?.professional]);

  useEffect(() => {
    if (!booking?.professional) return;

    const professionalId = booking.professional;
    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + 90);

    const fetchSupporting = async () => {
      setAvailabilityLoading(true);
      setAvailabilityError("");
      try {
        const [profileRes, slotsRes, serviceRes, blockedRes] = await Promise.allSettled([
          axios.get(`/api/professional/${professionalId}`),
          axios.get(`/api/bookings/professional/${professionalId}/available-slots`),
          axios.get(`/api/services/by-user/${professionalId}`),
          axios.get(`/api/blocked-times/${professionalId}`, {
            params: {
              start: toISODateString(rangeStart),
              end: toISODateString(rangeEnd),
            },
          }),
        ]);

        if (profileRes.status === "fulfilled") {
          setProfessionalProfile(profileRes.value.data?.professional || null);
        }
        if (slotsRes.status === "fulfilled") {
          setWeeklyAvailability(slotsRes.value.data || []);
        }
        if (serviceRes.status === "fulfilled" && Array.isArray(serviceRes.value.data)) {
          const bookingServiceId =
            typeof booking?.service === "object"
              ? booking.service?._id?.toString?.() || booking.service?.id?.toString?.()
              : booking?.service?.toString?.();
          const selected = serviceRes.value.data.find((item) => {
            const itemId = item?._id || item?.id;
            if (!bookingServiceId || !itemId) return false;
            return itemId.toString() === bookingServiceId;
          });
          setServiceDetails(selected || null);
        }
        if (blockedRes.status === "fulfilled") {
          setBlockedTimes(Array.isArray(blockedRes.value.data) ? blockedRes.value.data : []);
        }

        const failed = [profileRes, slotsRes].some((result) => result.status === "rejected");
        if (failed) {
          setAvailabilityError("Some availability details are still loading. Please try again in a moment.");
        }
      } catch (error) {
        console.error("Error loading booking support data", error);
        setAvailabilityError("Unable to load availability details right now.");
      } finally {
        setAvailabilityLoading(false);
      }
    };

    fetchSupporting();
  }, [booking?.professional, booking?.service]);

  const blockedByDate = useMemo(() => groupBlockedTimesByDate(blockedTimes), [blockedTimes]);

  const slotsForSelectedDate = useMemo(() => {
    if (!rescheduleDate) return [];
    const dayAvailability = getDayAvailabilityForDate(weeklyAvailability, rescheduleDate);
    const baseSlots = dayAvailability?.slots ?? [];
    const blocks = blockedByDate.get(rescheduleDate) ?? [];
    return filterSlotsAgainstBlocks(baseSlots, blocks);
  }, [blockedByDate, weeklyAvailability, rescheduleDate]);

  useEffect(() => {
    if (!rescheduleSlot) return;
    const stillVisible = slotsForSelectedDate.some((slot) => normalizeSlotKey(slot) === rescheduleSlot);
    if (!stillVisible) {
      setRescheduleSlot("");
    }
  }, [slotsForSelectedDate, rescheduleSlot]);

  const handleDateChange = useCallback((selected) => {
    if (!selected) {
      setRescheduleDate("");
      setRescheduleDateObj(null);
      setRescheduleSlot("");
      return;
    }
    const normalized = toISODateString(selected);
    if (!normalized) {
      setRescheduleDate("");
      setRescheduleDateObj(null);
      setRescheduleSlot("");
      return;
    }
    const next = new Date(selected);
    next.setHours(0, 0, 0, 0);
    setRescheduleDate(normalized);
    setRescheduleDateObj(next);
    setRescheduleSlot("");
  }, []);

  const canModify = useMemo(() => {
    const status = booking?.status?.toLowerCase?.();
    return status && !["cancelled", "completed", "declined"].includes(status);
  }, [booking?.status]);

  const statusLabel = statusCopy[booking?.status] || "Booked";
  const paymentLabel = paymentCopy[booking?.paymentStatus] || "Payment status unknown";

  const handleReschedule = async () => {
    if (!canModify) {
      setRescheduleFeedback({ type: "error", message: "This booking can no longer be rescheduled." });
      return;
    }
    if (!rescheduleDate || !rescheduleSlot) {
      setRescheduleFeedback({ type: "error", message: "Please choose a new date and time." });
      return;
    }
    setIsRescheduling(true);
    setRescheduleFeedback({ type: "", message: "" });
    try {
      const [start, end] = rescheduleSlot.split("-");
      const payload = {
        date: new Date(`${rescheduleDate}T00:00:00.000Z`).toISOString(),
        timeSlot: { start, end },
      };
      const { data } = await axios.put(`/api/bookings/manage/${token}/reschedule`, payload);
      setBooking(data);
      setRescheduleFeedback({ type: "success", message: "Your booking has been updated." });
      setActivePanel("summary");
    } catch (error) {
      const message = error.response?.data?.error || "We couldn't reschedule this booking. Please try a different slot.";
      setRescheduleFeedback({ type: "error", message });
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleCancel = async () => {
    if (!canModify) {
      setCancelFeedback({ type: "error", message: "This booking can no longer be cancelled." });
      return;
    }
    if (!hasConfirmedCancel) {
      setCancelFeedback({
        type: "error",
        message: "Please confirm that you understand this action cannot be undone.",
      });
      return;
    }
    setIsCancelling(true);
    setCancelFeedback({ type: "", message: "" });
    try {
      const payload = cancelReason.trim() ? { reason: cancelReason.trim() } : undefined;
      const { data } = await axios.put(`/api/bookings/manage/${token}/cancel`, payload);
      setBooking(data);
      setCancelFeedback({ type: "success", message: "Your booking has been cancelled." });
      setHasConfirmedCancel(false);
      setCancelReason("");
      setActivePanel("summary");
    } catch (error) {
      const message = error.response?.data?.error || "We couldn't cancel this booking right now.";
      setCancelFeedback({ type: "error", message });
    } finally {
      setIsCancelling(false);
    }
  };

  if (loadingBooking) {
    return (
      <div className="booking-manage-page">
        <div className="booking-manage-card">
          <p className="booking-footnote muted">Loading booking details…</p>
        </div>
      </div>
    );
  }

  if (bookingError) {
    return (
      <div className="booking-manage-page">
        <div className="booking-manage-card">
          <h1>Manage your booking</h1>
          <p className="booking-footnote error">{bookingError}</p>
          <p className="booking-footnote muted">
            If this link expired, ask your professional to share a new manage link.
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="booking-manage-page">
      <div className="booking-manage-card">
        <header className="booking-header">
          <span className="booking-badge">Self-serve tools</span>
          <h3>Manage your booking</h3>
          <p className="booking-lede">
            Use this secure link to reschedule or cancel without logging in. Your professional is notified instantly.
          </p>
        </header>

        <section className="booking-manage-summary">
          <div>
            <p className="summary-label">Service</p>
            <h4>{serviceDetails?.title || "Reserved service"}</h4>
            <p className="summary-provider">{professionalProfile?.name || "Your professional"}</p>
          </div>
          <div className="summary-meta">
            <div>
              <span>Status</span>
              <strong>{statusLabel}</strong>
            </div>
            <div>
              <span>When</span>
              <strong>
                {formatBookingDate(booking.date)} · {formatTimeRange(booking.timeSlot)}
              </strong>
            </div>
            <div>
              <span>Payment</span>
              <strong>
                {paymentLabel}
                {booking.paymentStatus === "requires_payment" && booking.amountDue > 0
                  ? ` (${formatCurrency(booking.amountDue)} due)`
                  : ""}
              </strong>
            </div>
          </div>
        </section>

        <div className="booking-manage-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => setActivePanel("reschedule")}
            disabled={!canModify}
          >
            Reschedule
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => setActivePanel("cancel")}
            disabled={!canModify}
          >
            Cancel booking
          </button>
        </div>
        {!canModify && (
          <p className="booking-footnote muted">
            This booking is {statusLabel.toLowerCase()}. Self-serve actions are disabled.
          </p>
        )}

        <section className={`manage-panel ${activePanel === "reschedule" ? "is-active" : ""}`}>
          <div className="panel-header">
            <div>
              <p className="summary-label">Reschedule</p>
              <h4>Pick a new date and time</h4>
            </div>
            {availabilityLoading && <span className="loading-dot">Syncing availability…</span>}
          </div>
          {availabilityError && <p className="booking-footnote warning">{availabilityError}</p>}
          <div className="reschedule-grid">
            <div className="booking-field">
              <label>
                Date <span>*</span>
              </label>
              <div className="booking-input-shell">
                <DatePicker
                  selected={rescheduleDateObj}
                  onChange={handleDateChange}
                  minDate={new Date()}
                  placeholderText="Select a date"
                  dateFormat="MMMM d, yyyy"
                  className="booking-date-input"
                />
              </div>
            </div>
            <div className="booking-field">
              <label>
                Time <span>*</span>
              </label>
              <div className="slot-grid">
                {rescheduleDate && slotsForSelectedDate.length > 0 ? (
                  slotsForSelectedDate.map((slot) => {
                    const key = normalizeSlotKey(slot);
                    const isSelected = rescheduleSlot === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        className={`slot-pill ${isSelected ? "is-selected" : ""}`}
                        onClick={() => setRescheduleSlot(key)}
                      >
                        {slot.start} – {slot.end}
                      </button>
                    );
                  })
                ) : (
                  <p className="booking-footnote muted">
                    {rescheduleDate
                      ? "No open slots this day. Please choose another date."
                      : "Select a date to see available times."}
                  </p>
                )}
              </div>
            </div>
          </div>
          {rescheduleFeedback.message && (
            <p className={`booking-feedback ${rescheduleFeedback.type || ""}`}>
              {rescheduleFeedback.message}
            </p>
          )}
          <div className="panel-actions">
            <button type="button" className="primary" onClick={handleReschedule} disabled={!canModify || isRescheduling}>
              {isRescheduling ? "Updating…" : "Confirm new time"}
            </button>
            <button type="button" className="ghost" onClick={() => setActivePanel("summary")}>
              Back to summary
            </button>
          </div>
        </section>

        <section className={`manage-panel ${activePanel === "cancel" ? "is-active" : ""}`}>
          <div className="panel-header">
            <div>
              <p className="summary-label">Cancel booking</p>
              <h4>Can’t make it?</h4>
            </div>
          </div>
          <p className="booking-lede">
            Your professional will receive an instant notification. Let them know why you’re cancelling so they can plan accordingly.
          </p>
          <div className="booking-field">
            <label htmlFor="cancel-reason">Optional note</label>
            <textarea
              id="cancel-reason"
              rows={3}
              className="booking-textarea"
              placeholder="Share a quick reason (optional)"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
            />
          </div>
          <label className="confirm-checkbox">
            <input
              type="checkbox"
              checked={hasConfirmedCancel}
              onChange={(event) => setHasConfirmedCancel(event.target.checked)}
            />
            I understand this booking will be cancelled immediately.
          </label>
          {cancelFeedback.message && (
            <p className={`booking-feedback ${cancelFeedback.type || ""}`}>
              {cancelFeedback.message}
            </p>
          )}
          <div className="panel-actions">
            <button type="button" className="danger" onClick={handleCancel} disabled={!canModify || isCancelling}>
              {isCancelling ? "Cancelling…" : "Cancel booking"}
            </button>
            <button type="button" className="ghost" onClick={() => setActivePanel("summary")}>
              Keep booking
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BookingManagePage;
