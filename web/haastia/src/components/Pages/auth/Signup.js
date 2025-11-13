import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import { useView } from '../../../context/ViewContext';
import { handleAuthSuccess } from '../../../utils/auth';
import ProfessionalPaymentSection from './ProfessionalPaymentSection';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ProfessionalActivationNotice = ({ message, onRetry, isRetrying, error }) => (
  <div className="auth-card activation-notice">
    <h3>Finish activating your professional account</h3>
    <p>{message || 'Complete checkout to unlock your professional profile.'}</p>
    {error && <p className="helper-text error">{error}</p>}
    <button
      type="button"
      className="auth-submit"
      onClick={onRetry}
      disabled={isRetrying}
    >
      {isRetrying ? 'Launching checkout…' : 'Complete payment'}
    </button>
  </div>
);

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    location: '',
    isProvider: true,
    availability: daysOfWeek.map(day => ({ day, slots: '' }))
  });
  const [pendingSignup, setPendingSignup] = useState(null);
  const [isLaunchingCheckout, setIsLaunchingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setCurrentView } = useView();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('availability')) {
      const index = parseInt(name.split('-')[1]);
      const newAvailability = [...formData.availability];
      newAvailability[index].slots = value;
      setFormData({ ...formData, availability: newAvailability });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  // Shared with the Stripe success callback so both paths finalize the account consistently.
  const finalizeSignup = (token) => {
    handleAuthSuccess({ token, navigate, setCurrentView });
  };

  const launchCheckout = async (pendingSignupId) => {
    try {
      setIsLaunchingCheckout(true);
      setCheckoutError('');
      const successUrl = `${window.location.origin}/signup/success`;
      const cancelUrl = `${window.location.origin}/signup/cancel`;

      const response = await axios.post('http://localhost:8000/api/payment/create-checkout-session', {
        pendingSignupId,
        successUrl,
        cancelUrl,
      });

      const { url } = response.data || {};
      if (!url) throw new Error('No checkout URL received');

      window.location.href = url;
    } catch (error) {
      console.error('Error launching checkout:', error);
      const friendlyMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message;
      setCheckoutError(friendlyMessage || 'Unable to start checkout. Please try again.');
    } finally {
      setIsLaunchingCheckout(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setCheckoutError('');
      // ✅ Format availability properly
      const formattedAvailability = formData.availability
        .filter(a => a.slots.trim() !== '')
        .map(a => ({
          day: a.day,
          slots: a.slots
            .split(',')
            .map(slot => {
              const [start, end] = slot.trim().split('-');
              if (!start || !end) return null;
              return { start: start.trim(), end: end.trim() };
            })
            .filter(Boolean)
        }));

      const basePayload = {
        ...formData,
        availability: formattedAvailability
      };

      const response = await axios.post('http://localhost:8000/api/auth/signup', basePayload);
      const { token, pendingSignupId, message } = response.data || {};

      if (formData.isProvider) {
        if (!pendingSignupId) {
          throw new Error('Signup did not return a pending signup identifier');
        }

        const pendingState = {
          id: pendingSignupId,
          message:
            message ||
            'Your professional account is pending activation. Complete checkout to go live.',
        };

        setPendingSignup(pendingState);
        localStorage.setItem('haastiaPendingSignupId', pendingSignupId);

        await launchCheckout(pendingSignupId);
        return;
      }

      if (!token) throw new Error('No token returned from signup');

      setPendingSignup(null);
      localStorage.removeItem('haastiaPendingSignupId');

      finalizeSignup(token);

    } catch (error) {
      console.error('Error signing up:', error);
      const friendlyMessage = error.response?.data?.error || error.response?.data?.message;
      alert(friendlyMessage || 'Signup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-inner">
        <header className="auth-header">
          <span className="eyebrow">Create your account</span>
          <h1>Join Haastia</h1>
          <p className="sub">
            Start booking services you love or share your expertise with new clients. We just need a few details to get you set up.
          </p>
        </header>

        <section className="auth-form">
          <form className="auth-card" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="signup-name">Full name</label>
                <div className="input-shell">
                  <input
                    id="signup-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="signup-email">Email address</label>
                <div className="input-shell">
                  <input
                    id="signup-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <div className="input-shell">
                  <input
                    id="signup-password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a secure password"
                    required
                  />
                </div>
                <p className="helper-text">Use at least 8 characters with a mix of letters and numbers.</p>
              </div>

              <div className="form-group">
                <label htmlFor="signup-location">Location</label>
                <div className="input-shell">
                  <input
                    id="signup-location"
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City, State"
                    required
                  />
                </div>
              </div>

              {formData.isProvider && (
                <>
                  <div className="availability-card">
                    <div>
                      <h3>Weekly availability</h3>
                      <p>Let clients know when they can book you. Use 24h time ranges separated by commas.</p>
                    </div>
                    <div className="availability-grid">
                      {daysOfWeek.map((day, index) => (
                        <div className="availability-item" key={day}>
                          <label htmlFor={`availability-${index}`}>{day}</label>
                          <div className="input-shell">
                            <input
                              id={`availability-${index}`}
                              type="text"
                              name={`availability-${index}`}
                              value={formData.availability[index].slots}
                              onChange={handleChange}
                              placeholder="e.g., 09:00-11:00, 14:00-17:00"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <ProfessionalPaymentSection />
                </>
              )}
            </div>

            <button className="auth-submit" type="submit">
              {isSubmitting ? 'Submitting…' : 'Create account'}
            </button>
          </form>
        </section>

        {pendingSignup && (
          <ProfessionalActivationNotice
            message={pendingSignup.message}
            onRetry={() => launchCheckout(pendingSignup.id)}
            isRetrying={isLaunchingCheckout}
            error={checkoutError}
          />
        )}
      </div>
    </div>
  );
};

export default Signup;
