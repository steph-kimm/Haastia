import React from 'react';
import { Route, Routes } from 'react-router-dom';
// import AdminDashboard from './Admin/AdminDashboard';
// import ManageUsers from './Admin/ManageUsers';
// import ViewStats from './Admin/ViewStats';
// Import other admin-specific components

const AdminRoutes = () => {
    return (
        <Routes>
            {/* <Route exact path="/" component={AdminDashboard} /> */}
            {/* <Route path="/manage-users" component={ManageUsers} />
            <Route path="/view-stats" component={ViewStats} /> */}
            {/* Add more admin-specific routes here */}
        </Routes>
    );
};

export default AdminRoutes;
