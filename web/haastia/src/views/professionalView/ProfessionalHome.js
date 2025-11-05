// src/views/professionalView/ProfessionalHome.jsx
import React from "react";
import { Link } from "react-router-dom";
import ProfessionalCalendar from "../../components/professional/ProfessionalCalendar/ProfessionalCalendar";
import "./ProfessionalHome.css";

const ProfessionalHome = () => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="pro-home">
      <div className="pro-home-inner">
        <header className="pro-home-header">
          <div className="pro-home-heading">
            <span className="pro-home-kicker">{formattedDate}</span>
            <h1>Professional Dashboard</h1>
            <p className="pro-home-sub">
              Stay aligned with your bookings, manage your services, and respond to client needs without leaving this page.
            </p>
          </div>

          <div className="pro-home-actions">
            <Link to="/add-service" className="pro-action primary">
              Add a new service
            </Link>
            <Link to="/bookings" className="pro-action subtle">
              Review appointment requests
            </Link>
          </div>
        </header>

        <section className="pro-home-overview" aria-label="Today at a glance">
          <article className="pro-overview-card highlight">
            <span className="card-eyebrow">Next up</span>
            <h2>No appointments scheduled</h2>
            <p>
              Set your availability so clients can easily secure a time that works for you.
            </p>
            <Link to="/availability" className="card-link">
              Update availability
            </Link>
          </article>

          <article className="pro-overview-card">
            <span className="card-eyebrow">Quick tips</span>
            <ul>
              <li>Respond promptly to new booking requests to keep your calendar full.</li>
              <li>Keep your services up to date so clients know exactly what you offer.</li>
              <li>Use the availability planner to block personal time instantly.</li>
            </ul>
          </article>
        </section>

        <section className="pro-home-content">
          <aside className="pro-home-meta" aria-label="Legend and shortcuts">
            <div className="pro-legend">
              <h2>Status legend</h2>
              <ul>
                <li><span className="dot accepted" aria-hidden="true" /> Accepted</li>
                <li><span className="dot pending" aria-hidden="true" /> Pending</li>
                <li><span className="dot cancelled" aria-hidden="true" /> Cancelled</li>
                <li><span className="dot completed" aria-hidden="true" /> Completed</li>
              </ul>
            </div>

            <div className="pro-shortcuts">
              <h2>Shortcuts</h2>
              <div className="shortcut-grid">
                <Link to="/services" className="shortcut-pill">
                  Manage services
                </Link>
                <Link to="/professional-home" className="shortcut-pill">
                  View dashboard
                </Link>
                <Link to="/profile" className="shortcut-pill">
                  Update profile
                </Link>
              </div>
            </div>
          </aside>

          <section className="pro-calendar-card" aria-label="Schedule">
            <header className="pro-calendar-header">
              <div>
                <h2>Schedule</h2>
                <p>Review bookings, update slots, and manage reschedules in one view.</p>
              </div>
              <Link to="/availability" className="calendar-action">
                Adjust availability
              </Link>
            </header>
            <div className="pro-calendar-shell">
              <ProfessionalCalendar />
            </div>
          </section>
        </section>
      </div>
    </div>
  );
};

export default ProfessionalHome;
