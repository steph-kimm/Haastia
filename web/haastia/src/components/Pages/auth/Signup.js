import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import { useView } from '../../../context/ViewContext';
import { handleAuthSuccess } from '../../../utils/auth';
import ProfessionalPaymentSection from './ProfessionalPaymentSection';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    location: '',
    isProvider: false,
    availability: daysOfWeek.map(day => ({ day, slots: '' }))
  });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ Format availability properly
      const formattedAvailability = formData.availability
        .filter(a => a.slots.trim() !== '')
        .map(a => ({
          day: a.day,
          slots: a.slots.split(',').map(slot => {
            const [start, end] = slot.trim().split('-');
            return { start, end };
          })
        }));

      const basePayload = {
        ...formData,
        availability: formattedAvailability
      };

      if (formData.isProvider) {
        const successUrl = `${window.location.origin}/signup/success`;
        const cancelUrl = `${window.location.origin}/signup/cancel`;

        const response = await axios.post('http://localhost:8000/api/stripe/create-checkout-session', {
          ...basePayload,
          successUrl,
          cancelUrl
        });
        const { url } = response.data || {};

        if (!url) throw new Error('No checkout URL received');

        // Redirect the user to Stripe Checkout so they can complete the onboarding/payment step.
        window.location.href = url;
        return;
      }

      const response = await axios.post('http://localhost:8000/api/auth/signup', basePayload);
      const { token } = response.data || {};

      if (!token) throw new Error('No token returned from signup');

      finalizeSignup(token);

    } catch (error) {
      console.error('Error signing up:', error);
      const friendlyMessage = error.response?.data?.error || error.response?.data?.message;
      alert(friendlyMessage || 'Signup failed');
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

              <div className="checkbox-card">
                <input
                  type="checkbox"
                  id="signup-provider"
                  name="isProvider"
                  checked={formData.isProvider}
                  onChange={handleChange}
                />
                <span>
                  I want to offer services on Haastia.
                </span>
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
              Create account
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Signup;
