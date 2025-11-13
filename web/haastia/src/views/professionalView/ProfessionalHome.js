// src/views/professionalView/ProfessionalHome.jsx
import React from "react";
import ProfessionalCalendar from "../../components/professional/ProfessionalCalendar/ProfessionalCalendar";
import "./ProfessionalHome.css";

const ProfessionalHome = () => {
  return (
    <div className="pro-home">
      <header className="pro-home-header">
        <div>
          <h1>Calendar</h1>
          <p className="sub">Review upcoming appointments at a glance.</p>
        </div>

        {/* Optional quick actions */}
        <div className="quick-actions">
          <a href="/availability" className="qa-btn">Edit Availability</a>
          <a href="/bookings" className="qa-btn outline">View Requests</a>
        </div>
      </header>

      {/* Status legend */}
      <div className="legend">
        <span className="dot accepted" /> Accepted
        <span className="dot pending" /> Pending
        <span className="dot cancelled" /> Cancelled
        <span className="dot completed" /> Completed
      </div>

      {/* Calendar embedded directly */}
      <section className="pro-home-calendar">
        <ProfessionalCalendar />
      </section>
    </div>
  );
};

export default ProfessionalHome;
