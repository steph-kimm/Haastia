import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ProfessionalHome from './professionalView/ProfessionalHome';
import Services from './professionalView/Services';
import AddServiceForm from './professionalView/AddServiceForm';
// import UpcomingAppointments from './Professional/UpcomingAppointments';
// Import other professional-specific components

const ProfessionalRoutes = () => {
    return (
        <Routes>
            {/* <Route exact path="/" component={ProfessionalHome} /> */}
            <Route path="/add-service" element={<AddServiceForm />} />
            <Route path="/professional-home" element={<ProfessionalHome />} />
            <Route path="/Services" element={<Services />} />
            {/* <Route path="/upcoming-appointments" component={UpcomingAppointments} /> */}
            {/* Add more professional-specific routes here */}
        </Routes>
    );
};

export default ProfessionalRoutes;
