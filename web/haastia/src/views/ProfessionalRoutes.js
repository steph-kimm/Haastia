import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ProfessionalHome from './professionalView/ProfessionalHome';
// import AddService from './Professional/AddService';
// import UpcomingAppointments from './Professional/UpcomingAppointments';
// Import other professional-specific components

const ProfessionalRoutes = () => {
    return (
        <Routes>
            {/* <Route exact path="/" component={ProfessionalHome} />
            <Route path="/add-service" component={AddService} /> */}
            <Route path="/professional-home" element={<ProfessionalHome />} />
            {/* <Route path="/upcoming-appointments" component={UpcomingAppointments} /> */}
            {/* Add more professional-specific routes here */}
        </Routes>
    );
};

export default ProfessionalRoutes;
