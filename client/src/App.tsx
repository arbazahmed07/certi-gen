import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { GenerateCertificates } from './pages/GenerateCertificates';
import { JobsList } from './pages/JobsList';
import { JobDetails } from './pages/JobDetails';
import { CertificateLibrary } from './pages/CertificateLibrary';
import { TemplatePreview } from './pages/TemplatePreview';
import { SettingsPage } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/generate" element={<GenerateCertificates />} />
          <Route path="/jobs" element={<JobsList />} />
          <Route path="/jobs/:jobId" element={<JobDetails />} />
          <Route path="/certificates" element={<CertificateLibrary />} />
          <Route path="/template" element={<TemplatePreview />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      {/* Modern SaaS Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">CertiFlow</span>
            <span>• Asynchronous Bulk Certificate Generation Architecture</span>
          </div>
          <div>
            Built with FastAPI, Celery, Redis, ReportLab & React
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
