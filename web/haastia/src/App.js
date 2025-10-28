import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { ViewProvider } from './context/ViewContext';

function App() {
  return (
    <ViewProvider>
      <Router>
        <AppRoutes />
      </Router>
    </ViewProvider>
  );
}

export default App;
