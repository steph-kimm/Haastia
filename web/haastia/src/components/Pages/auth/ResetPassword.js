import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Auth.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const prefilledEmail = useMemo(() => location.state?.email || '', [location.state]);

  const [email, setEmail] = useState(prefilledEmail);
  const [resetCode, setResetCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post('/api/auth/update-password', {
        email,
        password,
        resetCode,
      });

      setStatusMessage('Password updated successfully. Redirecting to login...');
      navigate('/login', {
        replace: true,
        state: {
          successNotice: 'Your password has been updated. Please log in.',
        },
      });
    } catch (error) {
      const friendlyMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'We could not update your password. Please try again.';

      setErrorMessage(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-inner">
        <header className="auth-header">
          <span className="eyebrow">Reset your password</span>
          <h1>Secure your account</h1>
          <p className="sub">
            Enter the code we sent to your email along with your new password. You&apos;ll be ready to log back in
            immediately.
          </p>
        </header>

        <section className="auth-form">
          <form className="auth-card" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="reset-email">Email address</label>
                <div className="input-shell">
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <p className="helper-text">Use the email that received your reset code.</p>
              </div>

              <div className="form-group">
                <label htmlFor="reset-code">Reset code</label>
                <div className="input-shell">
                  <input
                    id="reset-code"
                    type="text"
                    placeholder="Enter the code from your email"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="new-password">New password</label>
                <div className="input-shell">
                  <input
                    id="new-password"
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <p className="helper-text">Passwords must be at least 6 characters.</p>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm new password</label>
                <div className="input-shell">
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
              </div>
            </div>

            {statusMessage && <p className="helper-text success">{statusMessage}</p>}
            {errorMessage && <p className="helper-text error">{errorMessage}</p>}

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating password...' : 'Reset password'}
            </button>

            <p className="helper-text subtle" style={{ marginTop: '4px' }}>
              Haven&apos;t received a code?{' '}
              <Link to="/password/forgot" className="auth-link subtle">
                Request a new one
              </Link>
              .
            </p>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ResetPassword;
