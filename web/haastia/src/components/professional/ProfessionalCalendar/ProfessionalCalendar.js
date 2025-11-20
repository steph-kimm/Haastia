import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useNavigate } from "react-router-dom";
import { getValidToken } from "../../../utils/auth";
import {
  combineDateAndTime,
  toISODateString,
} from "../../../utils/availability";
import "./ProfessionalCalendar.css";

const blockDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const blockTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const LOOK_BACK_DAYS = 30;
const LOOK_AHEAD_DAYS = 180;

const normalizeBookingStatus = (status) => {
  const normalized = status ? status.toLowerCase() : "accepted";
  return normalized === "pending" ? "accepted" : normalized;
};

const getDisplayStatus = (status) => {
  const normalized = normalizeBookingStatus(status);
  switch (normalized) {
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "declined":
      return "Declined";
    default:
      return "Confirmed";
  }
};

const ProfessionalCalendar = () => {
  const navigate = useNavigate();
  const auth = getValidToken();
  const token = auth?.token ?? null;
  const [professionalId, setProfessionalId] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blockForm, setBlockForm] = useState({
    date: "",
    start: "",
    end: "",
    reason: "",
  });
  const [showBlockPanel, setShowBlockPanel] = useState(false);
  const [blockFeedback, setBlockFeedback] = useState(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [deletingBlockId, setDeletingBlockId] = useState(null);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );

  useEffect(() => {
    if (!auth) {
      navigate("/login");
      return;
    }

    const decoded = auth.payload;
    setProfessionalId(decoded?._id || decoded?.id || null);
  }, [auth, navigate]);

  const loadCalendarData = useCallback(
    async (withLoader = true) => {
      if (!professionalId || !token) return;
      if (withLoader) {
        setLoading(true);
      }
      setBlockedLoading(true);
      try {
        const { data } = await axios.get("/api/professional/me/calendar", {
          params: { lookBackDays: LOOK_BACK_DAYS, lookAheadDays: LOOK_AHEAD_DAYS },
          headers: authHeaders,
        });

        setBookings(data?.bookings || []);
        setBlockedTimes(data?.blockedTimes || []);
        setAvailableSlots(data?.availableSlots || []);
      } catch (err) {
        console.error("Calendar load error:", err.response?.data || err.message);
      } finally {
        if (withLoader) {
          setLoading(false);
        }
        setBlockedLoading(false);
      }
    },
    [professionalId, token, authHeaders]
  );

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const refreshBlockedTimes = useCallback(
    async (withLoader = true) => {
      if (!professionalId) return;
      await loadCalendarData(withLoader);
    },
    [professionalId, loadCalendarData]
  );

  const bookingEvents = useMemo(
    () =>
      (bookings || [])
        .map((booking) => {
          const start = combineDateAndTime(booking.date, booking.timeSlot?.start);
          const end = combineDateAndTime(booking.date, booking.timeSlot?.end);
          if (!start || !end) return null;

          const normalizedStatus = normalizeBookingStatus(booking.status);
          const classNames = ["evt"];
          if (normalizedStatus === "accepted") classNames.push("evt-accepted");
          else if (normalizedStatus === "completed") classNames.push("evt-completed");
          else if (normalizedStatus === "cancelled" || normalizedStatus === "declined")
            classNames.push("evt-cancelled");
          else classNames.push("evt-accepted");

          const titleParts = [];
          if (booking.service?.title) titleParts.push(booking.service.title);
          if (booking.customer?.name) titleParts.push(booking.customer.name);
          else if (booking.guestInfo?.name) titleParts.push(booking.guestInfo.name);

          return {
            id: booking._id,
            title: titleParts.join(" · ") || "Booking",
            start,
            end,
            extendedProps: { booking },
            classNames,
          };
        })
        .filter(Boolean),
    [bookings]
  );

  const blockedEvents = useMemo(
    () =>
      (blockedTimes || [])
        .map((block) => {
          const start = combineDateAndTime(block.date, block.start);
          const end = combineDateAndTime(block.date, block.end);
          if (!start || !end) return null;
          const reason = block.reason?.trim();
          return {
            id: block._id ? `blocked-${block._id}` : `blocked-${start}`,
            title: reason ? `Blocked · ${reason}` : "Blocked",
            start,
            end,
            display: "block",
            classNames: ["evt", "evt-blocked"],
            editable: false,
            extendedProps: { blocked: block },
          };
        })
        .filter(Boolean),
    [blockedTimes]
  );

  const events = useMemo(
    () => [...bookingEvents, ...blockedEvents],
    [bookingEvents, blockedEvents]
  );

  const businessHours = useMemo(
    () =>
      (availableSlots || [])
        .flatMap((entry) =>
          (entry.slots || []).map((slot) => {
            const start = combineDateAndTime(entry.date, slot.start);
            const end = combineDateAndTime(entry.date, slot.end);
            if (!start || !end) return null;
            return { start, end };
          })
        )
        .filter(Boolean),
    [availableSlots]
  );

  const upcomingBlocked = useMemo(() => {
    const now = Date.now();
    return (blockedTimes || [])
      .map((block) => {
        if (!block) return null;
        const baseDate = new Date(block.date);
        if (Number.isNaN(baseDate.getTime())) return null;
        baseDate.setHours(0, 0, 0, 0);
        const [startHour, startMinute] = (block.start || "").split(":").map(Number);
        const [endHour, endMinute] = (block.end || "").split(":").map(Number);
        if (
          !Number.isInteger(startHour) ||
          !Number.isInteger(startMinute) ||
          !Number.isInteger(endHour) ||
          !Number.isInteger(endMinute)
        ) {
          return null;
        }
        const startDate = new Date(baseDate);
        startDate.setHours(startHour, startMinute, 0, 0);
        const endDate = new Date(baseDate);
        endDate.setHours(endHour, endMinute, 0, 0);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
          return null;
        }
        return {
          id: block._id || `${baseDate.toISOString()}-${block.start}-${block.end}`,
          startDate,
          endDate,
          reason: block.reason?.trim() || "",
        };
      })
      .filter((block) => block && block.endDate.getTime() >= now)
      .sort((a, b) => a.startDate - b.startDate);
  }, [blockedTimes]);

  const handleBlockInputChange = (field) => (event) => {
    const value = event.target.value;
    setBlockForm((prev) => ({ ...prev, [field]: value }));
    if (blockFeedback) {
      setBlockFeedback(null);
    }
  };

  const handleBlockSubmit = async (event) => {
    event.preventDefault();
    if (!professionalId) return;
    const { date, start, end, reason } = blockForm;

    if (!date || !start || !end) {
      setBlockFeedback({
        type: "error",
        message: "Please select a date along with a start and end time.",
      });
      return;
    }

    if (start >= end) {
      setBlockFeedback({
        type: "error",
        message: "End time must be after the start time.",
      });
      return;
    }

    if (!token) {
      setBlockFeedback({
        type: "error",
        message: "You must be signed in to manage blocked times.",
      });
      return;
    }

    setIsBlocking(true);
    setBlockFeedback(null);

    try {
      await axios.post(
        `/api/blocked-times/${professionalId}`,
        {
          date,
          start,
          end,
          reason: reason?.trim() || undefined,
        },
        { headers: authHeaders }
      );

      setBlockForm({ date: "", start: "", end: "", reason: "" });
      setBlockFeedback({ type: "success", message: "Blocked time added." });
      await refreshBlockedTimes(false);
    } catch (err) {
      console.error("Error creating blocked time", err);
      const message = err.response?.data?.error || "Failed to add blocked time. Please try again.";
      setBlockFeedback({ type: "error", message });
    } finally {
      setIsBlocking(false);
    }
  };

  const handleDeleteBlockedTime = async (id) => {
    if (!id || !token) return;
    setDeletingBlockId(id);
    try {
      await axios.delete(`/api/blocked-times/${id}`, {
        headers: authHeaders,
      });
      await refreshBlockedTimes(false);
    } catch (err) {
      console.error("Error deleting blocked time", err);
      const message = err.response?.data?.error || "Failed to delete blocked time. Please try again.";
      setBlockFeedback({ type: "error", message });
    } finally {
      setDeletingBlockId(null);
    }
  };

  return (
    <div className="pro-cal-wrapper">
      <div className="pro-cal-header">
        <div className="pro-cal-heading">
          <h2>My Calendar</h2>
          <p className="sub">
            Working hours are highlighted; non-working time is shaded automatically.
          </p>
        </div>
        <button
          type="button"
          className="pro-block-toggle"
          onClick={() => setShowBlockPanel((open) => !open)}
          aria-expanded={showBlockPanel}
        >
          Block off time
        </button>
      </div>

      {showBlockPanel && (
        <section className="pro-block-card">
          <div className="pro-block-head">
            <div>
              <h3>One-off time off</h3>
              <p className="pro-block-sub">
                Drop a quick block to hide personal events from the booking calendar.
              </p>
            </div>
          </div>
          <form className="pro-block-form" onSubmit={handleBlockSubmit}>
            <label>
              <span>Date</span>
              <input
                type="date"
                value={blockForm.date}
                onChange={handleBlockInputChange("date")}
                min={toISODateString(new Date())}
              />
            </label>
            <label>
              <span>Start</span>
              <input
                type="time"
                value={blockForm.start}
                onChange={handleBlockInputChange("start")}
              />
            </label>
            <label>
              <span>End</span>
              <input
                type="time"
                value={blockForm.end}
                onChange={handleBlockInputChange("end")}
              />
            </label>
            <label className="pro-block-reason-input">
              <span>Reason (optional)</span>
              <input
                type="text"
                value={blockForm.reason}
                placeholder="Vacation, errand, etc."
                onChange={handleBlockInputChange("reason")}
              />
            </label>
            <button type="submit" className="pro-block-submit" disabled={isBlocking}>
              {isBlocking ? "Saving…" : "Block this time"}
            </button>
          </form>
          {blockFeedback && (
            <p className={`pro-block-feedback ${blockFeedback.type}`}>{blockFeedback.message}</p>
          )}
          <div className="pro-block-list-wrapper">
            {blockedLoading ? (
              <p className="pro-block-footnote">Loading blocked times…</p>
            ) : upcomingBlocked.length ? (
              <ul className="pro-block-list">
                {upcomingBlocked.map((block) => (
                  <li key={block.id} className="pro-block-item">
                    <div className="pro-block-meta">
                      <span className="pro-block-date">
                        {blockDateFormatter.format(block.startDate)}
                      </span>
                      <span className="pro-block-range">
                        {blockTimeFormatter.format(block.startDate)} –{" "}
                        {blockTimeFormatter.format(block.endDate)}
                      </span>
                      {block.reason && <span className="pro-block-reason">{block.reason}</span>}
                    </div>
                    <button
                      type="button"
                      className="pro-block-delete"
                      onClick={() => handleDeleteBlockedTime(block.id)}
                      disabled={deletingBlockId === block.id}
                    >
                      {deletingBlockId === block.id ? "Removing…" : "Remove"}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pro-block-footnote">
                No upcoming blocks. Add one above to reserve personal time.
              </p>
            )}
          </div>
        </section>
      )}

      {loading ? (
        <div className="pro-cal-loading">Loading calendar…</div>
      ) : (
        <FullCalendar
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridDay,timeGridWeek,dayGridMonth"
          }}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          nowIndicator={true}
          height="auto"

          events={events}

          businessHours={businessHours}

          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: true }}
          firstDay={1}
          dayMaxEvents={true}
          expandRows={true}

          eventClick={(info) => {
            const booking = info.event.extendedProps.booking;
            if (booking) {
              info.jsEvent.preventDefault();
              navigate(`/bookings/${booking._id}`, { state: { booking } });
            }
          }}

          eventDidMount={(info) => {
            const booking = info.event.extendedProps.booking;
            if (booking) {
              const status = getDisplayStatus(booking.status);
              const who =
                booking?.customer?.name ||
                booking?.guestInfo?.name ||
                "Customer";
              info.el.setAttribute(
                "title",
                `${info.event.title}\nStatus: ${status}\n${who}`
              );
              return;
            }

            const blocked = info.event.extendedProps.blocked;
            if (blocked) {
              const reason = blocked.reason?.trim();
              info.el.setAttribute(
                "title",
                reason ? `Blocked time\n${reason}` : "Blocked time"
              );
            }
          }}
        />
      )}
    </div>
  );
};

export default ProfessionalCalendar;
