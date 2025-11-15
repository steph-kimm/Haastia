import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useView } from "../../context/ViewContext";
import { clearAuthStorage, getValidToken } from "../../utils/auth";
import "./ProfessionalNavbar.css";

const ProfessionalNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentView } = useView();
  const auth = getValidToken();
  const user = auth?.payload ?? null;
  const userId = user?._id || user?.id || null;
  const userRole = user?.role || null;
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!auth) {
      navigate("/login");
    }
  }, [auth, navigate]);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuthStorage();
    setCurrentView("customer");
    navigate("/login");
  };

  const switchToCustomer = () => {
    setCurrentView("customer");
    navigate("/");
  };

  const toggleMobileNav = () => {
    setIsMobileNavOpen((prev) => !prev);
  };

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
  };

  const linkClassName = ({ isActive }) =>
    `pro-link${isActive ? " pro-link--active" : ""}`;

  return (
    <>
      <button
        type="button"
        className="pro-navbar__mobile-trigger"
        onClick={toggleMobileNav}
        aria-expanded={isMobileNavOpen}
        aria-controls="professional-navigation"
      >
        <span className="pro-navbar__mobile-trigger-bar" />
        <span className="pro-navbar__mobile-trigger-bar" />
        <span className="pro-navbar__mobile-trigger-bar" />
        <span className="sr-only">Toggle navigation</span>
      </button>

      {isMobileNavOpen && (
        <div className="pro-navbar__backdrop" onClick={closeMobileNav} />
      )}

      <nav
        id="professional-navigation"
        className={`pro-navbar${isMobileNavOpen ? " pro-navbar--open" : ""}`}
      >
        <div className="pro-navbar__header">
          <h2
            className="pro-brand"
            onClick={() => {
              closeMobileNav();
              navigate("/professional-home");
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                closeMobileNav();
                navigate("/professional-home");
              }
            }}
          >
            Haastia Pro <br></br>Dashboard
          </h2>
          <button
            type="button"
            className="pro-navbar__close"
            onClick={closeMobileNav}
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        <div className="pro-navbar__menu">
          <p className="pro-navbar__section-label">Overview</p>
          <ul className="pro-nav-links">
            <li>
              <NavLink to="/onboarding" className={linkClassName}>
                Onboarding
              </NavLink>
            </li>
            <li>
              <NavLink to="/profile-guidelines" className={linkClassName}>
                House rules
              </NavLink>
            </li>
            <li>
              <NavLink to="/professional-home" className={linkClassName}>
                Calendar
              </NavLink>
            </li>
            <li>
              <NavLink to="/services" className={linkClassName}>
                My Services
              </NavLink>
            </li>
            <li>
              <NavLink to="/add-service" className={linkClassName}>
                Add Service
              </NavLink>
            </li>
            <li>
              <NavLink to="/availability" className={linkClassName}>
                Availability
              </NavLink>
            </li>
            <li>
              <NavLink to="/bookings" className={linkClassName}>
                Appointments
              </NavLink>
            </li>
            {userRole === "professional" && (
              <li>
                <NavLink to="/payments/connect" className={linkClassName}>
                  Payouts
                </NavLink>
              </li>
            )}
            {userRole === "professional" && (
              <li>
                <NavLink to="/customers" className={linkClassName}>
                  Customers
                </NavLink>
              </li>
            )}

            {userId && (
              <li>
                <NavLink
                  to={`/professional/${userId}`}
                  className={linkClassName}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="pro-link__content">
                    <span className="pro-link__label">View Public Profile</span>
                    <span className="pro-link__icon" aria-hidden="true">
                      ↗
                    </span>
                  </span>
                  <span className="sr-only">Opens in a new tab</span>
                </NavLink>
              </li>
            )}
          </ul>
        </div>

        <div className="pro-navbar__footer">
          {user && (
            <div className="pro-navbar__user">
              <span className="pro-navbar__user-label">Signed in as</span>
              <span className="pro-navbar__user-name">{user.name}</span>
            </div>
          )}

          <div className="pro-navbar__actions">
            <button type="button" onClick={switchToCustomer}>
              Exit Dashboard
            </button>
            <button type="button" onClick={handleLogout} className="pro-navbar__logout">
              Logout
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default ProfessionalNavbar;
