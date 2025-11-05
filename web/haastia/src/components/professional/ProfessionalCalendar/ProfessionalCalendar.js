import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useNavigate } from "react-router-dom";
import { getValidToken } from "../../../utils/auth";
import "./ProfessionalCalendar.css";

// Map your availability day names -> FullCalendar days (0=Sun ... 6=Sat)
const DAY_INDEX = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

// Helper: combine "YYYY-MM-DD" and "HH:mm" into ISO
const combineDateTime = (dateStr, timeStr) => {
  // dateStr may be ISO or "YYYY-MM-DD"; timeStr is "HH:mm"
  const d = new Date(dateStr);
  // If dateStr has time already, normalize to local Y-M-D
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const iso = `${y}-${m}-${day}T${timeStr}:00`;
  return iso;
};

// Turn your weekly availability into FullCalendar businessHours
const mapAvailabilityToBusinessHours = (availability = []) => {
  // availability: [{ day: "Monday", slots: [{start:'09:00', end:'12:00'}, ...] }]
  const blocks = [];
  for (const entry of availability) {
    const dow = DAY_INDEX[entry.day];
    if (dow === undefined) continue;
    (entry.slots || []).forEach(slot => {
      if (slot.start && slot.end) {
        blocks.push({
          daysOfWeek: [dow],
          startTime: slot.start, // "09:00"
          endTime: slot.end,     // "17:00"
        });
      }
    });
  }
  return blocks;
};

const ProfessionalCalendar = () => {
  const navigate = useNavigate();
  const auth = getValidToken();
  const token = auth?.token ?? null;
  const [professionalId, setProfessionalId] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [events, setEvents] = useState([]); // bookings as FC events
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
        // parallel fetch
        const [availRes, bookingsRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/availability/${professionalId}`),
          axios.get(`http://localhost:8000/api/bookings/professional/${professionalId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setAvailability(availRes.data || []);

        // Map bookings -> calendar events
        const evts = (bookingsRes.data || []).map(b => {
          const start = combineDateTime(b.date, b.timeSlot?.start);
          const end = combineDateTime(b.date, b.timeSlot?.end);
          // Color by status
          let classNames = ["evt"];
          if (b.status === "accepted") classNames.push("evt-accepted");
          else if (b.status === "pending") classNames.push("evt-pending");
          else if (b.status === "cancelled") classNames.push("evt-cancelled");
          else if (b.status === "completed") classNames.push("evt-completed");

          const titleParts = [];
          if (b.service?.title) titleParts.push(b.service.title);
          if (b.customer?.name) titleParts.push(b.customer.name);
          else if (b.guestInfo?.name) titleParts.push(b.guestInfo.name);

          return {
            id: b._id,
            title: titleParts.join(" · "),
            start,
            end,
            extendedProps: { booking: b },
            classNames,
          };
        });

        setEvents(evts);
      } catch (err) {
        console.error("Calendar load error:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [professionalId, token]);

  const businessHours = useMemo(
    () => mapAvailabilityToBusinessHours(availability),
    [availability]
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

          /* This is the magic: sets your working hours so FullCalendar
             visually treats other time as "non-business" (shaded) */
          businessHours={businessHours}

          /* nice UX touches */
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: true }}
          firstDay={1} // week starts Monday; set 0 for Sunday
          dayMaxEvents={true}
          expandRows={true}

          /* Tooltips via native title attr */
          eventDidMount={(info) => {
            const b = info.event.extendedProps.booking;
            const status = b?.status;
            const who =
              b?.customer?.name ||
              b?.guestInfo?.name ||
              "Customer";
            info.el.setAttribute(
              "title",
              `${info.event.title}\nStatus: ${status}\n${who}`
            );
          }}
        />
      )}
    </div>
  );
};

export default ProfessionalCalendar;
