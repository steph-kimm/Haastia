import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useView } from '../context/ViewContext';
import { clearAuthStorage, getValidToken } from '../utils/auth';

function Navbar() {
  const navigate = useNavigate();
  const { currentView, setCurrentView } = useView();
  const auth = getValidToken();

  const userName = auth?.payload?.name ?? null;
  const userRole = auth?.payload?.role ?? null;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const handleResize = () => {
      if (window.innerWidth >= 900) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileOpen]);

  const handleLogout = () => {
    clearAuthStorage();
    navigate('/login');
  };

  const closeMenus = () => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  };

  const handleSwitchView = (view) => {
    setCurrentView(view);
    closeMenus();
    if (view === 'customer') {
      navigate('/');
    } else if (view === 'professional') {
      navigate('/professional-home');
    }
  };

  const handleLogoutClick = () => {
    handleLogout();
    closeMenus();
  };

  const handleNavLink = () => {
    closeMenus();
  };

  return (
    <nav className="navbar">
      <div className="navbar-shell">
        <div className="navbar-brand">
          <div className="brand-group">
            <Link to="/" className="brand-mark" onClick={handleNavLink}>
              Haastia
            </Link>
            <Link to="/" className="brand-home" onClick={handleNavLink}>
              Home
            </Link>
          </div>

          <button
            type="button"
            className="navbar-toggle"
            aria-expanded={mobileOpen}
            aria-controls="primary-navigation"
            onClick={() => {
              setMobileOpen((open) => !open);
              setUserMenuOpen(false);
            }}
          >
            <span className="sr-only">Toggle menu</span>
            <span className="navbar-toggle-bar" />
            <span className="navbar-toggle-bar" />
            <span className="navbar-toggle-bar" />
          </button>
        </div>

        <div
          id="primary-navigation"
          className={`navbar-links${mobileOpen ? ' is-open' : ''}`}
        >
          {userName ? (
            <div
              ref={userMenuRef}
              className={`user-menu${userMenuOpen ? ' is-open' : ''}`}
            >
              <button
                type="button"
                className="user-name"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((open) => !open)}
              >
                <span className="user-name-label">{userName || 'Account'}</span>
                <svg
                  className="user-caret"
                  width="12"
                  height="8"
                  viewBox="0 0 12 8"
                  aria-hidden="true"
                >
                  <path d="M1.41.59 6 5.17 10.59.59 12 2l-6 6-6-6z" fill="currentColor" />
                </svg>
              </button>
              <div className="dropdown-content" role="menu">
                <Link to="/profile" className="dropdown-item" onClick={handleNavLink}>
                  Account
                </Link>

                {currentView === 'professional' ? (
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => handleSwitchView('customer')}
                  >
                    Switch to Customer View
                  </button>
                ) : (
                  userRole === 'professional' && (
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => handleSwitchView('professional')}
                    >
                      Switch to Professional View
                    </button>
                  )
                )}

                <button type="button" onClick={handleLogoutClick} className="dropdown-item logout-action">
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="nav-actions">
              <Link to="/login" className="nav-link subtle" onClick={handleNavLink}>
                Login
              </Link>
              <Link to="/signup" className="nav-link primary" onClick={handleNavLink}>
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
