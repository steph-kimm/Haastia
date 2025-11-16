import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useNavigate } from "react-router-dom";
import { getValidToken } from "../../../utils/auth";
import {
  buildBusinessHoursWithBlockedTimes,
  combineDateAndTime,
  toISODateString,
} from "../../../utils/availability";
import "./ProfessionalCalendar.css";

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
  const [availability, setAvailability] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      navigate("/login");
      return;
    }

    const decoded = auth.payload;
    setProfessionalId(decoded?._id || decoded?.id || null);
  }, [auth, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!professionalId || !token) return;
      setLoading(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const rangeStart = new Date(today);
        rangeStart.setDate(today.getDate() - LOOK_BACK_DAYS);
        const rangeEnd = new Date(today);
        rangeEnd.setDate(today.getDate() + LOOK_AHEAD_DAYS);

        const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

        const [availRes, bookingsRes, blockedRes] = await Promise.all([
          axios.get(`/api/availability/${professionalId}`),
          axios.get(`/api/bookings/professional/${professionalId}`, {
            headers: authHeaders,
          }),
          axios.get(`/api/blocked-times/${professionalId}`, {
            params: {
              start: toISODateString(rangeStart),
              end: toISODateString(rangeEnd),
            },
            headers: authHeaders,
          }),
        ]);

        setAvailability(availRes.data || []);
        setBookings(bookingsRes.data || []);
        setBlockedTimes(blockedRes.data || []);
      } catch (err) {
        console.error("Calendar load error:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [professionalId, token]);

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
      buildBusinessHoursWithBlockedTimes(availability, blockedTimes, {
        lookBackDays: LOOK_BACK_DAYS,
        lookAheadDays: LOOK_AHEAD_DAYS,
      }),
    [availability, blockedTimes]
  );

  return (
    <div className="pro-cal-wrapper">
      <div className="pro-cal-header">
        <h2>My Calendar</h2>
        <p className="sub">
          Working hours are highlighted; non-working time is shaded automatically.
        </p>
      </div>

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
