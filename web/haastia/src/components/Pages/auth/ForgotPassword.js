import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    try {
      setIsSubmitting(true);
      await axios.post('/api/auth/forgot-password', { email });
      setStatusMessage(
        'If that email matches an account, we have sent a verification code. Check your inbox (and spam) for the next step.'
      );
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
          <span className="eyebrow">Forgot your password?</span>
          <h1>We&apos;ll send you a reset code</h1>
          <p className="sub">
            Enter the email you use for Haastia and we&apos;ll email you a code to securely reset your password.
          </p>
        </header>

        <section className="auth-form">
          <form className="auth-card" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="forgot-password-email">Email address</label>
                <div className="input-shell">
                  <input
                    id="forgot-password-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <p className="helper-text">We&apos;ll send a reset code to this email.</p>
              </div>
            </div>

            {statusMessage && <p className="helper-text">{statusMessage}</p>}
            {errorMessage && <p className="helper-text error">{errorMessage}</p>}

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending code...' : 'Send reset code'}
            </button>

            <p className="helper-text subtle" style={{ marginTop: '12px' }}>
              After you receive the code, return to the reset screen and enter it to create a new password.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ForgotPassword;
