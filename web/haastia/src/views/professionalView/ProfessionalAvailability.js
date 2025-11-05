import React from "react";
import AvailabilityEditor from "../../components/AvailabilityEditor";
import "./ProfessionalAvailability.css";

const ProfessionalAvailability = () => {
  return (
    <div className="pro-availability-page">
      <header className="availability-header">
        <div className="availability-intro">
          <p className="eyebrow">Availability</p>
          <h1>Stay in control of your schedule</h1>
          <p className="sub">
            See your current weekly hours and quickly adjust the times clients can request
            appointments. Your changes are saved instantly once you hit save.
          </p>
        </div>

        <aside className="availability-tips">
          <h2>Quick tip</h2>
          <p>
            Keeping at least a few hours open across multiple days helps you appear higher in
            customer searches. Update this page whenever your schedule shifts.
          </p>
        </aside>
      </header>

      <section className="availability-editor-wrapper">
        <AvailabilityEditor />
      </section>
    </div>
  );
};

export default ProfessionalAvailability;
