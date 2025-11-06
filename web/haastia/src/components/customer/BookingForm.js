import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getValidToken } from "../../utils/auth";
import {
  getDayAvailabilityForDate,
  groupBlockedTimesByDate,
  filterSlotsAgainstBlocks,
  toISODateString,
} from "../../utils/availability";

const BookingForm = ({ professionalId, service, availability = [], onSuccess }) => {
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [blockedError, setBlockedError] = useState("");

  const auth = getValidToken();
  const token = auth?.token || "";
  const isLoggedIn = Boolean(token);

  useEffect(() => {
    if (!professionalId) return;
    const fetchBlockedTimes = async () => {
      setBlockedLoading(true);
      try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 90);
        const { data } = await axios.get(`http://localhost:8000/api/blocked-times/${professionalId}`, {
          params: {
            start: toISODateString(start),
            end: toISODateString(end),
          },
        });
        setBlockedTimes(Array.isArray(data) ? data : []);
        setBlockedError("");
      } catch (err) {
        console.error("Error fetching blocked times:", err);
        setBlockedError("Some time slots may be unavailable right now.");
      } finally {
        setBlockedLoading(false);
      }
    };
    fetchBlockedTimes();
  }, [professionalId]);

  const blockedByDate = useMemo(
    () => groupBlockedTimesByDate(blockedTimes),
    [blockedTimes]
  );

  const availableSlotsForSelectedDate = useMemo(() => {
    const dayAvailability = getDayAvailabilityForDate(availability, date);
    const baseSlots = dayAvailability?.slots ?? [];
    const blocks = date ? blockedByDate.get(date) ?? [] : [];
    return filterSlotsAgainstBlocks(baseSlots, blocks);
  }, [availability, date, blockedByDate]);

  const handleDateChange = (value) => {
    if (!value) {
      setDate("");
      setTimeSlot("");
      return;
    }

    const dayAvailability = getDayAvailabilityForDate(availability, value);
    const hasSlots = dayAvailability?.slots?.length;

    if (!hasSlots) {
      setFeedback({
        type: "error",
        message: "No availability on the selected date. Please choose another date.",
      });
      setDate("");
      setTimeSlot("");
      return;
    }

    const blocks = blockedByDate.get(value) ?? [];
    const openSlots = filterSlotsAgainstBlocks(dayAvailability?.slots ?? [], blocks);
    if (!blockedLoading && openSlots.length === 0) {
      setFeedback({
        type: "error",
        message: "All slots for that day are blocked off. Please choose another date.",
      });
      setDate("");
      setTimeSlot("");
      return;
    }

    if (feedback.type === "error") {
      setFeedback({ type: "", message: "" });
    }

    setDate(value);
    setTimeSlot("");
  };

  const todayISODate = useMemo(() => toISODateString(new Date()), []);

  useEffect(() => {
    if (!date) return;

    const dayAvailability = getDayAvailabilityForDate(availability, date);
    const hasSlots = dayAvailability?.slots?.length;

    if (!hasSlots || (!blockedLoading && availableSlotsForSelectedDate.length === 0)) {
      setFeedback({
        type: "error",
        message: "No availability on the selected date. Please choose another date.",
      });
      setDate("");
      setTimeSlot("");
    }
  }, [availability, date, availableSlotsForSelectedDate, blockedLoading]);

  useEffect(() => {
    if (!date || !timeSlot) return;
    const stillAvailable = availableSlotsForSelectedDate.some(
      (slot) => `${slot.start}-${slot.end}` === timeSlot
    );
    if (!stillAvailable) {
      setTimeSlot("");
    }
  }, [availableSlotsForSelectedDate, date, timeSlot]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !timeSlot) {
      return setFeedback({ type: "error", message: "Please select a date and time." });
    }

    const selectedDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return setFeedback({
        type: "error",
        message: "Please choose a date that has not already passed.",
      });
    }

    const isSlotAvailable = availableSlotsForSelectedDate.some(
      (slot) => `${slot.start}-${slot.end}` === timeSlot
    );

    if (!isSlotAvailable) {
      return setFeedback({
        type: "error",
        message: `${service?.title || "This service"} is not available at the selected time.`,
      });
    }

    if (!isLoggedIn && (!name || !email || !phone)) {
      return setFeedback({ type: "error", message: "Please provide your name, email, and phone number." });
    }

    try {
      const payload = {
        professional: professionalId,
        service: service._id,
        date,
        timeSlot: {
          start: timeSlot.split("-")[0],
          end: timeSlot.split("-")[1],
        },
      };

      if (!isLoggedIn) {
        payload.guestInfo = {
          name,
          email,
          phone,
        };
      }

      const config = token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined;

      const res = await axios.post(
        "http://localhost:8000/api/bookings",
        payload,
        config
      );

      setFeedback({ type: "success", message: "Booking request sent!" });
      onSuccess?.(res.data);
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", message: "Failed to send booking request." });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="booking-form">
      <h3>Book {service.title}</h3>
      {feedback.message && (
        <p className={`feedback ${feedback.type}`}>{feedback.message}</p>
      )}
      <div>
        <label>Date:</label>
        <input
          type="date"
          value={date}
          min={todayISODate}
          onChange={(e) => handleDateChange(e.target.value)}
        />
      </div>

      <div>
        <label>Available Time Slots:</label>
        <select
          value={timeSlot}
          onChange={(e) => setTimeSlot(e.target.value)}
          disabled={!date || blockedLoading || availableSlotsForSelectedDate.length === 0}
        >
          <option value="">Select a time</option>
          {availableSlotsForSelectedDate.map((slot) => (
            <option key={`${slot.start}-${slot.end}`} value={`${slot.start}-${slot.end}`}>
              {slot.start} - {slot.end}
            </option>
          ))}
        </select>
        {blockedLoading && date && (
          <p className="feedback warning">Checking for recent updates…</p>
        )}
        {date && !blockedLoading && availableSlotsForSelectedDate.length === 0 && (
          <p className="feedback warning">No availability for the selected date.</p>
        )}
        {!blockedLoading && blockedError && (
          <p className="feedback warning">{blockedError}</p>
        )}
      </div>

      {!isLoggedIn && (
        <>
          <div>
            <label>Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label>Phone:</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your phone number"
            />
          </div>
        </>
      )}

      <button type="submit">Confirm Booking</button>
    </form>
  );
};

export default BookingForm;
