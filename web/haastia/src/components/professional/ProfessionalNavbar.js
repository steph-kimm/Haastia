import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useView } from "../../context/ViewContext";
import "./ProfessionalNavbar.css"; // optional styling

const ProfessionalNavbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { setCurrentView } = useView();

  const user = token ? jwtDecode(token) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentView");
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
          <li>
            <NavLink to="/professional-home" className="pro-link">
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/add-service" className="pro-link">
              Add Service
            </NavLink>
          </li>
          <li>
            <NavLink to="/services" className="pro-link">
              My Services
            </NavLink>
          </li>
          <li>
            <NavLink to="/availability" className="pro-link">
              Availability
            </NavLink>
          </li>
          <li>
            <NavLink to="/bookings" className="pro-link">
              Appointments
            </NavLink>
          </li>
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
