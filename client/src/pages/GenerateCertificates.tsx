import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Upload,
  FileSpreadsheet,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  Sparkles,
  Info
} from 'lucide-react';
import { createJob, uploadCsvJob } from '../services/api';

const metadataSchema = z.object({
  course_name: z.string().min(2, 'Course / program name is required'),
  organization: z.string().min(2, 'Organization name is required'),
  issuer: z.string().min(2, 'Authorized issuer name is required'),
  issue_date: z.string().min(2, 'Issue date is required'),
  event_name: z.string().optional(),
});

type MetadataForm = z.infer<typeof metadataSchema>;

interface RecipientRow {
  recipient_name: string;
  recipient_email?: string;
}

export const GenerateCertificates: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [inputMode, setInputMode] = useState<'csv' | 'manual'>('csv');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState<RecipientRow[]>([]);
  const [manualRecipients, setManualRecipients] = useState<RecipientRow[]>([
    { recipient_name: 'Grace Hopper', recipient_email: 'grace@navy.mil' },
    { recipient_name: 'Alan Turing', recipient_email: 'alan@bletchley.ac.uk' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<MetadataForm>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      course_name: 'Full-Stack Software Architecture Masterclass',
      organization: 'Global Technology Institute',
      issuer: 'Dr. Sarah Connor, Dean of Studies',
      issue_date: 'October 15, 2026',
      event_name: 'TechSummit 2026',
    },
  });

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    // Parse preview in browser
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 1) {
        const rows: RecipientRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.trim());
          if (parts[0]) {
            rows.push({
              recipient_name: parts[0],
              recipient_email: parts[1] || undefined,
            });
          }
        }
        setCsvPreviewRows(rows);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleCsv = () => {
    const csvContent =
      'recipient_name,recipient_email\n' +
      'Alexander Hamilton,alexander@treasury.gov\n' +
      'Ada Lovelace,ada@computing.org\n' +
      'Katherine Johnson,katherine@nasa.gov\n' +
      'Nikola Tesla,nikola@wardenclyffe.com\n' +
      'Marie Curie,marie@radium.org\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_certificate_recipients.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeRecipients = inputMode === 'csv' ? csvPreviewRows : manualRecipients;

  // Real-time client side validation breakdown
  const validRecipients = activeRecipients.filter(
    (r) => r.recipient_name && r.recipient_name.trim().length >= 2
  );
  const invalidRecipients = activeRecipients.filter(
    (r) => !r.recipient_name || r.recipient_name.trim().length < 2
  );

  const seen = new Set<string>();
  const duplicates = activeRecipients.filter((r) => {
    const key = (r.recipient_email || r.recipient_name || '').toLowerCase();
    if (!key) return false;
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });

  const nextStep = async () => {
    if (currentStep === 1) {
      const isValid = await trigger();
      if (!isValid) return;
    }
    if (currentStep === 2) {
      if (inputMode === 'csv' && !csvFile) {
        setSubmitError('Please upload a CSV file or switch to manual recipient entry.');
        return;
      }
      if (inputMode === 'manual' && manualRecipients.length === 0) {
        setSubmitError('Please enter at least one recipient.');
        return;
      }
      setSubmitError(null);
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4) as any);
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as any);
  };

  const onSubmitAll = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    const meta = getValues();

    try {
      if (inputMode === 'csv' && csvFile) {
        const formData = new FormData();
        formData.append('course_name', meta.course_name);
        formData.append('organization', meta.organization);
        formData.append('issuer', meta.issuer);
        formData.append('issue_date', meta.issue_date);
        if (meta.event_name) formData.append('event_name', meta.event_name);
        formData.append('file', csvFile);

        const createdJob = await uploadCsvJob(formData);
        navigate(`/jobs/${createdJob.id}`);
      } else {
        const payload = {
          course_name: meta.course_name,
          organization: meta.organization,
          issuer: meta.issuer,
          issue_date: meta.issue_date,
          event_name: meta.event_name,
          recipients: manualRecipients,
          idempotency_key: `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        const createdJob = await createJob(payload);
        navigate(`/jobs/${createdJob.id}`);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit batch generation job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Generate Bulk Certificates
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Follow the guided workflow to configure metadata, upload recipients, validate records, and launch generation.
        </p>
      </div>

      {/* Stepper Progress Indicator */}
      <div className="grid grid-cols-4 gap-2 border-b border-slate-200 pb-4 text-xs sm:text-sm font-medium">
        {[
          { num: 1, label: 'Certificate Info' },
          { num: 2, label: 'Recipient Data' },
          { num: 3, label: 'Validation Preview' },
          { num: 4, label: 'Review & Launch' },
        ].map((s) => {
          const isActive = currentStep === s.num;
          const isDone = currentStep > s.num;
          return (
            <div
              key={s.num}
              className={`flex items-center gap-2 pb-2 border-b-2 transition-all ${
                isActive
                  ? 'border-indigo-600 text-indigo-700 font-bold'
                  : isDone
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isDone ? '✓' : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          );
        })}
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>{submitError}</div>
        </div>
      )}

      {/* Step 1: Certificate Information Form */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">1. Certificate Information</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These details are printed on every certificate in the official layout.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label htmlFor="course_name_input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Course / Certification Title *
              </label>
              <input
                id="course_name_input"
                type="text"
                {...register('course_name')}
                placeholder="e.g. Advanced Distributed Systems & Cloud Architecture"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.course_name && (
                <p className="text-xs text-rose-600 mt-1">{errors.course_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="organization_input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Issuing Organization *
              </label>
              <input
                id="organization_input"
                type="text"
                {...register('organization')}
                placeholder="e.g. Global Technology Institute"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.organization && (
                <p className="text-xs text-rose-600 mt-1">{errors.organization.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="issuer_input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Authorized Signatory / Issuer *
              </label>
              <input
                id="issuer_input"
                type="text"
                {...register('issuer')}
                placeholder="e.g. Dr. Sarah Connor, Executive Dean"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.issuer && (
                <p className="text-xs text-rose-600 mt-1">{errors.issuer.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="issue_date_input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Issue Date *
              </label>
              <input
                id="issue_date_input"
                type="text"
                {...register('issue_date')}
                placeholder="e.g. October 15, 2026"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.issue_date && (
                <p className="text-xs text-rose-600 mt-1">{errors.issue_date.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="event_name_input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Event / Context Name (Optional)
              </label>
              <input
                id="event_name_input"
                type="text"
                {...register('event_name')}
                placeholder="e.g. Annual Cloud Summit 2026"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Recipient Entry */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">2. Recipient Ingestion</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose between uploading a CSV spreadsheet or entering recipients manually.
              </p>
            </div>
            {/* Input Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 self-start">
              <button
                type="button"
                onClick={() => setInputMode('csv')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  inputMode === 'csv'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                CSV Upload
              </button>
              <button
                type="button"
                onClick={() => setInputMode('manual')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  inputMode === 'manual'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Manual Entry
              </button>
            </div>
          </div>

          {inputMode === 'csv' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-900">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Your CSV must include columns for <strong>recipient_name</strong> and optional{' '}
                    <strong>recipient_email</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-indigo-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Sample CSV
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center transition-colors bg-slate-50/50 hover:bg-indigo-50/20">
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv"
                  onChange={handleCsvChange}
                  className="hidden"
                />
                <label
                  htmlFor="csv-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-semibold text-indigo-600 hover:underline">
                      Click to upload CSV
                    </span>{' '}
                    <span className="text-slate-500">or drag and drop</span>
                  </div>
                  <p className="text-xs text-slate-400">CSV files up to 25MB supported</p>
                </label>
              </div>

              {csvFile && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="font-semibold text-sm text-slate-900">{csvFile.name}</div>
                      <div className="text-xs text-slate-500">
                        {(csvFile.size / 1024).toFixed(1)} KB • {csvPreviewRows.length} recipients detected
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvFile(null);
                      setCsvPreviewRows([]);
                    }}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2.5">
                {manualRecipients.map((rec, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400 w-6 text-center">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Recipient Full Name *"
                      value={rec.recipient_name}
                      onChange={(e) => {
                        const updated = [...manualRecipients];
                        updated[index].recipient_name = e.target.value;
                        setManualRecipients(updated);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input
                      type="email"
                      placeholder="Email Address (optional)"
                      value={rec.recipient_email || ''}
                      onChange={(e) => {
                        const updated = [...manualRecipients];
                        updated[index].recipient_email = e.target.value;
                        setManualRecipients(updated);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setManualRecipients(manualRecipients.filter((_, i) => i !== index));
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setManualRecipients([
                    ...manualRecipients,
                    { recipient_name: '', recipient_email: '' },
                  ]);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-dashed border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Another Recipient
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Recipient Validation Preview */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">3. Recipient Validation Preview</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review records before initiating background generation. Invalid records are isolated and will not halt the job.
            </p>
          </div>

          {/* Validation Counters */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 uppercase font-semibold">Total Ingested</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{activeRecipients.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs text-emerald-700 uppercase font-semibold">Valid for PDF</span>
              <div className="text-2xl font-bold text-emerald-800 mt-1">{validRecipients.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-xs text-rose-700 uppercase font-semibold">Issues Detected</span>
              <div className="text-2xl font-bold text-rose-800 mt-1">{invalidRecipients.length}</div>
            </div>
          </div>

          {duplicates.length > 0 && (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>{duplicates.length} duplicate entries detected.</strong> Duplicates will be isolated to prevent double issuance.
              </span>
            </div>
          )}

          {/* Preview Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Recipient Name</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Validation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activeRecipients.map((rec, i) => {
                    const isValid = rec.recipient_name && rec.recipient_name.trim().length >= 2;
                    return (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 text-slate-400 font-mono">{i + 1}</td>
                        <td className="px-4 py-2 font-medium text-slate-900">
                          {rec.recipient_name || <span className="text-rose-500 italic">Missing</span>}
                        </td>
                        <td className="px-4 py-2 text-slate-500">{rec.recipient_email || '—'}</td>
                        <td className="px-4 py-2">
                          {isValid ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Name too short
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Review and Submit */}
      {currentStep === 4 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">4. Review & Launch Generation</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm your batch configuration. Processing will execute asynchronously in bounded batches.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-semibold">Course / Event</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{getValues('course_name')}</div>
              {getValues('event_name') && (
                <div className="text-slate-500 mt-0.5">{getValues('event_name')}</div>
              )}
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold">Organization & Signatory</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{getValues('organization')}</div>
              <div className="text-slate-500 mt-0.5">{getValues('issuer')}</div>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold">Issue Date</span>
              <div className="font-semibold text-slate-800 text-sm mt-0.5">{getValues('issue_date')}</div>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold">Recipients to Process</span>
              <div className="font-semibold text-indigo-700 text-sm mt-0.5">
                {validRecipients.length} valid / {activeRecipients.length} total
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Asynchronous Background Guarantee
            </div>
            <p>
              Once submitted, the job returns HTTP 202 Accepted. You will be redirected to the real-time job progress monitor where you can track each recipient's certificate generation.
            </p>
          </div>
        </div>
      )}

      {/* Step Navigation Controls */}
      <div className="flex items-center justify-between pt-4">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
        ) : (
          <div />
        )}

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={nextStep}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs shadow-indigo-600/30 transition-all hover:scale-[1.01]"
          >
            <span>Next Step</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmitAll}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Scheduling Batch Job...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Launch Certificate Generation
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
