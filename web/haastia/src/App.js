import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Pages/Home';
import ServiceDetail from './components/Pages/ServiceDetail';
import Login from './components/Pages/auth/Login';
import Signup from './components/Pages/auth/Signup';
import Navbar from './components/Navbar';
import UserProfile from './components/Pages/Profile';
import HelpCenter from './components/Pages/HelpCenter';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/service/:id" element={<ServiceDetail />} />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="/help" element={<HelpCenter />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
