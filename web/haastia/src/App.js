import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './views/AppRoutes';
import { ViewProvider } from './views/ViewContext';

function App() {
    const [currentView, setCurrentView] = useState('customer'); // default view

    // Use the context or any other logic to determine the current view
    return (
      <ViewProvider>
        <Router>
            {/* <AppRoutes currentView={currentView} /> */}
            <AppRoutes/>
        </Router>
      </ViewProvider>
    );
}

export default App;