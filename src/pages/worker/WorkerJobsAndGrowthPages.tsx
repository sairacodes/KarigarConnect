import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle2,
  Coins,
  Copy,
  Lock,
  Mail,
  MapPin,
  Phone,
  Play,
  Plus,
  Scale,
  Share2,
  ShieldAlert,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { EmptyState, LoadingSkeleton, StatusLabel, formatDate } from '../../components/ui/Components';
import { QrPassportCard } from '../../components/ui/QrPassport';
import { TierPill } from '../../components/ui/RatingDisplay';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../i18n/translations';
import { api, getApiErrorMessage } from '../../services/api';

function getPriceBadge(priceGuide: any[], amountPkr: number) {
  if (!priceGuide?.length || !amountPkr || amountPkr <= 0) return null;
  const minAll = Math.min(...priceGuide.map((g: any) => g.minPkr));
  const maxAll = Math.max(...priceGuide.map((g: any) => g.maxPkr));
  if (amountPkr < minAll) return 'BELOW_GUIDE';
  if (amountPkr > maxAll) return 'ABOVE_GUIDE';
  return 'WITHIN_GUIDE';
}

export function WorkerJobsPage() {
  const { bi, lang, isUr } = useI18n();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ALL' | 'REQUESTED' | 'ACTIVE' | 'DONE'>('ALL');

  // Accept form drafts
  const [acceptingJob, setAcceptingJob] = useState<any>(null);
  const [quotedPkr, setQuotedPkr] = useState('');
  const [scheduledDt, setScheduledDt] = useState('');
  const [workerNotes, setWorkerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Schedule modal
  const [schedulingJob, setSchedulingJob] = useState<any>(null);
  const [scheduleInput, setScheduleInput] = useState('');

  // Complete modal
  const [completingJob, setCompletingJob] = useState<any>(null);
  const [finalPkr, setFinalPkr] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [beforeFiles, setBeforeFiles] = useState<File[]>([]);
  const [afterFiles, setAfterFiles] = useState<File[]>([]);

  // Dispute responses
  const [disputeDrafts, setDisputeDrafts] = useState<Record<string, string>>({});

  // Urgent SOS
  const [sosJob, setSosJob] = useState<any>(null);
  const [sosDetails, setSosDetails] = useState('');

  const loadJobs = () => {
    setLoading(true);
    api
      .get('/jobs/mine')
      .then((res) => setJobs(res.data.data || []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filtered = useMemo(() => {
    if (tab === 'REQUESTED') return jobs.filter((j) => j.status === 'REQUESTED');
    if (tab === 'ACTIVE') return jobs.filter((j) => ['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'DISPUTED'].includes(j.status));
    if (tab === 'DONE') return jobs.filter((j) => ['COMPLETED', 'CANCELLED'].includes(j.status));
    return jobs;
  }, [jobs, tab]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingJob) return;
    setSubmitting(true);
    try {
      await api.patch(`/jobs/${acceptingJob.id}/accept`, {
        quotedPkr: Number(quotedPkr),
        scheduledDateTime: scheduledDt || undefined,
        workerNotes,
      });
      showToast(bi('Job accepted and customer contact unlocked!', 'کام قبول کر لیا گیا اور کسٹمر کا رابطہ کھل گیا!'), 'success');
      setAcceptingJob(null);
      setQuotedPkr('');
      setScheduledDt('');
      setWorkerNotes('');
      loadJobs();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingJob) return;
    setSubmitting(true);
    try {
      await api.patch(`/jobs/${schedulingJob.id}/schedule`, { scheduledDateTime: scheduleInput });
      showToast(bi('Job visit scheduled.', 'کام کا وقت طے ہو گیا۔'), 'success');
      setSchedulingJob(null);
      loadJobs();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async (jobId: string) => {
    try {
      await api.patch(`/jobs/${jobId}/start`);
      showToast(bi('Job marked as In Progress.', 'کام جاری ہونے کا اندراج ہو گیا۔'), 'success');
      loadJobs();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingJob) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('finalPkr', String(Number(finalPkr || completingJob.quotedPkr || 1500)));
      fd.append('completionNotes', completionNotes);
      beforeFiles.forEach((f) => fd.append('beforePhotos', f));
      afterFiles.forEach((f) => fd.append('afterPhotos', f));

      await api.post(`/jobs/${completingJob.id}/complete`, fd);
      showToast(
        bi('Job completed! Earnings logged and customer notified to confirm proof & rate.', 'کام مکمل ہو گیا! آمدنی درج ہو گئی اور گاہک کو تصدیق کی اطلاع بھیج دی گئی۔'),
        'success'
      );
      setCompletingJob(null);
      setBeforeFiles([]);
      setAfterFiles([]);
      setCompletionNotes('');
      loadJobs();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (jobId: string) => {
    try {
      await api.patch(`/jobs/${jobId}/cancel`, { reason: 'Worker unavailable for requested slot' });
      showToast(bi('Job cancelled.', 'کام منسوخ کر دیا گیا۔'), 'info');
      loadJobs();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleRespondDispute = async (disputeId: string) => {
    const text = (disputeDrafts[disputeId] || '').trim();
    if (text.length < 5) {
      showToast(bi('Enter a detailed response (5+ characters).', 'کم از کم ۵ حروف کا تفصیلی جواب لکھیں۔'), 'error');
      return;
    }
    try {
      await api.patch(`/disputes/${disputeId}/respond`, { workerResponse: text });
      showToast(bi('Response sent to customer and Admin.', 'جواب کسٹمر اور ایڈمن کو بھیج دیا گیا۔'), 'success');
      loadJobs();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleSos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosJob) return;
    setSubmitting(true);
    try {
      await api.post(`/jobs/${sosJob.id}/sos`, { details: sosDetails });
      showToast(bi('Urgent safety alert sent to Karigar Connect Admins.', 'ہنگامی حفاظتی اطلاع ایڈمنز کو بھیج دی گئی۔'), 'success');
      setSosJob(null);
      setSosDetails('');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const shareSafeVisit = async (job: any) => {
    const summary = `Karigar Connect Safe-Visit Check-in | Job: ${job.title} | Area: ${job.area}, ${job.city} | Time: ${job.scheduledDateTime || job.preferredDate} | Customer: ${job.customerName}`;
    try {
      await navigator.clipboard.writeText(summary);
      showToast(bi('Trusted-contact visit summary copied!', 'محفوظ وزٹ کی تفصیل کاپی ہو گئی!'), 'success');
    } catch {
      showToast(summary, 'info');
    }
  };

  const livePriceStatus = acceptingJob
    ? getPriceBadge(acceptingJob.priceGuide || [], Number(quotedPkr))
    : null;

  return (
    <DashboardLayout title={bi('My Jobs & Quotes', 'میرے کام اور تخمینہ')}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL' as const, label: bi(`All (${jobs.length})`, `تمام (${jobs.length})`) },
            {
              id: 'REQUESTED' as const,
              label: bi(
                `Pending Requests (${jobs.filter((j) => j.status === 'REQUESTED').length})`,
                `نئی درخواستیں (${jobs.filter((j) => j.status === 'REQUESTED').length})`
              ),
            },
            {
              id: 'ACTIVE' as const,
              label: bi(
                `Active (${jobs.filter((j) => ['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'DISPUTED'].includes(j.status)).length})`,
                `فعال کام (${jobs.filter((j) => ['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'DISPUTED'].includes(j.status)).length})`
              ),
            },
            {
              id: 'DONE' as const,
              label: bi(
                `Completed / Past (${jobs.filter((j) => ['COMPLETED', 'CANCELLED'].includes(j.status)).length})`,
                `مکمل / سابقہ (${jobs.filter((j) => ['COMPLETED', 'CANCELLED'].includes(j.status)).length})`
              ),
            },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-[#176B4A] text-white'
                  : 'border border-[#E6E0D2] bg-white text-[#17251E] hover:bg-[#ECE6D7]/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={bi('No jobs in this view', 'اس فہرست میں کوئی کام نہیں')}
            description={bi(
              'When customers request your verified service from Explore Workers, requests appear here with Fair Price Guide ranges.',
              'جب گاہک آپ کی خدمات کی درخواست بھیجیں گے تو وہ مناسب قیمت نامے کے ساتھ یہاں ظاہر ہوں گی۔'
            )}
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((job) => (
              <div key={job.id} className="rounded-2xl kc-glass-card p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-[#17251E]">{job.title}</h3>
                      <StatusLabel status={job.status} />
                      {job.priceStatus && job.priceStatus !== 'NO_GUIDE' && (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            job.priceStatus === 'WITHIN_GUIDE'
                              ? 'bg-[#ECE6D7] text-[#176B4A]'
                              : job.priceStatus === 'BELOW_GUIDE'
                                ? 'bg-sky-50 text-sky-800'
                                : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {job.priceStatus === 'WITHIN_GUIDE'
                            ? bi('Within Fair Guide', 'مناسب نرخ کے اندر')
                            : job.priceStatus === 'BELOW_GUIDE'
                              ? bi('Below Fair Guide', 'نرخ نامے سے کم')
                              : bi('Above Fair Guide', 'نرخ نامے سے زیادہ')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#69726B]">
                      {isUr && job.tradeUrduName ? job.tradeUrduName : job.tradeName} ·{' '}
                      <span className="font-semibold text-[#17251E]">{job.customerName}</span>
                      {job.customerCompanyName ? ` (${job.customerCompanyName})` : ''} ·{' '}
                      <MapPin className="inline h-3.5 w-3.5 text-[#399B6B]" /> {job.area}, {job.city}
                    </p>
                  </div>

                  <div className="text-xs text-end space-y-1">
                    <p className="text-[#69726B] flex items-center sm:justify-end gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {job.scheduledDateTime
                          ? `${bi('Scheduled:', 'طے شدہ:')} ${job.scheduledDateTime}`
                          : `${job.preferredDate} · ${job.preferredTimeSlot}`}
                      </span>
                    </p>
                    {(job.finalPkr || job.quotedPkr) && (
                      <p className="font-mono font-bold text-[#176B4A] text-sm">
                        PKR {(job.finalPkr || job.quotedPkr).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-[#17251E] leading-relaxed">{job.description}</p>

                {/* Problem / Before / After Photos */}
                {(job.problemPhotos?.length > 0 || job.beforePhotos?.length > 0 || job.afterPhotos?.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {job.problemPhotos?.length > 0 && (
                      <div className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] p-3">
                        <p className="text-[11px] font-bold text-[#69726B] mb-2">
                          {bi('Customer Problem Photos', 'مسئلے کی تصاویر')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {job.problemPhotos.map((p: any) => (
                            <img
                              key={p.id}
                              src={p.signedUrl}
                              alt={p.originalName}
                              className="h-16 w-16 rounded-lg object-cover border border-[#E6E0D2]"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {job.beforePhotos?.length > 0 && (
                      <div className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] p-3">
                        <p className="text-[11px] font-bold text-[#69726B] mb-2">{bi('Before Work', 'کام سے پہلے')}</p>
                        <div className="flex flex-wrap gap-2">
                          {job.beforePhotos.map((p: any) => (
                            <img
                              key={p.id}
                              src={p.signedUrl}
                              alt={p.originalName}
                              className="h-16 w-16 rounded-lg object-cover border border-[#E6E0D2]"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {job.afterPhotos?.length > 0 && (
                      <div className="rounded-xl border border-[#D8D0BE] bg-[#ECE6D7]/35 p-3">
                        <p className="text-[11px] font-bold text-[#176B4A] mb-2">{bi('After Work Proof', 'کام کے بعد ثبوت')}</p>
                        <div className="flex flex-wrap gap-2">
                          {job.afterPhotos.map((p: any) => (
                            <img
                              key={p.id}
                              src={p.signedUrl}
                              alt={p.originalName}
                              className="h-16 w-16 rounded-lg object-cover border border-[#D8D0BE]"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact Gating */}
                {job.contactUnlocked && job.customerContact ? (
                  <div className="rounded-xl border border-[#C9973A] bg-[#ECE6D7]/55 p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-[#176B4A]">
                    <div className="flex flex-wrap gap-5">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        <span className="font-mono">{job.customerContact.phone}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{job.customerContact.email}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => shareSafeVisit(job)}
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-[#176B4A] border border-[#D8D0BE] hover:bg-[#F7F4EC]"
                    >
                      <Share2 className="h-3 w-3" />
                      {bi('Share Check-in Summary', 'محفوظ وزٹ تفصیل کاپی')}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-[#69726B] flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-[#399B6B]" />
                    <span>
                      {bi(
                        'Customer phone and email unlock automatically once you accept and submit your quote.',
                        'گاہک کا فون اور ای میل آپ کے کام قبول کرنے اور تخمینہ دینے پر کھل جائے گا۔'
                      )}
                    </span>
                  </p>
                )}

                {/* 7-Day Karigar Guarantee Dispute Panel */}
                {job.dispute && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50/75 p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-900">
                        <Scale className="h-4 w-4" />
                        {bi('7-Day Karigar Guarantee Request:', '۷ روزہ کاریگر گارنٹی درخواست:')} {job.dispute.reason}
                      </span>
                      <StatusLabel status={job.dispute.status} />
                    </div>
                    <p className="text-xs text-[#17251E]">{job.dispute.details}</p>
                    {job.dispute.workerResponse ? (
                      <p className="text-xs text-[#176B4A] bg-white rounded-lg p-2.5 border border-[#E6E0D2]">
                        <strong>{bi('Your Response:', 'آپ کا جواب:')}</strong> {job.dispute.workerResponse}
                      </p>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={disputeDrafts[job.dispute.id] || ''}
                          onChange={(e) =>
                            setDisputeDrafts({ ...disputeDrafts, [job.dispute.id]: e.target.value })
                          }
                          placeholder={bi('Offer free rework time or clarify the issue...', 'مفت دوبارہ کام کا وقت یا وضاحت لکھیں...')}
                          className="flex-1 rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleRespondDispute(job.dispute.id)}
                          className="rounded-xl bg-[#176B4A] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#13563B]"
                        >
                          {bi('Send Response', 'جواب بھیجیں')}
                        </button>
                      </div>
                    )}
                    {job.dispute.adminResolutionNotes && (
                      <p className="text-xs text-[#69726B]">
                        <strong>{bi('Admin Resolution:', 'ایڈمن فیصلہ:')}</strong> {job.dispute.adminResolutionNotes}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="border-t border-[#E6E0D2] pt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    {job.status === 'REQUESTED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setAcceptingJob(job);
                            const midGuide = job.priceGuide?.[0]
                              ? Math.round((job.priceGuide[0].minPkr + job.priceGuide[0].maxPkr) / 2)
                              : 1500;
                            setQuotedPkr(String(midGuide));
                          }}
                          className="rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B]"
                        >
                          {bi('Accept & Send PKR Quote', 'قبول کریں اور تخمینہ بھیجیں')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(job.id)}
                          className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          {bi('Decline', 'انکار کریں')}
                        </button>
                      </>
                    )}

                    {['ACCEPTED', 'SCHEDULED'].includes(job.status) && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStart(job.id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B]"
                        >
                          <Play className="h-3.5 w-3.5" />
                          {bi('Start Work', 'کام شروع کریں')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSchedulingJob(job);
                            setScheduleInput(job.scheduledDateTime || `${job.preferredDate} 11:00 AM`);
                          }}
                          className="rounded-full border border-[#E6E0D2] bg-[#F7F4EC] px-4 py-2 text-xs font-semibold text-[#17251E] hover:bg-[#ECE6D7]/50"
                        >
                          {bi('Set Visit Time', 'وقت مقرر کریں')}
                        </button>
                      </>
                    )}

                    {['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'].includes(job.status) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCompletingJob(job);
                          setFinalPkr(String(job.quotedPkr || 1500));
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#C9973A] bg-[#ECE6D7]/75 px-4 py-2 text-xs font-semibold text-[#176B4A] hover:bg-[#ECE6D7]"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        {bi('Complete & Upload Before/After Proof', 'کام مکمل کریں اور ثبوت اپ لوڈ کریں')}
                      </button>
                    )}

                    {job.status === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#176B4A]">
                        <CheckCircle2 className="h-4 w-4 text-[#399B6B]" />
                        {job.customerConfirmedProof
                          ? bi('Customer confirmed proof', 'گاہک نے کام کے ثبوت کی تصدیق کر دی')
                          : bi('Awaiting customer confirmation', 'گاہک کی تصدیق کا انتظار')}
                      </span>
                    )}
                  </div>

                  {['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'].includes(job.status) && (
                    <button
                      type="button"
                      onClick={() => setSosJob(job)}
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      {bi('Urgent SOS', 'ہنگامی مدد')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accept & Quote Modal */}
      {acceptingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251E]/45 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#E6E0D2] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#17251E]">
                  {bi('Accept Job & Send Fair Quote', 'کام قبول کریں اور تخمینہ بھیجیں')}
                </h3>
                <p className="text-xs text-[#69726B] mt-0.5">{acceptingJob.title}</p>
              </div>
              <button type="button" onClick={() => setAcceptingJob(null)} className="text-[#69726B] hover:text-[#17251E]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {acceptingJob.priceGuide?.length > 0 && (
              <div className="rounded-xl border border-[#D8D0BE] bg-[#F7F4EC] p-3 text-xs space-y-1">
                <p className="font-bold text-[#176B4A]">
                  {bi('Karigar Connect Fair Price Guide (PKR):', 'کاریگر کنیکٹ مناسب قیمت نامہ (PKR):')}
                </p>
                {acceptingJob.priceGuide.map((pg: any) => (
                  <div key={pg.id} className="flex justify-between text-[#17251E]">
                    <span>{isUr && pg.serviceUrduLabel ? pg.serviceUrduLabel : pg.serviceLabel}</span>
                    <span className="font-mono font-semibold">
                      PKR {pg.minPkr.toLocaleString()}–{pg.maxPkr.toLocaleString()} ({pg.unit})
                    </span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAccept} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#17251E]">{bi('Estimated Quote (PKR)', 'تخمینی قیمت (PKR)')}</label>
                  {livePriceStatus && (
                    <span
                      className={`text-[11px] font-bold ${
                        livePriceStatus === 'WITHIN_GUIDE'
                          ? 'text-[#176B4A]'
                          : livePriceStatus === 'BELOW_GUIDE'
                            ? 'text-sky-700'
                            : 'text-amber-700'
                      }`}
                    >
                      {livePriceStatus === 'WITHIN_GUIDE'
                        ? bi('Within Fair Guide', 'مناسب نرخ کے اندر')
                        : livePriceStatus === 'BELOW_GUIDE'
                          ? bi('Below Fair Guide', 'نرخ سے کم')
                          : bi('Above Fair Guide', 'نرخ سے زیادہ')}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min={100}
                  required
                  value={quotedPkr}
                  onChange={(e) => setQuotedPkr(e.target.value)}
                  className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#17251E] mb-1">
                  {bi('Proposed Visit Date & Time (Optional)', 'ملاقات کی تاریخ اور وقت (اختیاری)')}
                </label>
                <input
                  type="text"
                  value={scheduledDt}
                  onChange={(e) => setScheduledDt(e.target.value)}
                  placeholder="e.g. Tomorrow 11:00 AM"
                  className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#17251E] mb-1">
                  {bi('Note for Customer', 'کسٹمر کے لیے نوٹ')}
                </label>
                <textarea
                  rows={2}
                  value={workerNotes}
                  onChange={(e) => setWorkerNotes(e.target.value)}
                  placeholder={bi('Includes inspection & standard labour...', 'معائنہ اور معیاری مزدوری شامل ہے...')}
                  className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAcceptingJob(null)}
                  className="rounded-xl border border-[#E6E0D2] px-4 py-2 text-xs font-semibold"
                >
                  {bi('Cancel', 'منسوخ')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#176B4A] px-5 py-2 text-xs font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
                >
                  {submitting ? bi('Accepting...', 'قبول ہو رہا ہے...') : bi('Confirm & Unlock Contact', 'منظور کریں اور رابطہ کھولیں')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {schedulingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251E]/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#E6E0D2] bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#17251E]">{bi('Schedule Job Visit', 'وزٹ کا وقت طے کریں')}</h3>
            <form onSubmit={handleSchedule} className="space-y-3">
              <input
                type="text"
                required
                value={scheduleInput}
                onChange={(e) => setScheduleInput(e.target.value)}
                placeholder="2026-11-24 10:30 AM"
                className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSchedulingJob(null)} className="rounded-xl border px-4 py-2 text-xs font-semibold">
                  {bi('Cancel', 'منسوخ')}
                </button>
                <button type="submit" disabled={submitting} className="rounded-xl bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white">
                  {bi('Save Schedule', 'وقت محفوظ کریں')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Job & Upload Proof Modal */}
      {completingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251E]/45 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#E6E0D2] bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#17251E]">
                  {bi('Complete Job & Upload Work Proof', 'کام مکمل کریں اور ثبوت اپ لوڈ کریں')}
                </h3>
                <p className="text-xs text-[#69726B] mt-0.5">{completingJob.title}</p>
              </div>
              <button type="button" onClick={() => setCompletingJob(null)} className="text-[#69726B]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleComplete} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#17251E] mb-1">
                  {bi('Final Agreed Amount (PKR)', 'حتمی طے شدہ رقم (PKR)')}
                </label>
                <input
                  type="number"
                  min={100}
                  required
                  value={finalPkr}
                  onChange={(e) => setFinalPkr(e.target.value)}
                  className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#17251E] mb-1">
                  {bi('Completion Notes', 'کام کی تکمیل کی تفصیل')}
                </label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder={bi('Describe work completed, parts installed, and safety checks...', 'مکمل کیے گئے کام اور حفاظتی جانچ کی تفصیل لکھیں...')}
                  className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] p-3">
                  <label className="block text-xs font-semibold text-[#17251E] mb-1.5">
                    {bi('Before Photos (Optional)', 'پہلے کی تصاویر (اختیاری)')}
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => setBeforeFiles(Array.from(e.target.files || []))}
                    className="w-full text-xs"
                  />
                </div>
                <div className="rounded-xl border border-[#D8D0BE] bg-[#ECE6D7]/35 p-3">
                  <label className="block text-xs font-semibold text-[#176B4A] mb-1.5">
                    {bi('After Photos (Work Proof)', 'بعد کی تصاویر (کام کا ثبوت)')}
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => setAfterFiles(Array.from(e.target.files || []))}
                    className="w-full text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCompletingJob(null)} className="rounded-xl border px-4 py-2 text-xs font-semibold">
                  {bi('Cancel', 'منسوخ')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#176B4A] px-5 py-2 text-xs font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
                >
                  {submitting ? bi('Submitting...', 'جمع ہو رہا ہے...') : bi('Mark Completed & Log Earnings', 'مکمل قرار دیں اور آمدنی درج کریں')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SOS Modal */}
      {sosJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251E]/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-red-700 font-bold">
                <AlertTriangle className="h-5 w-5" />
                <h3>{bi('Urgent Safety / SOS Alert', 'ہنگامی حفاظتی الرٹ')}</h3>
              </div>
              <button type="button" onClick={() => setSosJob(null)} className="text-[#69726B]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-[#69726B]">
              {bi(
                'This immediately creates a high-priority safety alert for Karigar Connect platform administrators.',
                'یہ فوری طور پر کاریگر کنیکٹ ایڈمنز کو ہنگامی حفاظتی اطلاع بھیجتا ہے۔'
              )}
            </p>
            <form onSubmit={handleSos} className="space-y-3">
              <textarea
                rows={3}
                required
                value={sosDetails}
                onChange={(e) => setSosDetails(e.target.value)}
                placeholder={bi('Describe the urgent safety or harassment issue...', 'ہنگامی حفاظتی مسئلہ بیان کریں...')}
                className="w-full rounded-xl border border-red-200 bg-red-50/40 px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSosJob(null)} className="rounded-xl border px-4 py-2 text-xs font-semibold">
                  {bi('Cancel', 'منسوخ')}
                </button>
                <button type="submit" disabled={submitting} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700">
                  {bi('Send Urgent Alert', 'ہنگامی الرٹ بھیجیں')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export function WorkerGrowthPage() {
  const { bi, lang, isUr, tierText } = useI18n();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [growth, setGrowth] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [amountPkr, setAmountPkr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/workers/me/growth'), api.get('/workers/me')])
      .then(([gRes, pRes]) => {
        setGrowth(gRes.data.data);
        setProfile(pRes.data.data);
      })
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/workers/me/earnings', {
        title,
        amountPkr: Number(amountPkr),
        date,
        notes,
      });
      showToast(bi('Earnings entry added.', 'آمدنی کا اندراج شامل ہو گیا۔'), 'success');
      setTitle('');
      setAmountPkr('');
      setNotes('');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (id: string) => {
    try {
      await api.delete(`/workers/me/earnings/${id}`);
      showToast(bi('Entry removed.', 'اندراج ہٹا دیا گیا۔'), 'info');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <DashboardLayout title={bi('Worker Growth Hub & Karigar Passport', 'ورکر ترقی مرکز اور کاریگر پاسپورٹ')}>
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : !growth || !profile ? null : (
        <div className="space-y-6">
          {/* Printable QR Karigar Passport */}
          <QrPassportCard
            workerName={profile.fullName}
            city={profile.city}
            tradeName={isUr && profile.tradeUrduName ? profile.tradeUrduName : profile.tradeName || 'Skilled Karigar'}
            passportId={growth.passportId}
            publicId={growth.publicId}
            tier={profile.tier}
            trustScore={growth.trustScoreBreakdown?.total || 0}
            verifiedCount={profile.stats?.verifiedCompetencies || 0}
            completedJobsCount={profile.stats?.completedJobsCount || 0}
            rating={profile.ratingSummary?.bayesianRating || 0}
            totalReviews={profile.ratingSummary?.totalReviews || 0}
          />

          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
            <div className="rounded-2xl kc-glass-card p-5">
              <p className="text-xs font-semibold text-[#69726B] flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-[#176B4A]" />
                {bi('Total Tracked Earnings', 'کل درج شدہ آمدنی')}
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[#17251E] tabular-nums">
                PKR {growth.totalEarningsPkr.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[#69726B]">
                {growth.totalJobsLogged} {bi('job entries logged', 'کام درج شدہ')}
              </p>
            </div>
            <div className="rounded-2xl kc-glass-card p-5">
              <p className="text-xs font-semibold text-[#69726B] flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-[#176B4A]" />
                {bi('This Month', 'اس ماہ کی آمدنی')}
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[#176B4A] tabular-nums">
                PKR {growth.thisMonthPkr.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[#69726B]">
                {bi('Auto-logged from completed platform jobs', 'مکمل کاموں سے خودکار اندراج')}
              </p>
            </div>
            <div className="rounded-2xl kc-glass-card p-5">
              <p className="text-xs font-semibold text-[#69726B] flex items-center gap-1.5">
                <Award className="h-4 w-4 text-[#176B4A]" />
                {bi(`${user?.city || profile.city} Leaderboard Rank`, `${user?.city || profile.city} میں درجہ`)}
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[#17251E] tabular-nums">
                {growth.cityRank ? `#${growth.cityRank}` : '—'}
                <span className="text-sm font-normal text-[#69726B]">
                  {growth.cityPeersTotal ? ` / ${growth.cityPeersTotal}` : ''}
                </span>
              </p>
              <div className="mt-1 flex items-center gap-2">
                <TierPill tier={profile.tier} compact />
                {growth.tierProgress?.nextTier && (
                  <span className="text-xs text-[#69726B]">
                    {bi(`Next: ${tierText(growth.tierProgress.nextTier)}`, `اگلا: ${tierText(growth.tierProgress.nextTier)}`)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
            {/* Earnings Tracker */}
            <div className="lg:col-span-7 rounded-2xl kc-glass-card p-6 space-y-4">
              <h3 className="text-base font-bold text-[#17251E]">
                {bi('Earnings Tracker (PKR)', 'آمدنی کا ریکارڈ (PKR)')}
              </h3>

              <form onSubmit={addEntry} className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] p-4 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={bi('Job or site description', 'کام یا سائٹ کی تفصیل')}
                  className="sm:col-span-5 rounded-xl border border-[#E6E0D2] bg-white px-3 py-2 text-xs"
                />
                <input
                  type="number"
                  min={50}
                  required
                  value={amountPkr}
                  onChange={(e) => setAmountPkr(e.target.value)}
                  placeholder={bi('Amount (PKR)', 'رقم (PKR)')}
                  className="sm:col-span-3 rounded-xl border border-[#E6E0D2] bg-white px-3 py-2 text-xs"
                />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="sm:col-span-2 rounded-xl border border-[#E6E0D2] bg-white px-2 py-2 text-xs"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="sm:col-span-2 inline-flex items-center justify-center gap-1 rounded-xl bg-[#176B4A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#13563B]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {bi('Add', 'شامل')}
                </button>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={bi('Optional area / note...', 'اختیاری علاقہ / نوٹ...')}
                  className="sm:col-span-12 rounded-xl border border-[#E6E0D2] bg-white px-3 py-1.5 text-xs"
                />
              </form>

              {growth.logs.length === 0 ? (
                <p className="text-sm text-[#69726B]">{bi('No earnings logged yet.', 'ابھی کوئی آمدنی درج نہیں ہوئی۔')}</p>
              ) : (
                <div className="divide-y divide-[#E6E0D2]">
                  {growth.logs.map((l: any) => (
                    <div key={l.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#17251E]">{l.title}</span>
                          {l.jobId && (
                            <span className="rounded bg-[#ECE6D7] px-1.5 py-0.5 text-[10px] font-bold text-[#176B4A]">
                              {bi('Platform Job', 'پلیٹ فارم کام')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#69726B]">
                          {formatDate(l.date, lang)} {l.notes ? `· ${l.notes}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[#176B4A] tabular-nums">
                          PKR {l.amountPkr.toLocaleString()}
                        </span>
                        {!l.jobId && (
                          <button
                            type="button"
                            onClick={() => removeEntry(l.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title={bi('Remove manual entry', 'ہٹائیں')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Skills */}
            <div className="lg:col-span-5 rounded-2xl kc-glass-card p-6 space-y-4 h-fit">
              <h3 className="text-base font-bold text-[#17251E]">
                {bi('Recommended Skills to Unlock Next Tier', 'اگلے درجے کے لیے تجویز کردہ مہارتیں')}
              </h3>
              {growth.recommendedSkills.length === 0 ? (
                <p className="text-sm text-[#69726B]">
                  {bi(
                    'All active competencies in your selected category are verified! Keep completing jobs with 5★ customer care.',
                    'آپ کے منتخب شعبے کی تمام فعال مہارتیں تصدیق شدہ ہیں! بہترین کسٹمر سروس جاری رکھیں۔'
                  )}
                </p>
              ) : (
                <div className="space-y-3">
                  {growth.recommendedSkills.map((comp: any) => (
                    <div key={comp.id} className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] p-3.5 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#17251E]">
                          {isUr && comp.urduTitle ? comp.urduTitle : comp.title}
                        </p>
                        <p className="text-xs text-[#69726B] mt-0.5 line-clamp-2">{comp.description}</p>
                      </div>
                      <Link
                        to="/worker/evidence"
                        className="shrink-0 rounded-full bg-[#176B4A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#13563B]"
                      >
                        {bi('Verify →', 'تصدیق ←')}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
