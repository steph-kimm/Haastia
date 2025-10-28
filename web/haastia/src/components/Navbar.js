import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { jwtDecode } from 'jwt-decode';
import { useView } from '../context/ViewContext';

function Navbar() {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { currentView, setCurrentView } = useView();

  const userName = token ? jwtDecode(token).name : null;
  const userRole = token ? jwtDecode(token).role : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentView');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Haastia</Link>
        <Link to="/">Home</Link>
      </div>

      <div className="navbar-links">
        {userName ? (
          <div className="user-menu">
            <span className="user-name">{userName || 'name'}</span>
            <div className="dropdown-content">
              <Link to="/profile" className="dropdown-item">
                Account
              </Link>

              {/* ✅ Toggle view buttons */}
              {currentView === 'professional' ? (
                <button
                  onClick={() => {
                    setCurrentView('customer');
                    navigate('/');
                  }}
                >
                  Switch to Customer View
                </button>
              ) : (
                userRole === 'professional' && (
                  <button
                    onClick={() => {
                      setCurrentView('professional');
                      navigate('/professional-home');
                    }}
                  >
                    Switch to Professional View
                  </button>
                )
              )}

              <button onClick={handleLogout} className="dropdown-item">
                Logout
              </button>
            </div>
          </div>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
