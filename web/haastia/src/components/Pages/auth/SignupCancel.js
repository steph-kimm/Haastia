import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Auth.css';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SignupCancel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState(sessionId ? 'notifying' : 'idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let isMounted = true;

    // If the user aborts Stripe checkout we let the backend discard any pending record.
    const cancelPendingSignup = async () => {
      try {
        await axios.delete(`http://localhost:8000/api/auth/signup/pending/${sessionId}`);
      } catch (err) {
        if (!isMounted) return;
        // Surface a friendly error but do not block the user from retrying signup.
        const friendlyMessage =
          err.response?.data?.error || err.response?.data?.message || err.message;
        setError(friendlyMessage || 'We could not notify the team. You can still restart signup.');
      } finally {
        if (isMounted) {
          setStatus('idle');
        }
      }
    };

    cancelPendingSignup();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  return (
    <div className="auth-page">
      <div className="auth-inner">
        <section className="auth-card">
          <h1>Signup cancelled</h1>
          <p>
            No worries—your account hasn&apos;t been created yet. {status === 'notifying'
              ? 'Letting our system know to discard the session…'
              : 'You can jump back in whenever you&apos;re ready.'}
          </p>
          {error && <p className="error-text">{error}</p>}
          <button className="auth-submit" type="button" onClick={() => navigate('/signup')}>
            Start over
          </button>
        </section>
      </div>
    </div>
  );
};

export default SignupCancel;
