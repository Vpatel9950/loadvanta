import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import { HomePage } from './pages/HomePage';
import { FindTrucksPage } from './pages/FindTrucksPage';
import { FindLoadsPage } from './pages/FindLoadsPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Dashboards
import { ShipperDashboard } from './pages/dashboard/ShipperDashboard';
import { TransporterDashboard } from './pages/dashboard/TransporterDashboard';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';

import { UserRole } from '@loadvanta/contracts';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bgLight dark:bg-slate-950 text-brand-textDark dark:text-slate-100 transition-colors">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/find-trucks" element={<FindTrucksPage />} />
          <Route path="/find-loads" element={<FindLoadsPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Dashboards */}
          <Route
            path="/dashboard/shipper"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SHIPPER, UserRole.ADMIN]}>
                <ShipperDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/transporter"
            element={
              <ProtectedRoute allowedRoles={[UserRole.TRANSPORTER, UserRole.ADMIN]}>
                <TransporterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
