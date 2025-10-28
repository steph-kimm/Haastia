import React from 'react';
import { Route, Routes } from 'react-router-dom';

import UserProfile from '../components/Pages/Profile';
import Login from '../components/Pages/auth/Login.js';
import Signup from '../components/Pages/auth/Signup.js';
import ServiceDetail from '../components/Pages/ServiceDetail.js';
import HelpCenter from '../components/Pages/HelpCenter.js';
import Home from '../components/Pages/Home.js';
import SettingsPage from '../components/Pages/user/SettingsPage';
import ProfessionalProfile from '../components/customer/ProfessionalProfile.js';
import ProfessionalBookingPage from '../components/Pages/booking/ProfessionalBookingPage.js';

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

      {/* Professional public profile */}
      <Route path="/professional/:id" element={<ProfessionalProfile />} />

      {/* ✅ New route for booking a professional */}
      <Route path="/professional/:id/book" element={<ProfessionalBookingPage />} />
    </Routes>
  );
};

export default CustomerRoutes;
