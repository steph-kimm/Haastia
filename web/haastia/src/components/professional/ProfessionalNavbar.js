import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useView } from "../../context/ViewContext";
import { clearAuthStorage, getValidToken } from "../../utils/auth";
import "./ProfessionalNavbar.css";

const ProfessionalNavbar = () => {
  const navigate = useNavigate();
  const { setCurrentView } = useView();
  const auth = getValidToken();
  const user = auth?.payload ?? null;
  const userId = user?._id || user?.id || null;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!auth) {
      navigate("/login");
    }
  }, [auth, navigate]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const handleResize = () => {
      if (window.innerWidth >= 960) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileOpen]);

  const handleLogout = () => {
    clearAuthStorage();
    navigate("/login");
    setDropdownOpen(false);
    setMobileOpen(false);
  };

  const switchToCustomer = () => {
    setCurrentView("customer");
    navigate("/");
    setDropdownOpen(false);
    setMobileOpen(false);
  };

  return (
    <nav className="pro-navbar">
      <div className="pro-navbar-shell">
        <div className="pro-brand-group">
          <button
            type="button"
            className="pro-brand"
            onClick={() => {
              navigate("/professional-home");
              setMobileOpen(false);
            }}
          >
            Haastia Pro
          </button>

          <button
            type="button"
            className="pro-toggle"
            aria-expanded={mobileOpen}
            aria-controls="professional-navigation"
            onClick={() => {
              setMobileOpen((open) => !open);
              setDropdownOpen(false);
            }}
          >
            <span className="sr-only">Toggle professional navigation</span>
            <span className="pro-toggle-bar" />
            <span className="pro-toggle-bar" />
            <span className="pro-toggle-bar" />
          </button>
        </div>

        <div
          id="professional-navigation"
          className={`pro-nav-content${mobileOpen ? " is-open" : ""}`}
        >
          <ul className="pro-nav-links">
            <li>
              <NavLink to="/professional-home" className="pro-link" onClick={() => setMobileOpen(false)}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/add-service" className="pro-link" onClick={() => setMobileOpen(false)}>
                Add Service
              </NavLink>
            </li>
            <li>
              <NavLink to="/services" className="pro-link" onClick={() => setMobileOpen(false)}>
                My Services
              </NavLink>
            </li>
            <li>
              <NavLink to="/availability" className="pro-link" onClick={() => setMobileOpen(false)}>
                Availability
              </NavLink>
            </li>
            <li>
              <NavLink to="/bookings" className="pro-link" onClick={() => setMobileOpen(false)}>
                Appointments
              </NavLink>
            </li>
            {userId && (
              <li>
                <NavLink
                  to={`/professional/${userId}`}
                  className="pro-link"
                  onClick={() => setMobileOpen(false)}
                >
                  View Public Profile
                </NavLink>
              </li>
            )}
          </ul>

          {user && (
            <div
              ref={menuRef}
              className={`pro-user-menu${dropdownOpen ? " is-open" : ""}`}
            >
              <button
                type="button"
                className="pro-user-trigger"
                aria-expanded={dropdownOpen}
                onClick={() => setDropdownOpen((open) => !open)}
              >
                <span className="pro-user-greeting">Hi, {user.name}</span>
                <svg className="pro-user-caret" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
                  <path d="M1.41.59 6 5.17 10.59.59 12 2l-6 6-6-6z" fill="currentColor" />
                </svg>
              </button>
              <div className="pro-dropdown" role="menu">
                <button type="button" onClick={switchToCustomer}>
                  Switch to Customer
                </button>
                <button type="button" onClick={handleLogout} className="logout">
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default ProfessionalNavbar;
