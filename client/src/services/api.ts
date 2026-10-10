export interface Job {
  id: string;
  event_name?: string | null;
  course_name: string;
  issuer: string;
  organization: string;
  issue_date: string;
  status: 'queued' | 'validating' | 'processing' | 'completed' | 'completed_with_errors' | 'failed' | 'cancelled';
  total_count: number;
  valid_count: number;
  invalid_count: number;
  pending_count: number;
  success_count: number;
  failed_count: number;
  progress_percentage: number;
  error_summary?: string | null;
  archive_status: 'none' | 'pending' | 'ready' | 'failed';
  archive_storage_key?: string | null;
  archive_size_bytes?: number | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface Recipient {
  id: string;
  job_id: string;
  certificate_id: string;
  recipient_name: string;
  recipient_email?: string | null;
  status: 'pending' | 'validating' | 'invalid' | 'generating' | 'success' | 'failed' | 'cancelled';
  error_message?: string | null;
  storage_key?: string | null;
  file_size_bytes?: number | null;
  retry_count: number;
  generated_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CertificateItem {
  id: string;
  job_id: string;
  certificate_id: string;
  recipient_name: string;
  recipient_email?: string | null;
  course_name: string;
  issuer: string;
  organization: string;
  issue_date: string;
  event_name?: string | null;
  status: string;
  storage_key?: string | null;
  file_size_bytes?: number | null;
  generated_at?: string | null;
  download_url?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface JobProgressResponse {
  job_id: string;
  status: Job['status'];
  total_count: number;
  valid_count: number;
  invalid_count: number;
  pending_count: number;
  success_count: number;
  failed_count: number;
  progress_percentage: number;
  is_completed: boolean;
  archive_status: Job['archive_status'];
  error_summary?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface CertificateVerifyResponse {
  valid: boolean;
  certificate_id: string;
  recipient_name?: string | null;
  course_name?: string | null;
  issuer?: string | null;
  organization?: string | null;
  issue_date?: string | null;
  event_name?: string | null;
  generated_at?: string | null;
}

const API_BASE = '/api/v1';

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_BASE}/health/live`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function fetchJobs(
  page: number = 1,
  pageSize: number = 10,
  status?: string,
  search?: string
): Promise<PaginatedResponse<Job>> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (status && status !== 'all') params.append('status', status);
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE}/jobs?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
}

export async function fetchJobDetail(jobId: string): Promise<Job & { recipients_sample: Recipient[] }> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`);
  if (!res.ok) throw new Error('Failed to fetch job detail');
  return res.json();
}

export async function fetchJobProgress(jobId: string): Promise<JobProgressResponse> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/progress`);
  if (!res.ok) throw new Error('Failed to fetch job progress');
  return res.json();
}

export async function fetchJobRecipients(
  jobId: string,
  page: number = 1,
  pageSize: number = 25,
  status?: string,
  search?: string
): Promise<PaginatedResponse<Recipient>> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (status && status !== 'all') params.append('status', status);
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE}/jobs/${jobId}/recipients?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch recipients');
  return res.json();
}

export async function createJob(data: {
  course_name: string;
  issuer: string;
  organization: string;
  issue_date: string;
  event_name?: string;
  recipients: Array<{ recipient_name: string; recipient_email?: string }>;
  idempotency_key?: string;
}): Promise<Job> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to submit job');
  }
  return res.json();
}

export async function uploadCsvJob(formData: FormData): Promise<Job> {
  const res = await fetch(`${API_BASE}/jobs/upload-csv`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Failed to upload CSV job');
  }
  return res.json();
}

export async function cancelJob(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/cancel`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to cancel job');
  }
}

export async function retryJob(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/retry`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to retry job');
  }
}

export async function requestArchive(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/archive`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to request archive');
  }
}

export async function fetchCertificates(
  page: number = 1,
  pageSize: number = 20,
  search?: string
): Promise<PaginatedResponse<CertificateItem>> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE}/certificates?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch certificates');
  return res.json();
}

export async function verifyCertificate(certificateId: string): Promise<CertificateVerifyResponse> {
  const res = await fetch(`${API_BASE}/certificates/verify/${certificateId}`);
  if (!res.ok) throw new Error('Verification request failed');
  return res.json();
}
