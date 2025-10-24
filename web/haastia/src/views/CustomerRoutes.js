import React from 'react';
import { Route, Routes } from 'react-router-dom';

import UserProfile from '../components/Pages/Profile';
// Import other customer-specific components
import Login from '../components/Pages/auth/Login.js';
import Signup from '../components/Pages/auth/Signup.js';
import ServiceDetail from '../components/Pages/ServiceDetail.js';
import HelpCenter from '../components/Pages/HelpCenter.js';
import Home from '../components/Pages/Home.js'
import SettingsPage from '../components/Pages/user/SettingsPage';

const CustomerRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/service/:id" element={<ServiceDetail />} />
            <Route path="/help" element={<HelpCenter />} />
             <Route path="/settings" element={<SettingsPage />} />
        </Routes>
    );
};

export default CustomerRoutes;
