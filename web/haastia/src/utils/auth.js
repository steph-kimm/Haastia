import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'token';
const VIEW_KEY = 'currentView';

export const clearAuthStorage = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(VIEW_KEY);
  } catch (err) {
    // Access to localStorage can throw in non-browser environments.
    console.error('Failed to clear auth storage', err);
  }
};

export const getValidToken = () => {
  let token;
  try {
    token = localStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to read auth token', err);
    clearAuthStorage();
    return null;
  }

  if (!token) {
    clearAuthStorage();
    return null;
  }

  try {
    const payload = jwtDecode(token);
    if (!payload?.exp || payload.exp < Date.now() / 1000) {
      clearAuthStorage();
      return null;
    }

    return { token, payload };
  } catch (err) {
    clearAuthStorage();
    return null;
  }
};

/**
 * Persist an auth token, configure logout-on-expiry, and move the app to the
 * correct view/route. This is shared by the email+password login flow and the
 * Stripe checkout completion flow so both experiences stay consistent.
 */
export const handleAuthSuccess = ({ token, navigate, setCurrentView }) => {
  if (!token) {
    throw new Error('No token provided');
  }

  localStorage.setItem(TOKEN_KEY, token);

  const decodedToken = jwtDecode(token);
  if (!decodedToken?.exp) {
    clearAuthStorage();
    throw new Error('Token is missing an expiration');
  }

  const expirationTime = decodedToken.exp * 1000 - Date.now();

  if (expirationTime <= 0) {
    clearAuthStorage();
    throw new Error('Token already expired');
  }

  setTimeout(() => {
    clearAuthStorage();
    if (navigate) {
      navigate('/login');
    }
  }, expirationTime);

  const role = decodedToken.role;
  if (role === 'professional') {
    if (setCurrentView) {
      setCurrentView('professional');
    }
    if (navigate) {
      navigate('/add-service');
    }
  } else {
    if (setCurrentView) {
      setCurrentView('customer');
    }
    if (navigate) {
      navigate('/');
    }
  }

  return decodedToken;
};
