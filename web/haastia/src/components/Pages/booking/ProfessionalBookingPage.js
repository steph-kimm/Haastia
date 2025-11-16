import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./ProfessionalBookingPage.css";
import { useParams } from "react-router-dom";
import { getValidToken } from "../../../utils/auth";
import {
  getDayAvailabilityForDate,
  groupBlockedTimesByDate,
  filterSlotsAgainstBlocks,
  toISODateString,
} from "../../../utils/availability";

const ProfessionalBookingPage = () => {
  const { id: professionalId } = useParams();
  const [professional, setProfessional] = useState(null);
  const [services, setServices] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "", phone: "" });
  const [message, setMessage] = useState("");
  const [blockedTimes, setBlockedTimes] = useState([]);

  const auth = getValidToken();
  const token = auth?.token;
  const isLoggedIn = Boolean(token);

  useEffect(() => {
    fetchProfessional();
  }, [professionalId]);
// TODO: refacter to fetch availability when they press a button?
  const fetchProfessional = async () => {
    try {
      const rangeStart = new Date();
      rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeEnd.getDate() + 90);

      const [userRes, serviceRes, availRes, blockedRes] = await Promise.all([
        axios.get(`/api/user/get-user/${professionalId}`),
        axios.get(`/api/services/by-user/${professionalId}`),
        axios.get(`/api/availability/${professionalId}`),
        axios.get(`/api/blocked-times/${professionalId}`, {
          params: {
            start: toISODateString(rangeStart),
            end: toISODateString(rangeEnd),
          },
        }),
      ]);
      setProfessional(userRes.data);
      setServices(serviceRes.data);
      setAvailability(availRes.data);
      setBlockedTimes(Array.isArray(blockedRes.data) ? blockedRes.data : []);
    } catch (err) {
      console.error("Error loading professional data:", err);
    }
  };

  const blockedByDate = useMemo(
    () => groupBlockedTimesByDate(blockedTimes),
    [blockedTimes]
  );

  const availableSlotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dayAvailability = getDayAvailabilityForDate(availability, selectedDate);
    const baseSlots = dayAvailability?.slots ?? [];
    const blocks = blockedByDate.get(selectedDate) ?? [];
    return filterSlotsAgainstBlocks(baseSlots, blocks);
  }, [availability, selectedDate, blockedByDate]);

  useEffect(() => {
    if (!selectedSlot) return;
    const stillAvailable = availableSlotsForSelectedDate.some(
      (slot) => `${slot.start}-${slot.end}` === selectedSlot
    );
    if (!stillAvailable) {
      setSelectedSlot("");
    }
  }, [availableSlotsForSelectedDate, selectedSlot]);

  const handleDateChange = (value) => {
    setSelectedDate(value);
    setSelectedSlot("");
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) {
      alert("Please select a service, date, and time slot.");
      return;
    }

    const [start, end] = selectedSlot.split("-");

    const bookingData = {
      professional: professionalId,
      service: selectedService,
      date: selectedDate,
      timeSlot: {
        start,
        end,
      },
    };

    if (isLoggedIn) {
      // logged-in user
      try {
        const res = await axios.post("/api/bookings", bookingData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage("Booking request sent successfully!");
      } catch (err) {
        console.error("Error booking:", err);
        setMessage("Error sending booking request.");
      }
    } else {
      // guest user
      if (!guestInfo.name || !guestInfo.email || !guestInfo.phone) {
        alert("Please fill in your contact information.");
        return;
      }
      try {
        const res = await axios.post("/api/bookings", {
          ...bookingData,
          guestInfo,
        });
        setMessage("Booking request sent successfully!");
      } catch (err) {
        console.error("Error booking as guest:", err);
        setMessage("Error sending booking request.");
      }
    }
  };

  return (
    <div className="booking-page">
      <div className="profile-section">
        <img
          src={professional?.image?.url || "/default-avatar.jpg"}
          alt={professional?.name}
          className="profile-img"
        />
        <h2>{professional?.name}</h2>
        <p>{professional?.location}</p>
      </div>

      <div className="services-section">
        <h3>Available Services</h3>
        <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
          <option value="">Select a service</option>
          {services.map((s) => (
            <option key={s._id} value={s._id}>
              {s.title} — ${s.price}
            </option>
          ))}
        </select>
      </div>

      <div className="availability-section">
        <h3>Availability</h3>
        {!selectedDate && (
          <p className="availability-note">Select a date to view open time slots.</p>
        )}
        {selectedDate && (
          <div className="slots">
            {availableSlotsForSelectedDate.length ? (
              availableSlotsForSelectedDate.map((slot) => {
                const key = `${slot.start}-${slot.end}`;
                const isSelected = selectedSlot === key;
                return (
                  <button
                    key={key}
                    className={`slot-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedSlot(key)}
                  >
                    {slot.start} - {slot.end}
                  </button>
                );
              })
            ) : (
              <p className="availability-note">No availability for this date.</p>
            )}
          </div>
        )}
      </div>

      <div className="date-section">
        <h3>Select Date</h3>
        <input type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} />
      </div>

      {!isLoggedIn && (
        <div className="guest-info-section">
          <h3>Your Information</h3>
          <input
            type="text"
            placeholder="Full Name"
            value={guestInfo.name}
            onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={guestInfo.email}
            onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={guestInfo.phone}
            onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
          />
        </div>
      )}

      <button className="book-btn" onClick={handleBooking}>
        Book Service
      </button>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default ProfessionalBookingPage;
