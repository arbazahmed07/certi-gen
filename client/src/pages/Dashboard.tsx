import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Clock,
  Download,
  PlusCircle,
  Sparkles,
  Zap
} from 'lucide-react';
import { fetchJobs, fetchCertificates, Job } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const Dashboard: React.FC = () => {
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', 1, 10],
    queryFn: () => fetchJobs(1, 10),
    refetchInterval: 5000,
  });

  const { data: certsData } = useQuery({
    queryKey: ['certificates', 1, 1],
    queryFn: () => fetchCertificates(1, 1),
  });

  const jobs = jobsData?.items || [];
  const totalJobs = jobsData?.total || 0;

  // Aggregate stats across fetched jobs
  const totalCertificates = certsData?.total || jobs.reduce((acc, j) => acc + j.success_count, 0);
  const totalSuccess = jobs.reduce((acc, j) => acc + j.success_count, 0);
  const totalFailed = jobs.reduce((acc, j) => acc + j.failed_count + j.invalid_count, 0);
  const totalRecipients = jobs.reduce((acc, j) => acc + j.total_count, 0);
  const successRate = totalRecipients > 0 ? Math.round((totalSuccess / totalRecipients) * 100) : 100;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 shadow-xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>High-Throughput Distributed Processing Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Generate & Issue Certificates at Scale
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Process thousands of recipients asynchronously with bounded memory batches, automatic failure isolation, instant ZIP packaging, and tamper-evident verification.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/generate"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02]"
            >
              <Zap className="w-4 h-4" />
              <span>Start Bulk Generation</span>
            </Link>
            <Link
              to="/template"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-medium text-sm border border-white/10 transition-colors"
            >
              <span>Preview Official Template</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Certificates Issued
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{totalCertificates.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Ready for download & verification</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Batches
            </span>
            <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{totalJobs.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Jobs scheduled & archived</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Success vs Failed
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {totalSuccess} <span className="text-sm font-normal text-slate-400">/ {totalFailed}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              {totalFailed > 0 ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Isolated errors retryable
                </span>
              ) : (
                <span className="text-emerald-600">All certificates generated smoothly</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Overall Success Rate
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{successRate}%</div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Processing Activity Overview</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live generation status across recent asynchronous batches
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-600" /> Successful
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-400" /> Failed / Invalid
            </span>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No batch jobs recorded yet. Create your first batch to see activity charts.
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.slice(0, 5).map((job) => {
              const maxCount = Math.max(job.total_count, 1);
              const successWidth = (job.success_count / maxCount) * 100;
              const failWidth = ((job.failed_count + job.invalid_count) / maxCount) * 100;

              return (
                <div key={job.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-xs">
                      {job.course_name}
                    </span>
                    <span className="text-slate-500">
                      {job.success_count} / {job.total_count} recipients ({job.progress_percentage}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${successWidth}%` }}
                      className="bg-indigo-600 h-full transition-all duration-500"
                    />
                    <div
                      style={{ width: `${failWidth}%` }}
                      className="bg-rose-400 h-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Jobs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Generation Jobs</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time status of batch generation tasks</p>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>View All Jobs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {jobsLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800">No generation jobs yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Submit your first batch using JSON or CSV upload to generate professional certificates.
            </p>
            <Link
              to="/generate"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 mt-2"
            >
              <PlusCircle className="w-4 h-4" />
              Create First Batch
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Course & Program</th>
                  <th className="px-6 py-3.5">Organization</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Progress</th>
                  <th className="px-6 py-3.5">Recipients</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 block truncate max-w-xs"
                      >
                        {job.course_name}
                      </Link>
                      <span className="text-xs text-slate-400 block font-mono">
                        {job.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{job.organization}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32 space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>{job.progress_percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${job.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-x-1">
                        <span className="text-emerald-600 font-semibold">{job.success_count} ok</span>
                        {job.failed_count > 0 && (
                          <span className="text-rose-600 font-semibold">• {job.failed_count} err</span>
                        )}
                        {job.invalid_count > 0 && (
                          <span className="text-amber-600 font-semibold">• {job.invalid_count} inv</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors"
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
      </div>
    </div>
  );
};
