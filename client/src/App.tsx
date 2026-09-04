import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout>
        <AppRoutes />
      </AppLayout>
    </BrowserRouter>
  );
};

export default App;
