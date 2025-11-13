import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import './Auth.css';
import { useView } from '../../../context/ViewContext';
import { handleAuthSuccess } from '../../../utils/auth';
import ProfessionalPaymentSection from './ProfessionalPaymentSection';

const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

const ProfessionalActivationNotice = ({ message, onRetry, isRetrying, error }) => (
  <div className="auth-card activation-notice">
    <h3>Finish activating your professional account</h3>
    <p>{message || 'Complete checkout below to unlock your professional profile.'}</p>
    {error && <p className="helper-text error">{error}</p>}
    <button
      type="button"
      className="auth-submit"
      onClick={onRetry}
      disabled={isRetrying}
    >
      {isRetrying ? 'Refreshing checkout...' : 'Reload checkout'}
    </button>
  </div>
);

const EmbeddedCheckoutCard = ({ clientSecret }) => {
  if (!clientSecret || !stripePromise) {
    return null;
  }

  return (
    <section className="auth-card embedded-checkout-card">
      <h3>Secure checkout</h3>
      <p className="helper-text">
        Enter your payment details below to activate your professional plan.
      </p>
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </section>
  );
};

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    location: '',
    isProvider: true,
  });
  const [pendingSignup, setPendingSignup] = useState(null);
  const [isLaunchingCheckout, setIsLaunchingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [embeddedClientSecret, setEmbeddedClientSecret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setCurrentView } = useView();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Shared with the Stripe success callback so both paths finalize the account consistently.
  const finalizeSignup = (token) => {
    handleAuthSuccess({ token, navigate, setCurrentView, redirectPath: '/onboarding' });
  };

  const launchCheckout = async (pendingSignupId) => {
    try {
      setIsLaunchingCheckout(true);
      setCheckoutError('');
      setEmbeddedClientSecret('');
      if (!stripePromise) {
        throw new Error('Stripe is not configured for embedded checkout.');
      }
      const successUrl = `${window.location.origin}/signup/success`;
      const cancelUrl = `${window.location.origin}/signup/cancel`;

      const response = await axios.post('http://localhost:8000/api/payment/create-checkout-session', {
        pendingSignupId,
        successUrl,
        cancelUrl,
      });

      const { embeddedClientSecret: clientSecret } = response.data || {};
      if (!clientSecret) throw new Error('No embedded checkout client secret received');

      setEmbeddedClientSecret(clientSecret);
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
      const basePayload = {
        ...formData,
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
                  <p className="helper-text">
                    You&apos;ll set your weekly availability during onboarding after signup.
                  </p>
                  <ProfessionalPaymentSection />
                </>
              )}
            </div>

            <button className="auth-submit" type="submit">
              {isSubmitting ? 'Submitting...' : 'Create account'}
            </button>
          </form>
        </section>

        {pendingSignup && (
          <>
            <ProfessionalActivationNotice
              message={pendingSignup.message}
              onRetry={() => launchCheckout(pendingSignup.id)}
              isRetrying={isLaunchingCheckout}
              error={checkoutError}
            />
            <EmbeddedCheckoutCard clientSecret={embeddedClientSecret} />
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;
