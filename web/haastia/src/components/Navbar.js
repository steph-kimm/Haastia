import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useView } from '../context/ViewContext';
import { clearAuthStorage, getValidToken } from '../utils/auth';

function Navbar() {
  const navigate = useNavigate();
  const { currentView, setCurrentView } = useView();
  const auth = getValidToken();

  const userName = auth?.payload?.name ?? null;
  const handleLogout = () => {
    clearAuthStorage();
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
              <button
                className="dropdown-item"
                onClick={() => {
                  setCurrentView('professional');
                  navigate('/calendar');
                }}
              >
                Professional Dashboard
              </button>

              <button
                className="dropdown-item"
                onClick={() => navigate('/settings')}
              >
                Settings
              </button>

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
