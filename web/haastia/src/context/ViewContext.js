import React, { createContext, useContext, useState, useEffect } from 'react';
import { getValidToken } from '../utils/auth';

// Create a Context for the view
const ViewContext = createContext();

// Create a provider component
export const ViewProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const savedView = window.localStorage.getItem('currentView');
    if (savedView) {
      return savedView;
    }

    const auth = getValidToken();
    const role = auth?.payload?.role;

    if (role === 'professional') {
      return 'professional';
    }

    if (role === 'admin') {
      return 'admin';
    }

    if (role === 'customer') {
      return 'customer';
    }

    return null;
  });

  // ✅ Save view to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    if (currentView === null) {
      window.localStorage.removeItem('currentView');
      return;
    }

    window.localStorage.setItem('currentView', currentView);
  }, [currentView]);

  return (
    <ViewContext.Provider value={{ currentView, setCurrentView }}>
      {children}
    </ViewContext.Provider>
  );
};

// Create a custom hook to use the ViewContext
export const useView = () => useContext(ViewContext);
