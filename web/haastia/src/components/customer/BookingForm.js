import React, { useMemo, useState } from "react";
import axios from "axios";
import { getValidToken } from "../../utils/auth";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const getTodayISODate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split("T")[0];
};

const BookingForm = ({ professionalId, service, availability = [], onSuccess }) => {
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const auth = getValidToken();
  const token = auth?.token || "";
  const isLoggedIn = Boolean(token);

  const availableSlotsForSelectedDate = useMemo(() => {
    if (!date) return [];
    const selectedDate = new Date(`${date}T00:00:00`);
    const dayName = DAY_NAMES[selectedDate.getDay()];
    const dayAvailability = availability.find(
      (entry) => entry.day?.toLowerCase() === dayName.toLowerCase()
    );
    return dayAvailability?.slots ?? [];
  }, [availability, date]);

  const handleDateChange = (value) => {
    setDate(value);
    setTimeSlot("");
  };

  const todayISODate = useMemo(getTodayISODate, []);

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

    const dayName = DAY_NAMES[selectedDate.getDay()];
    const dayAvailability = availability.find(
      (entry) => entry.day?.toLowerCase() === dayName.toLowerCase()
    );

    const isSlotAvailable = dayAvailability?.slots?.some(
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
          disabled={!date || availableSlotsForSelectedDate.length === 0}
        >
          <option value="">Select a time</option>
          {availableSlotsForSelectedDate.map((slot, i) => (
            <option key={i} value={`${slot.start}-${slot.end}`}>
              {slot.start} - {slot.end}
            </option>
          ))}
        </select>
        {date && availableSlotsForSelectedDate.length === 0 && (
          <p className="feedback warning">No availability for the selected date.</p>
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
