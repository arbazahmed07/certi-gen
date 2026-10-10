import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  Search,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  Building,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { fetchCertificates, verifyCertificate, CertificateItem } from '../services/api';

export const CertificateLibrary: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [previewCertId, setPreviewCertId] = useState<string | null>(null);
  const [verifyCertId, setVerifyCertId] = useState<string | null>(null);

  const { data: certsData, isLoading } = useQuery({
    queryKey: ['certificateLibrary', page, search],
    queryFn: () => fetchCertificates(page, 18, search),
  });

  const { data: verificationResult, isLoading: isVerifying } = useQuery({
    queryKey: ['verifyCert', verifyCertId],
    queryFn: () => verifyCertificate(verifyCertId!),
    enabled: !!verifyCertId,
  });

  const certificates = certsData?.items || [];

  return (
    <div className="space-y-6 pb-16">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Certificate Library</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Search and download all successfully issued credentials across all batches.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by recipient, ID, course..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>
      </div>

      {/* Grid of Certificate Cards */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 text-sm">Loading certificates...</div>
      ) : certificates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Award className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No certificates found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Certificates will appear here once bulk generation batches complete successfully.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Top Row with ID & Verification Badge */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                    {cert.certificate_id}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVerifyCertId(cert.certificate_id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verify
                  </button>
                </div>

                {/* Recipient Name */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {cert.recipient_name}
                  </h3>
                  {cert.recipient_email && (
                    <p className="text-xs text-slate-400">{cert.recipient_email}</p>
                  )}
                </div>

                {/* Course & Organization Info */}
                <div className="text-xs space-y-1.5 pt-1 text-slate-600 border-t border-slate-100">
                  <div className="font-semibold text-slate-800 line-clamp-1">{cert.course_name}</div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cert.organization}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Issued {cert.issue_date}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPreviewCertId(cert.certificate_id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
                <a
                  href={`/api/v1/certificates/${cert.certificate_id}/download`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs shadow-indigo-600/30 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {certsData && certsData.total_pages > 1 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {certsData.page} of {certsData.total_pages} ({certsData.total} certificates)
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, certsData.total_pages))}
              disabled={page >= certsData.total_pages}
              className="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {verifyCertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Certificate Verification</h3>
              </div>
              <button
                type="button"
                onClick={() => setVerifyCertId(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {isVerifying ? (
              <div className="py-6 text-center text-xs text-slate-500">
                Checking cryptographic ledger...
              </div>
            ) : verificationResult?.valid ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-sm text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    Valid & Authenticated
                  </div>
                  <p>This certificate was durably generated by CertiFlow and recorded in Neon PostgreSQL.</p>
                </div>

                <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 uppercase font-semibold">Recipient</span>
                    <div className="font-bold text-slate-900 text-sm">
                      {verificationResult.recipient_name}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold">Course / Program</span>
                    <div className="font-semibold text-slate-800">
                      {verificationResult.course_name}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold">Issuing Organization</span>
                    <div className="text-slate-700">{verificationResult.organization}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold">Certificate ID</span>
                    <div className="font-mono text-indigo-700 font-bold">
                      {verificationResult.certificate_id}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                Certificate ID is not registered or could not be verified.
              </div>
            )}

            <button
              type="button"
              onClick={() => setVerifyCertId(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewCertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Official Certificate Preview: {previewCertId}
                </h3>
                <span className="text-xs text-slate-500">A4 Landscape ReportLab Output</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/v1/certificates/${previewCertId}/download`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewCertId(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-2">
              <iframe
                src={`/api/v1/certificates/${previewCertId}/preview`}
                className="w-full h-full rounded border border-slate-300 bg-white"
                title="Certificate PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
