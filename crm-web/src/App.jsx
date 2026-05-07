import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Workers from './pages/Workers';
import WorkerProfile from './pages/WorkerProfile';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Quotes from './pages/Quotes';
import Enquiries from './pages/Enquiries';
import TrashPage from './pages/Trash';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
        <Route path="workers" element={<Workers />} />
        <Route path="workers/:id" element={<WorkerProfile />} />
        <Route path="customers" element={<ErrorBoundary><Customers /></ErrorBoundary>} />
        <Route path="customers/:id" element={<ErrorBoundary><CustomerDetails /></ErrorBoundary>} />
        <Route path="enquiries" element={<ErrorBoundary><Enquiries /></ErrorBoundary>} />
        <Route path="invoices" element={<ErrorBoundary><Quotes /></ErrorBoundary>} />
        <Route path="trash" element={<ErrorBoundary><TrashPage /></ErrorBoundary>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
