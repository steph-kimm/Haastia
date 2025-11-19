import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Auth.css';

const PasswordRecoveryRequest = () => {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    try {
      setIsSubmitting(true);
      await axios.post('/api/auth/recovery-request', { email });
      setStatusMessage('Check your inbox for a link to reset your password.');
      setHasRequested(true);
    } catch (error) {
      const friendlyMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'We could not start the reset process. Please try again.';

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
          <h1>Get back into your account</h1>
          <p className="sub">
            Enter the email you use for Haastia and we&apos;ll send you a secure link to create a new password.
          </p>
        </header>

        <section className="auth-form">
          <form className="auth-card" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="recovery-email">Email address</label>
                <div className="input-shell">
                  <input
                    id="recovery-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <p className="helper-text">We&apos;ll email you reset instructions.</p>
              </div>
            </div>

            {statusMessage && <p className="helper-text">{statusMessage}</p>}
            {errorMessage && <p className="helper-text error">{errorMessage}</p>}

            {hasRequested && (
              <p className="helper-text" style={{ marginTop: '-8px' }}>
                Ready to finish?{' '}
                <Link to="/password/reset" state={{ email }} className="auth-link subtle">
                  Enter your reset code
                </Link>{' '}
                to choose a new password.
              </p>
            )}

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending link...' : 'Send reset link'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default PasswordRecoveryRequest;
