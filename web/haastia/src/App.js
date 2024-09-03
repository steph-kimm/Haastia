import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './views/AppRoutes';

function App() {
    const [currentView, setCurrentView] = useState('customer'); // default view

    // Use the context or any other logic to determine the current view
    return (
        <Router>
            <AppRoutes currentView={currentView} />
        </Router>
    );
}

export default App;


// import React, {useState, useEffect} from 'react';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import Home from './components/Pages/Home';
// import ServiceDetail from './components/Pages/ServiceDetail';
// import Login from './components/Pages/auth/Login';
// import Signup from './components/Pages/auth/Signup';
// import Navbar from './components/Navbar';
// import UserProfile from './components/Pages/Profile';
// import HelpCenter from './components/Pages/HelpCenter';
// import ProfessionalNavbar from './views/professionalView/components /Navbar';
// import ProfessionalHome from './views/professionalView/ProfessionalHome';
// import ViewWrapper from './views/ViewWrapper';

// function App() {
//   const [userView, setUserView] = useState('customer'); // or get from context/localStorage

//   useEffect(() => {
//     // Logic to determine user view from token or user context
//     // Example: setUserView('professional'); // based on token or profile
//   }, []);

//   const renderNavbar = () => {
//     switch (userView) {
//       case 'professional':
//         return <ProfessionalNavbar />;
//       case 'customer':
//         return <Navbar />;
//       // case 'admin':
//       //   return <AdminNavbar />;
//       default:
//         return null;
//     }
//   };


//   return (
//     <Router>
//       <div className="App">
//         <Navbar />
//         <Routes>
          
//           <Route path="/login" element={<Login />} />
//           <Route path="/signup" element={<Signup />} />
//           <Route path="/service/:id" element={<ServiceDetail />} />

//           <Route path="/profile/:userId" element={<UserProfile />} />
//           <Route path="/help" element={<HelpCenter />} />
//           <Route path="/" element={<Home />} />
//           <Route path="/" component={<ViewWrapper />} />

//         </Routes>
//       </div>
//     </Router>
//   );
// }

// export default App;
