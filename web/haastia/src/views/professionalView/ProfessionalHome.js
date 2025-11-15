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
        <div><span className="dot accepted" /> Accepted</div>
        <div><span className="dot pending" /> Pending</div>
        <div><span className="dot cancelled" /> Cancelled</div>
        <div><span className="dot completed" /> Completed</div>
      </div>

      {/* Calendar embedded directly */}
      <section className="pro-home-calendar">
        <ProfessionalCalendar />
      </section>
    </div>
  );
};

export default ProfessionalHome;
