import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'ready':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20';
      case 'completed_with_errors':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20';
      case 'processing':
      case 'generating':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/20';
      case 'queued':
      case 'pending':
      case 'validating':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20';
      case 'failed':
      case 'invalid':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20';
      case 'cancelled':
        return 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-500/20';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/10';
    }
  };

  const isAnimated = ['processing', 'generating', 'validating', 'pending'].includes(status.toLowerCase());

  const label = status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${getStyles()}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isAnimated ? 'animate-pulse bg-current' : 'bg-current opacity-80'
        }`}
      />
      {label}
    </span>
  );
};
