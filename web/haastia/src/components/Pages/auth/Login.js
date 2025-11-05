import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/auth/signin', { email, password });
      console.log(response.data);
      const { token } = response.data;

      // Store token in localStorage or sessionStorage
      localStorage.setItem('token', token);

      // Decode token to get expiration time
      const decodedToken = jwtDecode(token);
      const expirationTime = decodedToken.exp * 1000 - Date.now();

      // Set a timeout to log out when the token expires
      setTimeout(() => {
        localStorage.removeItem('token');
        navigate('/login'); // Redirect to login page after token expires
      }, expirationTime);

      // Redirect to the homepage
      navigate('/');

    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-inner">
        <header className="auth-header">
          <span className="eyebrow">Welcome back</span>
          <h1>Log in to Haastia</h1>
          <p className="sub">Access your account to manage bookings, update services, and stay connected with clients.</p>
        </header>

        <section className="auth-form">
          <form className="auth-card" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="login-email">Email address</label>
                <div className="input-shell">
                  <input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <div className="input-shell">
                  <input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <button className="auth-submit" type="submit">
              Log In
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Login;
