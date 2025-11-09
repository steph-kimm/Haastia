import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Auth.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useView } from '../../../context/ViewContext';
import { handleAuthSuccess } from '../../../utils/auth';

const SignupSuccess = () => {
  const navigate = useNavigate();
  const { setCurrentView } = useView();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setError('Signup session not found. Please restart the process.');
      setStatus('error');
      return;
    }

    let isMounted = true;

    // Stripe redirects the user here with a session_id once payment/onboarding succeeds.
    // We exchange it for an application token so the rest of the auth flow can run.
    const finalizeSignup = async () => {
      try {
        const response = await axios.post('http://localhost:8000/api/auth/signup', {
          sessionId,
        });

        const { token } = response.data || {};
        if (!token) {
          throw new Error('Signup completion did not return a token.');
        }

        if (!isMounted) return;

        handleAuthSuccess({ token, navigate, setCurrentView });
        setStatus('success');
      } catch (err) {
        if (!isMounted) return;

        const friendlyMessage =
          err.response?.data?.error || err.response?.data?.message || err.message;
        setError(friendlyMessage || 'Unable to finalize your signup.');
        setStatus('error');
      }
    };

    finalizeSignup();

    return () => {
      isMounted = false;
    };
  }, [sessionId, navigate, setCurrentView]);

  if (status === 'loading') {
    return (
      <div className="auth-page">
        <div className="auth-inner">
          <section className="auth-card">
            <h1>Setting up your account…</h1>
            <p>We&apos;re finalizing your Haastia account. This only takes a moment.</p>
          </section>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="auth-page">
        <div className="auth-inner">
          <section className="auth-card">
            <h1>We couldn&apos;t finish signup</h1>
            <p>{error}</p>
            <button className="auth-submit" type="button" onClick={() => navigate('/signup')}>
              Try again
            </button>
          </section>
        </div>
      </div>
    );
  }

  // When handleAuthSuccess navigates away we rarely render this, but it helps avoid a flash.
  return (
    <div className="auth-page">
      <div className="auth-inner">
        <section className="auth-card">
          <h1>Redirecting…</h1>
          <p>You&apos;re all set! We&apos;re taking you to your new workspace.</p>
        </section>
      </div>
    </div>
  );
};

export default SignupSuccess;
