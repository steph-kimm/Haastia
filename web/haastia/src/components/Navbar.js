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
      <div className="navbar-wrapper">
        <div className="navbar-brand">
          <Link to="/" className="brand-logo">
            Haastia
          </Link>
          <Link to="/" className="nav-link">
            Home
          </Link>
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
                    className="dropdown-item"
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
                      className="dropdown-item"
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
              <Link to="/login" className="nav-link nav-action">
                Login
              </Link>
              <Link to="/signup" className="nav-link nav-action nav-action--primary">
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
