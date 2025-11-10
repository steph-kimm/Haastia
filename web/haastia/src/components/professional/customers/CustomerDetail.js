import React from "react";

const renderValue = (value, fallback = "Not provided") => {
  if (!value) return fallback;
  return value;
};

const formatLastSeen = (bookings) => {
  if (!bookings?.length) return null;
  const [latest] = bookings;
  if (!latest?.date) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(latest.date));
  } catch (error) {
    return null;
  }
};

const CustomerDetail = ({ customer, guestInfo, bookings, loading, error }) => {
  if (loading) {
    return (
      <section className="customer-detail">
        <h2>Customer details</h2>
        <p className="customer-detail__state">Loading customer information...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="customer-detail">
        <h2>Customer details</h2>
        <p className="customer-detail__state customer-detail__state--error">
          {error}
        </p>
      </section>
    );
  }

  if (!customer && !guestInfo) {
    return (
      <section className="customer-detail">
        <h2>Customer details</h2>
        <p className="customer-detail__state">
          Select a customer from the left to view their profile, notes, and booking
          history.
        </p>
      </section>
    );
  }

  const display = customer || guestInfo || {};
  const lastSeen = formatLastSeen(bookings);

  return (
    <section className="customer-detail">
      <h2>Customer details</h2>
      <div className="customer-detail__card">
        <div className="customer-detail__row">
          <span className="customer-detail__label">Name</span>
          <span className="customer-detail__value">
            {renderValue(display.name, "Unnamed customer")}
          </span>
        </div>
        <div className="customer-detail__row">
          <span className="customer-detail__label">Email</span>
          <span className="customer-detail__value">
            {renderValue(display.email)}
          </span>
        </div>
        <div className="customer-detail__row">
          <span className="customer-detail__label">Phone</span>
          <span className="customer-detail__value">
            {renderValue(display.phone)}
          </span>
        </div>
        {lastSeen ? (
          <div className="customer-detail__row">
            <span className="customer-detail__label">Last visit</span>
            <span className="customer-detail__value">{lastSeen}</span>
          </div>
        ) : null}
        {guestInfo ? (
          <p className="customer-detail__disclaimer">
            This guest has not created an account yet. Notes are disabled until they
            sign up with the email or phone above.
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default CustomerDetail;
