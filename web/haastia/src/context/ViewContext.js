import React, { createContext, useContext, useState } from 'react';

// Create a Context for the view
const ViewContext = createContext();

// Create a provider component
export const ViewProvider = ({ children }) => {
    const [currentView, setCurrentView] = useState('customer'); // default view

    return (
        <ViewContext.Provider value={{ currentView, setCurrentView }}>
            {children}
        </ViewContext.Provider>
    );
};

// Create a custom hook to use the ViewContext
export const useView = () => {
    return useContext(ViewContext);
};
