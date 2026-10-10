import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  RotateCcw,
  Ban,
  FileArchive,
  Search,
  ExternalLink,
  Eye,
  FileDown,
  ArrowLeft
} from 'lucide-react';
import {
  fetchJobDetail,
  fetchJobProgress,
  fetchJobRecipients,
  cancelJob,
  retryJob,
  requestArchive,
  Recipient
} from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const JobDetails: React.FC = () => {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const queryClient = useQueryClient();
  const [recipientStatusFilter, setRecipientStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [hasCelebrated, setHasCelebrated] = useState<boolean>(false);
  const [previewCertId, setPreviewCertId] = useState<string | null>(null);

  // Poll progress while not complete
  const { data: progress } = useQuery({
    queryKey: ['jobProgress', jobId],
    queryFn: () => fetchJobProgress(jobId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 1500;
      if (['completed', 'completed_with_errors', 'failed', 'cancelled'].includes(data.status)) {
        return false;
      }
      return 1500;
    },
    enabled: !!jobId,
  });

  // Fetch full job metadata
  const { data: job, refetch: refetchJob } = useQuery({
    queryKey: ['jobDetail', jobId],
    queryFn: () => fetchJobDetail(jobId),
    enabled: !!jobId,
  });

  // Fetch paginated recipient results
  const { data: recipientsData, refetch: refetchRecipients } = useQuery({
    queryKey: ['jobRecipients', jobId, page, recipientStatusFilter, searchQuery],
    queryFn: () => fetchJobRecipients(jobId, page, 20, recipientStatusFilter, searchQuery),
    enabled: !!jobId,
    refetchInterval: (query) => {
      if (progress && !progress.is_completed) return 2000;
      return false;
    },
  });

  // Celebrate on completion
  useEffect(() => {
    if (progress?.is_completed && progress?.success_count > 0 && !hasCelebrated) {
      setHasCelebrated(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      refetchJob();
      refetchRecipients();
    }
  }, [progress?.is_completed, progress?.success_count, hasCelebrated, refetchJob, refetchRecipients]);

  const cancelMutation = useMutation({
    mutationFn: () => cancelJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobProgress', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobDetail', jobId] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => retryJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobProgress', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobDetail', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobRecipients', jobId] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => requestArchive(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobDetail', jobId] });
    },
  });

  const currentStatus = progress?.status || job?.status || 'queued';
  const isCompleted = progress?.is_completed || false;
  const progressPct = progress?.progress_percentage ?? job?.progress_percentage ?? 0;

  const recipients = recipientsData?.items || [];
  const totalRecipients = recipientsData?.total || 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
        <span className="text-xs font-mono text-slate-400">ID: {jobId}</span>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {job?.course_name || 'Loading Course...'}
              </h1>
              <StatusBadge status={currentStatus} />
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              {job?.organization} • Signatory: {job?.issuer} • Issued: {job?.issue_date}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {!isCompleted && currentStatus !== 'cancelled' && (
              <button
                type="button"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                <Ban className="w-3.5 h-3.5 text-slate-500" />
                Cancel Job
              </button>
            )}

            {(currentStatus === 'completed_with_errors' || currentStatus === 'failed') && (
              <button
                type="button"
                onClick={() => retryMutation.mutate()}
                disabled={retryMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Failures
              </button>
            )}

            {/* ZIP Download / Request */}
            <a
              href={`/api/v1/jobs/${jobId}/archive/download`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shadow-indigo-600/30 transition-colors"
            >
              <FileArchive className="w-3.5 h-3.5" />
              Download All (ZIP)
            </a>

            {/* Failed Export CSV */}
            <a
              href={`/api/v1/jobs/${jobId}/failed/export`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500" />
              Export Failed (CSV)
            </a>
          </div>
        </div>

        {/* Progress Bar & Counter Banner */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Batch Progress</span>
            <span className="font-mono font-bold text-indigo-600">{progressPct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-violet-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Metrics Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {progress?.total_count ?? job?.total_count ?? 0}
            </div>
          </div>
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-600">Success</span>
            <div className="text-lg font-bold text-emerald-700 mt-0.5">
              {progress?.success_count ?? job?.success_count ?? 0}
            </div>
          </div>
          <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-600">Failed</span>
            <div className="text-lg font-bold text-rose-700 mt-0.5">
              {progress?.failed_count ?? job?.failed_count ?? 0}
            </div>
          </div>
          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-600">Invalid</span>
            <div className="text-lg font-bold text-amber-700 mt-0.5">
              {progress?.invalid_count ?? job?.invalid_count ?? 0}
            </div>
          </div>
          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-600">Pending</span>
            <div className="text-lg font-bold text-blue-700 mt-0.5">
              {progress?.pending_count ?? job?.pending_count ?? 0}
            </div>
          </div>
          <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 text-center">
            <span className="text-[10px] uppercase font-bold text-indigo-600">Valid</span>
            <div className="text-lg font-bold text-indigo-700 mt-0.5">
              {progress?.valid_count ?? job?.valid_count ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Recipient Results Table & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recipient Certificates</h2>
            <p className="text-xs text-slate-500">
              Showing {recipients.length} of {totalRecipients} recipients in this batch
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search recipient / ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
              {['all', 'success', 'failed', 'invalid', 'pending'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setRecipientStatusFilter(st);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                    recipientStatusFilter === st
                      ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recipients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Certificate ID</th>
                <th className="px-6 py-3">Recipient Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Details / Errors</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recipients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No recipients matching filter criteria.
                  </td>
                </tr>
              ) : (
                recipients.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-medium text-slate-900">
                      {rec.certificate_id}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">
                      {rec.recipient_name}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {rec.recipient_email || <span className="italic text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={rec.status} size="sm" />
                    </td>
                    <td className="px-6 py-3.5 max-w-xs truncate">
                      {rec.error_message ? (
                        <span className="text-rose-600 font-medium" title={rec.error_message}>
                          {rec.error_message}
                        </span>
                      ) : rec.status === 'success' ? (
                        <span className="text-slate-400">
                          {rec.file_size_bytes ? `${(rec.file_size_bytes / 1024).toFixed(1)} KB` : 'Rendered'}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">In progress</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-2">
                      {rec.status === 'success' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPreviewCertId(rec.certificate_id)}
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-medium bg-slate-100 hover:bg-indigo-50 px-2.5 py-1 rounded transition-colors"
                            title="Preview certificate"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Preview
                          </button>
                          <a
                            href={`/api/v1/certificates/${rec.certificate_id}/download`}
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            PDF
                          </a>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {recipientsData && recipientsData.total_pages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {recipientsData.page} of {recipientsData.total_pages}
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
                onClick={() => setPage((p) => Math.min(p + 1, recipientsData.total_pages))}
                disabled={page >= recipientsData.total_pages}
                className="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inline Certificate Preview Modal */}
      {previewCertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Certificate Preview: {previewCertId}
                </h3>
                <span className="text-xs text-slate-500">Official Landscape A4 Document</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/v1/certificates/${previewCertId}/download`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
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
                title="Certificate PDF Viewer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
