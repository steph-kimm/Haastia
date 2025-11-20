import React from "react";
import SchedulingLimitsEditor from "../../components/SchedulingLimitsEditor";
import "./ProfessionalAvailability.css";

const ProfessionalSchedulingLimits = () => {
  return (
    <div className="pro-availability-page">
      <header className="availability-header">
        <div className="availability-intro">
          <p className="eyebrow">Availability</p>
          <h1>Scheduling limits</h1>
          <p className="sub">
            Keep bookings under control by setting minimum notice, advance booking windows, and caps
            on appointments per slot, day, or week. These settings update in real time for clients.
          </p>
        </div>

        <aside className="availability-tips">
          <h2>Why it matters</h2>
          <p>
            Strong limits prevent last-minute surprises and keep your workload balanced. Tweak these
            values whenever your capacity shifts so clients always have clear expectations.
          </p>
        </aside>
      </header>

      <section className="availability-editor-wrapper">
        <SchedulingLimitsEditor />
      </section>
    </div>
  );
};

export default ProfessionalSchedulingLimits;
