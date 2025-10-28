import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ProfessionalBookingPage.css";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProfessionalBookingPage = () => {
  const { id: professionalId } = useParams();
  const [professional, setProfessional] = useState(null);
  const [services, setServices] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "", phone: "" });
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  useEffect(() => {
    fetchProfessional();
  }, [professionalId]);
// TODO: refacter to fetch availability when they press a button?
  const fetchProfessional = async () => {
    try {
      const [userRes, serviceRes, availRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/user/get-user/${professionalId}`),
        axios.get(`http://localhost:8000/api/services/by-user/${professionalId}`),
        axios.get(`http://localhost:8000/api/availability/${professionalId}`)
      ]);
      setProfessional(userRes.data);
      setServices(serviceRes.data);
      setAvailability(availRes.data);
      console.log("services",services)
    } catch (err) {
      console.error("Error loading professional data:", err);
    }
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) {
      alert("Please select a service, date, and time slot.");
      return;
    }

    const bookingData = {
      professional: professionalId,
      service: selectedService,
      date: selectedDate,
      timeSlot: selectedSlot,
    };

    if (isLoggedIn) {
      // logged-in user
      console.log(token)
      try {
        const res = await axios.post("http://localhost:8000/api/bookings", bookingData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage("Booking request sent successfully!");
        console.log("Booking:", res.data);
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
        console.log(guestInfo);
        const res = await axios.post("http://localhost:8000/api/bookings", {
          ...bookingData,
          guestInfo,
        });
        setMessage("Booking request sent successfully!");
        console.log("Guest booking:", res.data);
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
        {availability.map((dayObj) => (
          <div key={dayObj.day}>
            <h4>{dayObj.day}</h4>
            <div className="slots">
              {dayObj.slots.map((slot, i) => (
                <button
                  key={i}
                  className={`slot-btn ${
                    selectedSlot?.start === slot.start ? "selected" : ""
                  }`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {slot.start} - {slot.end}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="date-section">
        <h3>Select Date</h3>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
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
