import React, { useState } from "react";
import axios from "axios";

const BookingForm = ({ professionalId, service, availableSlots, onSuccess }) => {
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !timeSlot) return alert("Please select a date and time");

    try {
      const res = await axios.post("/api/bookings", {
        professional: professionalId,
        service: service._id,
        date,
        timeSlot: {
          start: timeSlot.split("-")[0],
          end: timeSlot.split("-")[1],
        },
      });

      alert("Booking request sent!");
      onSuccess?.(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to send booking request");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="booking-form">
      <h3>Book {service.title}</h3>
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

      <button type="submit">Confirm Booking</button>
    </form>
  );
};

export default BookingForm;
