import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ProfessionalHome from '../views/professionalView/ProfessionalHome';
import MyServices from '../views/professionalView/MyServices';
import AddServiceForm from '../views/professionalView/AddServiceForm';
// import UpcomingAppointments from './Professional/UpcomingAppointments';
// Import other professional-specific components

const ProfessionalRoutes = () => {
    return (
        <Routes>
            {/* <Route exact path="/" component={ProfessionalHome} /> */}
            <Route path="/add-service" element={<AddServiceForm />} />
            <Route path="/professional-home" element={<ProfessionalHome />} />
            <Route path="/Services" element={<MyServices />} />
            {/* <Route path="/upcoming-appointments" component={UpcomingAppointments} /> */}
            {/* Add more professional-specific routes here */}
        </Routes>
    );
};

export default ProfessionalRoutes;
