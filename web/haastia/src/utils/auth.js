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
