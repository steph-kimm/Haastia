import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useView } from '../context/ViewContext' 
import CustomerRoutes from './CustomerRoutes';
import ProfessionalRoutes from './ProfessionalRoutes';
import AdminRoutes from './AdminRoutes';
// import ProfessionalNavbar from './professionalView/components/Navbar';

import Navbar from '../components/Navbar';
// import AdminNavbar from '../components/AdminNavbar';

// function AppRoutes({ currentView }) {
function AppRoutes() {
    const { currentView } = useView();
    return (
        <>
            {currentView === 'customer' && (
                <>
                    <Navbar />
                    <CustomerRoutes />
                </>
            )}
            {currentView === 'professional' && (
                <>
                    {/* <ProfessionalNavbar /> */}
                    <ProfessionalRoutes />
                </>
            )}
            {currentView === 'admin' && (
                <>
                    {/* <AdminNavbar /> */}
                    <AdminRoutes />
                </>
            )}
        </>
    );
}

export default AppRoutes;
