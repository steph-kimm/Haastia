// NOT USED, SWITCHED TO APP ROUTES
import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.js';
import ProfessionalNavbar from './professionalView/components /Navbar.js';
// import AdminNavbar from './AdminNavbar';
import { Routes, Route } from 'react-router-dom';
import CustomerRoutes from './CustomerRoutes.js'; // Routes specific to customers
import ProfessionalRoutes from './ProfessionalRoutes.js'; // Routes specific to professionals
import AdminRoutes from './AdminRoutes.js'; // Routes specific to admin

const ViewWrapper = () => {
    const location = useLocation();
    const view = localStorage.getItem('activeView') || 'customer';

    const renderNavbar = () => {
        switch (view) {
            case 'professional':
                return <ProfessionalNavbar />;
            // case 'admin':
            //     return <AdminNavbar />;
            default:
                return <Navbar />;
        }
    };

    const renderRoutes = () => {
        switch (view) {
            case 'professional':
                return <ProfessionalRoutes />;
            // case 'admin':
            //     return <AdminRoutes />;
            default:
                return <CustomerRoutes />;
        }
    };

    return (
        <div>
            {renderNavbar()}
            <div className="main-content">
                <Routes location={location}>{renderRoutes()}</Routes>
            </div>
        </div>
    );
};

export default ViewWrapper;
