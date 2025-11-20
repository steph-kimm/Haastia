import React, { useMemo, useState } from 'react';
import './PreviewGate.css';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const PREVIEW_SESSION_KEY = 'haastia-preview-authorized';

const isLocalHost = () => LOCAL_HOSTS.has(window.location.hostname);

const getInitialAuthorization = () => {
  if (isLocalHost()) {
    return true;
  }

  return sessionStorage.getItem(PREVIEW_SESSION_KEY) === 'true';
};

const PreviewGate = ({ children }) => {
  const [authorized, setAuthorized] = useState(getInitialAuthorization);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  const previewPassword = useMemo(
    () => (process.env.REACT_APP_PREVIEW_PASSWORD || '').trim(),
    []
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!previewPassword) {
      setError('Preview password is not configured.');
      return;
    }

    if (passwordInput === previewPassword) {
      sessionStorage.setItem(PREVIEW_SESSION_KEY, 'true');
      setAuthorized(true);
      setError('');
      return;
    }

    setError('Incorrect password. Please try again.');
  };

  if (authorized) {
    return children;
  }

  return (
    <div className="preview-overlay">
      <div className="preview-card">
        <h1 className="preview-title">Private Preview</h1>
        <p className="preview-subtitle">
          This site is password protected while testing is in progress.
        </p>
        <form className="preview-form" onSubmit={handleSubmit}>
          <label className="preview-label" htmlFor="preview-password">
            Password
          </label>
          <input
            id="preview-password"
            className="preview-input"
            type="password"
            value={passwordInput}
            onChange={(event) => setPasswordInput(event.target.value)}
            autoComplete="current-password"
            autoFocus
          />
          {error && <p className="preview-error">{error}</p>}
          {!previewPassword && (
            <p className="preview-warning">
              Set the <code>REACT_APP_PREVIEW_PASSWORD</code> environment variable before
              building to enable access.
            </p>
          )}
          <button className="preview-button" type="submit">
            Enter
          </button>
        </form>
      </div>
    </div>
  );
};

export default PreviewGate;
