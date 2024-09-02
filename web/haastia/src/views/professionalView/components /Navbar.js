// src/components/professional/ProfessionalNavbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const ProfessionalNavbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/professional/home">Professional Home</Link>
            </div>
            <div className="navbar-links">
                <Link to="/professional/dashboard">Dashboard</Link>
                <Link to="/professional/add-service">Add Service</Link>
                <Link to="/professional/appointments">Upcoming Appointments</Link>
            </div>
        </nav>
    );
};

export default ProfessionalNavbar;
