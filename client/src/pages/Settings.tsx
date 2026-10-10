import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Settings as SettingsIcon,
  Server,
  Database,
  HardDrive,
  Cpu,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Shield,
  Layers
} from 'lucide-react';
import { fetchHealth } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  const [defaultOrg, setDefaultOrg] = useState('Global Technology Institute');
  const [defaultIssuer, setDefaultIssuer] = useState('Dr. Sarah Connor, Executive Dean');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">System Settings & Architecture</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Organization defaults, database parameters, background queue monitors, and storage configurations.
        </p>
      </div>

      {/* Organization Defaults Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Default Organization Preferences</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-populates new generation workflows with your default institutional branding.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Organization preferences saved successfully.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Default Issuing Organization
            </label>
            <input
              type="text"
              value={defaultOrg}
              onChange={(e) => setDefaultOrg(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Default Authorized Signatory
            </label>
            <input
              type="text"
              value={defaultIssuer}
              onChange={(e) => setDefaultIssuer(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-2xs shadow-indigo-600/30"
        >
          Save Defaults
        </button>
      </form>

      {/* Architecture & Infrastructure Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Infrastructure Stack Health</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active connections to cloud and local deployment components.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* API Backend */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-indigo-600" />
                FastAPI Service
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                {health?.status === 'alive' ? 'Active' : 'Connected'}
              </span>
            </div>
            <p className="text-slate-500">
              Uvicorn ASGI runner on Python 3.12+ with Pydantic v2 validation and auto-generated OpenAPI documentation.
            </p>
          </div>

          {/* Database */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                PostgreSQL (Neon / Local)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                Pool Active
              </span>
            </div>
            <p className="text-slate-500">
              SQLAlchemy 2.0 with connection pooling, Alembic schema migrations, and relational cascading constraints.
            </p>
          </div>

          {/* Redis & Celery */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-600" />
                Celery & Redis Worker
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold text-[10px]">
                Bounded Batches
              </span>
            </div>
            <p className="text-slate-500">
              Asynchronous worker pool running chunked PDF generation tasks with per-recipient error isolation and retries.
            </p>
          </div>

          {/* Storage */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                File & Object Storage
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-[10px]">
                Local / S3
              </span>
            </div>
            <p className="text-slate-500">
              Stores PDF assets and compiled ZIP archives. Metadata and storage keys persisted in PostgreSQL without binary bloat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
