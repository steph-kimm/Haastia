import React, { useState } from "react";
import axios from "axios";
import { getValidToken } from "../../utils/auth";

const BookingForm = ({ professionalId, service, availableSlots, onSuccess }) => {
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const auth = getValidToken();
  const token = auth?.token || "";
  const isLoggedIn = Boolean(token);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !timeSlot) {
      return setFeedback({ type: "error", message: "Please select a date and time." });
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
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div>
        <label>Available Time Slots:</label>
        <select
          value={timeSlot}
          onChange={(e) => setTimeSlot(e.target.value)}
        >
          <option value="">Select a time</option>
          {availableSlots.map((slot, i) => (
            <option key={i} value={`${slot.start}-${slot.end}`}>
              {slot.start} - {slot.end}
            </option>
          ))}
        </select>
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
