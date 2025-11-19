import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';
import { Link, useNavigate } from 'react-router-dom';
import { useView } from '../../../context/ViewContext';
import { handleAuthSuccess } from '../../../utils/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const getLoginErrorMessage = (rawMessage) => {
    const normalized = rawMessage?.toString()?.toLowerCase() || '';

    if (!rawMessage) {
      return 'Unable to log in with those credentials. Please try again.';
    }

    if (normalized.includes('wrong password') || normalized.includes('incorrect password')) {
      return 'Incorrect password. Please double-check and try again.';
    }

    if (normalized.includes('no user') || normalized.includes('user not found')) {
      return 'No account was found for that email address.';
    }

    return rawMessage;
  };

  const navigate = useNavigate();
  const { setCurrentView } = useView();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setErrorMessage('');
      const response = await axios.post('/api/auth/signin', { email, password });
      const { token, error } = response.data || {};

      if (error) {
        setErrorMessage(getLoginErrorMessage(error));
        return;
      }

      if (!token) {
        throw new Error('No token returned from login');
      }

      handleAuthSuccess({ token, navigate, setCurrentView });
    } catch (error) {
      console.error('Error logging in:', error);
      const friendlyMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message;
      setErrorMessage(getLoginErrorMessage(friendlyMessage));
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
              <div className="field-actions">
                <Link to="/password/forgot" className="auth-link subtle">
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>

          {errorMessage && <p className="helper-text error">{errorMessage}</p>}

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
