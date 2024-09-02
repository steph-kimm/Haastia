import React, { useState, useEffect } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import './Navbar.css';
import { jwtDecode } from 'jwt-decode';

function Navbar() {
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    const userName = token ? jwtDecode(token).name : null; // Use 'jwtDecode' to get user name from token

    const handleLogout = () => {
        localStorage.removeItem('token');
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
                            <Link to="/profile">Account</Link>
                            {/* Conditional rendering for provider and admin options */}
                            {jwtDecode(token).role === 'Provider' && <Link to="/professional-view">Switch to Professional View</Link>}
                            {jwtDecode(token).role === 'Admin' && <Link to="/admin-view">Switch to Admin View</Link>}
                            <button onClick={handleLogout}>Logout</button>
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


// import React from 'react';
// import { Link } from 'react-router-dom';
// import './Navbar.css';

// function Navbar() {
//   return (
//     <nav className="navbar">
//       <div className="navbar-brand">
//         <Link to="/">Haastia</Link>
//         <Link to="/">Home</Link>
//       </div>
//       <div className="navbar-links">
//         <Link to="/login">Login</Link>
//         <Link to="/signup">Signup</Link>
//       </div>
//     </nav>
//   );
// }

// export default Navbar;