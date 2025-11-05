import React, { useEffect } from "react";
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

  useEffect(() => {
    if (!auth) {
      navigate("/login");
    }
  }, [auth, navigate]);

  const handleLogout = () => {
    clearAuthStorage();
    navigate("/login");
  };

  const switchToCustomer = () => {
    setCurrentView("customer");
    navigate("/");
  };

  return (
    <nav className="pro-navbar">
      <div className="pro-nav-left">
        <h2 className="pro-brand" onClick={() => navigate("/professional-home")}>
          Haastia Pro
        </h2>
        <ul className="pro-nav-links">
          <li><NavLink to="/professional-home" className="pro-link">Dashboard</NavLink></li>
          <li><NavLink to="/add-service" className="pro-link">Add Service</NavLink></li>
          <li><NavLink to="/services" className="pro-link">My Services</NavLink></li>
          <li><NavLink to="/availability" className="pro-link">Availability</NavLink></li>
          <li><NavLink to="/bookings" className="pro-link">Appointments</NavLink></li>

          {/* Only show if we have a valid userId */}
          {userId && (
            <li>
              <NavLink to={`/professional/${userId}`} className="pro-link">
                View Public Profile
              </NavLink>
            </li>
          )}
        </ul>
      </div>

      <div className="pro-nav-right">
        {user && (
          <div className="pro-user-menu">
            <span className="pro-user-name">Hi, {user.name}</span>
            <div className="pro-dropdown">
              <button onClick={switchToCustomer}>Switch to Customer</button>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default ProfessionalNavbar;
