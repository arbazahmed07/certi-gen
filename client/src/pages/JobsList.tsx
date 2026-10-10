import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Layers, PlusCircle, ArrowRight, FileArchive } from 'lucide-react';
import { fetchJobs } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const JobsList: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobsList', page, statusFilter, search],
    queryFn: () => fetchJobs(page, 15, statusFilter, search),
    refetchInterval: 5000,
  });

  const jobs = jobsData?.items || [];

  return (
    <div className="space-y-6 pb-16">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Job History</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View, search, and monitor all certificate generation batches.
          </p>
        </div>
        <Link
          to="/generate"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs shadow-indigo-600/30 transition-all self-start"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Batch
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by course, organization, or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Jobs' },
            { id: 'processing', label: 'Processing' },
            { id: 'completed', label: 'Completed' },
            { id: 'completed_with_errors', label: 'With Errors' },
            { id: 'failed', label: 'Failed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800">No jobs found</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search criteria or create a new batch.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Course / Event</th>
                  <th className="px-6 py-3.5">Organization</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Progress</th>
                  <th className="px-6 py-3.5">Breakdown</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="font-bold text-slate-900 hover:text-indigo-600 block max-w-sm truncate"
                      >
                        {job.course_name}
                      </Link>
                      <span className="text-xs text-slate-400 block font-mono">
                        ID: {job.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      {job.organization}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>{job.progress_percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${job.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold space-x-1">
                      <span className="text-emerald-600">{job.success_count} ok</span>
                      {job.failed_count > 0 && <span className="text-rose-600">• {job.failed_count} err</span>}
                      {job.invalid_count > 0 && (
                        <span className="text-amber-600">• {job.invalid_count} inv</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {jobsData && jobsData.total_pages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {jobsData.page} of {jobsData.total_pages} ({jobsData.total} total jobs)
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
                onClick={() => setPage((p) => Math.min(p + 1, jobsData.total_pages))}
                disabled={page >= jobsData.total_pages}
                className="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
