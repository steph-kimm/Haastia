import React from "react";

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch (error) {
    return "";
  }
};

const formatSlot = (slot) => {
  if (!slot) return null;
  if (slot.start && slot.end) {
    return `${slot.start} - ${slot.end}`;
  }
  if (slot.start) {
    return slot.start;
  }
  return null;
};

const AppointmentHistory = ({ bookings, loading, error }) => {
  return (
    <section className="appointment-history">
      <h2>Appointment history</h2>
      {error ? (
        <p className="appointment-history__state appointment-history__state--error">
          {error}
        </p>
      ) : loading ? (
        <p className="appointment-history__state">Loading booking history...</p>
      ) : !bookings?.length ? (
        <div className="appointment-history__empty">
          <h3>No past appointments</h3>
          <p>
            Completed or in-progress bookings with this customer will appear here
            once available.
          </p>
        </div>
      ) : (
        <ul className="appointment-history__list">
          {bookings.map((booking) => (
            <li key={booking._id} className="appointment-history__item">
              <div>
                <div className="appointment-history__service">
                  {booking.service?.title || "Service"}
                </div>
                <div className="appointment-history__date">
                  {formatDate(booking.date)}
                  {booking.status ? ` • ${booking.status}` : ""}
                </div>
              </div>
              <div className="appointment-history__meta">
                {formatSlot(booking.timeSlot) ? (
                  <span>{formatSlot(booking.timeSlot)}</span>
                ) : null}
                {booking.service?.duration ? (
                  <span>{booking.service.duration} min</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default AppointmentHistory;
