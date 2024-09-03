import React from 'react';
import { Link } from 'react-router-dom';
import '../../../components/Navbar.css';

const ProfessionalNavbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/professional-home">ProHaastia</Link>
        {/* <Link to="/professional-home">Home</Link> */}
      </div>
      <div className="navbar-links">
        <Link to="/add-service">Add Service</Link>
        <Link to="/view-appointments">View Appointments</Link>
        <Link to="/profile">Profile</Link>
      </div>
    </nav>
  );
};

export default ProfessionalNavbar;
