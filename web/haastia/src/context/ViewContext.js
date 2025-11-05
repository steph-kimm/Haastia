import React, { createContext, useContext, useState, useEffect } from 'react';

// Create a Context for the view
const ViewContext = createContext();

// Create a provider component
export const ViewProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('customer'); // default view

  // ✅ Load saved view from localStorage when app starts
  useEffect(() => {
    const savedView = localStorage.getItem('currentView');
    if (savedView) {
      setCurrentView(savedView);
    }
  }, []);

  // ✅ Save view to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentView', currentView);
  }, [currentView]);

  return (
    <ViewContext.Provider value={{ currentView, setCurrentView }}>
      {children}
    </ViewContext.Provider>
  );
};

// Create a custom hook to use the ViewContext
export const useView = () => useContext(ViewContext);
