import React, { useState } from 'react';
import { Award, ShieldCheck, Check, Sparkles, FileText, Info } from 'lucide-react';

export const TemplatePreview: React.FC = () => {
  const [sampleRecipient, setSampleRecipient] = useState('Alexander Vance, Ph.D.');
  const [sampleCourse, setSampleCourse] = useState('Distributed Cloud Systems & Microservices Engineering');
  const [sampleOrg, setSampleOrg] = useState('GLOBAL CERTIFICATIONS INSTITUTE');
  const [sampleSignatory, setSampleSignatory] = useState('Dr. Elizabeth Reed, Chancellor');
  const [sampleDate, setSampleDate] = useState('October 15, 2026');

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Official Certificate Template</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Standard landscape A4 ReportLab vector layout engineered for high visual prestige and mathematical precision.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Predefined Landscape A4 Layout</span>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Info className="w-4 h-4 text-indigo-600" />
          Live Template Preview Customizer
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-500 block mb-1">Sample Recipient Name</label>
            <input
              type="text"
              value={sampleRecipient}
              onChange={(e) => setSampleRecipient(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1">Course Title</label>
            <input
              type="text"
              value={sampleCourse}
              onChange={(e) => setSampleCourse(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1">Signatory</label>
            <input
              type="text"
              value={sampleSignatory}
              onChange={(e) => setSampleSignatory(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Visual Canvas Representation of the Landscape A4 Certificate */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 sm:p-10 shadow-2xl flex items-center justify-center">
        {/* Aspect Ratio 1.414 (A4 Landscape: 842 x 595 pt) */}
        <div className="w-full max-w-4xl aspect-[1.414/1] bg-[#FCFDFD] text-slate-900 rounded-lg shadow-xl relative p-8 sm:p-14 flex flex-col justify-between select-none border-4 border-indigo-600">
          {/* Inner decorative border */}
          <div className="absolute inset-2 sm:inset-3 border border-indigo-200 pointer-events-none" />

          {/* Corner brackets */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-indigo-900 pointer-events-none" />
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-indigo-900 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-indigo-900 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-indigo-900 pointer-events-none" />

          {/* Header Organization */}
          <div className="text-center space-y-1">
            <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-indigo-600 uppercase">
              {sampleOrg}
            </p>
            <h2 className="text-xl sm:text-3xl font-black text-indigo-950 tracking-tight">
              CERTIFICATE OF ACHIEVEMENT
            </h2>
            <div className="w-24 sm:w-36 h-0.5 bg-indigo-500 mx-auto mt-1" />
          </div>

          {/* Body Section */}
          <div className="text-center my-auto space-y-3 sm:space-y-4">
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest">
              THIS CERTIFICATE IS PROUDLY PRESENTED TO
            </p>
            <div className="text-xl sm:text-4xl font-black text-slate-900 tracking-tight font-serif pb-1 border-b border-slate-300 max-w-md mx-auto">
              {sampleRecipient}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600">
              For successfully completing and demonstrating mastery in
            </p>
            <p className="text-sm sm:text-xl font-bold text-indigo-700 max-w-lg mx-auto">
              {sampleCourse}
            </p>
          </div>

          {/* Footer Section */}
          <div className="grid grid-cols-3 items-end pt-4 sm:pt-6 border-t border-slate-100">
            {/* Left: Date */}
            <div className="text-center">
              <div className="w-24 sm:w-32 border-b border-slate-400 mx-auto pb-1 text-[10px] sm:text-xs font-bold text-slate-800">
                {sampleDate}
              </div>
              <span className="text-[9px] sm:text-[11px] text-slate-500 mt-1 block">
                Date of Issue
              </span>
            </div>

            {/* Center: Official Seal */}
            <div className="flex justify-center">
              <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full border-2 border-indigo-600 bg-indigo-50/80 flex flex-col items-center justify-center text-center shadow-inner">
                <span className="text-[8px] sm:text-[9px] font-bold text-indigo-900 leading-tight">
                  OFFICIAL
                </span>
                <span className="text-[7px] sm:text-[8px] font-bold text-indigo-700 leading-tight">
                  SEAL
                </span>
              </div>
            </div>

            {/* Right: Signature */}
            <div className="text-center">
              <div className="w-24 sm:w-36 border-b border-slate-400 mx-auto pb-1 text-[10px] sm:text-xs font-bold text-slate-800 truncate">
                {sampleSignatory}
              </div>
              <span className="text-[9px] sm:text-[11px] text-slate-500 mt-1 block">
                Authorized Signatory
              </span>
            </div>
          </div>

          {/* Security Hash & Verification Footer */}
          <div className="text-center text-[8px] sm:text-[9px] text-slate-400 pt-2 font-mono">
            Certificate ID: CERT-2026-X8B9Q2 • Verify authenticity online at certiflow.internal/verify/CERT-2026-X8B9Q2
          </div>
        </div>
      </div>
    </div>
  );
};
