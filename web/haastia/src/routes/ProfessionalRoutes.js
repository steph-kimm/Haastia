import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ProfessionalHome from '../views/professionalView/ProfessionalHome';
import MyServices from '../views/professionalView/MyServices';
import AddServicePage from '../views/professionalView/AddServicePage';
// import UpcomingAppointments from './Professional/UpcomingAppointments';
// Import other professional-specific components
import ProfessionalRequests from '../views/professionalView/ProfessionalRequests';

const ProfessionalRoutes = () => {
    return (
        <Routes>
            {/* <Route exact path="/" component={ProfessionalHome} /> */}
            <Route path="/add-service" element={<AddServicePage />} />
            <Route path="/professional-home" element={<ProfessionalHome />} />
            <Route path="/Services" element={<MyServices />} />
            {/* <Route path="/upcoming-appointments" component={UpcomingAppointments} /> */}
            {/* Add more professional-specific routes here */}
            <Route path="/bookings" element={<ProfessionalRequests />} />
        </Routes>
    );
};

export default ProfessionalRoutes;
