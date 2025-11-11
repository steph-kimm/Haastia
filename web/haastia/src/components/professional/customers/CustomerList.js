import React from "react";

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch (error) {
    return "";
  }
};

const renderName = (entry) => {
  if (entry.customer?.name) {
    return entry.customer.name;
  }
  if (entry.guestInfo?.name) {
    return `${entry.guestInfo.name} (Guest)`;
  }
  if (entry.customer?.email) {
    return entry.customer.email;
  }
  if (entry.guestInfo?.email) {
    return `${entry.guestInfo.email} (Guest)`;
  }
  return "Unknown customer";
};

const renderSubtitle = (entry) => {
  if (entry.customer?.email) {
    return entry.customer.email;
  }
  if (entry.guestInfo?.email) {
    return entry.guestInfo.email;
  }
  if (entry.customer?.phone) {
    return entry.customer.phone;
  }
  if (entry.guestInfo?.phone) {
    return entry.guestInfo.phone;
  }
  return null;
};

const CustomerList = ({
  customers,
  activeCustomerId,
  onSelect,
  loading,
  error,
  searchTerm,
  onSearchTermChange,
  hasAnyCustomers,
}) => {
  if (loading) {
    return (
      <aside className="customers-sidebar">
        <div className="customers-sidebar__state">Loading customers...</div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="customers-sidebar">
        <div className="customers-sidebar__state customers-sidebar__state--error">
          {error}
        </div>
      </aside>
    );
  }

  const anyCustomers = hasAnyCustomers ?? customers.length > 0;
  const hasCustomers = customers.length > 0;

  return (
    <aside className="customers-sidebar">
      <header className="customers-sidebar__header">
        <h2>Your customers</h2>
        <p>Review recent activity and jump into client details.</p>
      </header>
      <div className="customers-sidebar__search">
        <span className="customers-sidebar__search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          type="search"
          value={searchTerm || ""}
          onChange={(event) => onSearchTermChange?.(event.target.value)}
          placeholder="Search by name, email, or phone"
          aria-label="Search customers"
        />
      </div>
      {hasCustomers ? (
        <ul className="customer-list">
          {customers.map((entry) => {
            const id = entry.customerId || entry.customerKey;
            const isActive = id === activeCustomerId;
            const subtitle = renderSubtitle(entry);

            return (
              <li
                key={id}
                className={`customer-list__item ${
                  isActive ? "customer-list__item--active" : ""
                }`}
              >
                <button
                  type="button"
                  className="customer-list__button"
                  onClick={() => onSelect(id)}
                >
                  <div className="customer-list__primary">{renderName(entry)}</div>
                  {subtitle ? (
                    <div className="customer-list__secondary">{subtitle}</div>
                  ) : null}
                  <div className="customer-list__meta">
                    <span className="customer-list__badge">
                      {entry.totalBookings} booking{entry.totalBookings === 1 ? "" : "s"}
                    </span>
                    {entry.lastBookingDate ? (
                      <span className="customer-list__date">
                        Last: {formatDate(entry.lastBookingDate)}
                      </span>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="customers-sidebar__state customers-sidebar__state--empty">
          {anyCustomers ? (
            <>
              <h3>No matches found</h3>
              <p>Try a different name, email, or phone number.</p>
            </>
          ) : (
            <>
              <h3>No customers yet</h3>
              <p>
                Once clients book with you, they will appear here for quick access to
                their history and notes.
              </p>
            </>
          )}
        </div>
      )}
    </aside>
  );
};

export default CustomerList;
