import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { ViewProvider } from './context/ViewContext';
import PreviewGate from './components/PreviewGate';

function App() {
  return (
    <ViewProvider>
      <PreviewGate>
        <Router basename="/Haastia">
          <AppRoutes />
        </Router>
      </PreviewGate>
    </ViewProvider>
  );
}

export default App;
