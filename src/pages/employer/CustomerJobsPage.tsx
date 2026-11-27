import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  Camera,
  CheckCircle2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Scale,
  Search,
  Share2,
  ShieldAlert,
  Star,
  X,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { EmptyState, LoadingSkeleton, StatusLabel, formatDate } from '../../components/ui/Components';
import { TierPill } from '../../components/ui/RatingDisplay';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../i18n/translations';
import { api, getApiErrorMessage } from '../../services/api';

const REVIEW_TAG_OPTIONS: Array<{ en: string; ur: string }> = [
  { en: 'On-time', ur: 'وقت کا پابند' },
  { en: 'Fair pricing', ur: 'مناسب قیمت' },
  { en: 'Clean work', ur: 'صاف ستھرا کام' },
  { en: 'Explained problem clearly', ur: 'مسئلہ واضح سمجھایا' },
  { en: 'Safety conscious', ur: 'حفاظت کا خیال' },
  { en: 'Polite', ur: 'خوش اخلاق' },
];

export function CustomerJobsPage() {
  const { bi, lang, isUr } = useI18n();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  // Review modal state
  const [reviewJob, setReviewJob] = useState<any>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [overallRating, setOverallRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [behaviourRating, setBehaviourRating] = useState(5);
  const [valueRating, setValueRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['On-time', 'Clean work']);
  const [comment, setComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Guarantee Dispute modal
  const [disputeJob, setDisputeJob] = useState<any>(null);
  const [disputeReason, setDisputeReason] = useState('Work issue returned within 7 days');
  const [disputeDetails, setDisputeDetails] = useState('');

  // SOS modal
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
    if (tab === 'ACTIVE') {
      return jobs.filter((j) => ['REQUESTED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'DISPUTED'].includes(j.status));
    }
    if (tab === 'COMPLETED') {
      return jobs.filter((j) => ['COMPLETED', 'CANCELLED'].includes(j.status));
    }
    return jobs;
  }, [jobs, tab]);

  const handleConfirmProof = async (jobId: string) => {
    try {
      await api.patch(`/jobs/${jobId}/confirm`);
      showToast(bi('Completion & work proof confirmed!', 'کام کی تکمیل اور ثبوت کی تصدیق ہو گئی!'), 'success');
      loadJobs();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await api.patch(`/jobs/${jobId}/cancel`, { reason: 'Cancelled by customer' });
      showToast(bi('Job cancelled.', 'کام منسوخ کر دیا گیا۔'), 'info');
      loadJobs();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const openReviewModal = (job: any, existing?: any) => {
    setReviewJob(job);
    if (existing) {
      setEditingReviewId(existing.id);
      setOverallRating(existing.overallRating);
      setQualityRating(existing.qualityRating);
      setPunctualityRating(existing.punctualityRating);
      setBehaviourRating(existing.behaviourRating);
      setValueRating(existing.valueRating);
      setSelectedTags(existing.tags || []);
      setComment(existing.comment || '');
    } else {
      setEditingReviewId(null);
      setOverallRating(5);
      setQualityRating(5);
      setPunctualityRating(5);
      setBehaviourRating(5);
      setValueRating(5);
      setSelectedTags(['On-time', 'Clean work']);
      setComment('');
      setReviewPhotos([]);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewJob) return;
    setSubmitting(true);
    try {
      if (editingReviewId) {
        await api.put(`/reviews/${editingReviewId}`, {
          overallRating,
          qualityRating,
          punctualityRating,
          behaviourRating,
          valueRating,
          tags: selectedTags,
          comment,
        });
        showToast(bi('Review updated within 48-hour window.', 'ریویو ۴۸ گھنٹوں کی مدت میں اپ ڈیٹ ہو گیا۔'), 'success');
      } else {
        const fd = new FormData();
        fd.append('jobId', reviewJob.id);
        fd.append('overallRating', String(overallRating));
        fd.append('qualityRating', String(qualityRating));
        fd.append('punctualityRating', String(punctualityRating));
        fd.append('behaviourRating', String(behaviourRating));
        fd.append('valueRating', String(valueRating));
        fd.append('tags', JSON.stringify(selectedTags));
        fd.append('comment', comment);
        reviewPhotos.forEach((f) => fd.append('photos', f));
        await api.post('/reviews', fd);
        showToast(bi('Verified Hire review published!', 'تصدیق شدہ ریویو شائع ہو گیا!'), 'success');
      }
      setReviewJob(null);
      loadJobs();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const submitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeJob) return;
    setSubmitting(true);
    try {
      await api.post('/disputes', {
        jobId: disputeJob.id,
        reason: disputeReason,
        details: disputeDetails,
      });
      showToast(
        bi('7-day Karigar Guarantee rework request submitted.', '۷ روزہ کاریگر گارنٹی دوبارہ کام کی درخواست جمع ہو گئی۔'),
        'success'
      );
      setDisputeJob(null);
      setDisputeDetails('');
      loadJobs();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const submitSos = async (e: React.FormEvent) => {
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

  const shareWithTrustedContact = async (job: any) => {
    const text = `Karigar Connect Safe Visit | Worker: ${job.workerName} (${job.tradeName}) | Profile: ${window.location.origin}/workers/${job.workerPublicId} | Time: ${job.scheduledDateTime || job.preferredDate} | Location: ${job.area}, ${job.city}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast(bi('Job visit details copied for sharing with a trusted family contact!', 'معتمد رابطے کو بھیجنے کے لیے وزٹ کی تفصیل کاپی ہو گئی!'), 'success');
    } catch {
      showToast(text, 'info');
    }
  };

  return (
    <DashboardLayout title={bi('My Jobs & Bookings', 'میرے کام اور بکنگز')}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL' as const, label: bi(`All (${jobs.length})`, `تمام (${jobs.length})`) },
              {
                id: 'ACTIVE' as const,
                label: bi(
                  `Active / Pending (${jobs.filter((j) => ['REQUESTED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'DISPUTED'].includes(j.status)).length})`,
                  `فعال / زیرِ التواء (${jobs.filter((j) => ['REQUESTED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'DISPUTED'].includes(j.status)).length})`
                ),
              },
              {
                id: 'COMPLETED' as const,
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

          <Link
            to="/employer/search"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B]"
          >
            <Search className="h-3.5 w-3.5" />
            {bi('Book Another Worker', 'نیا ہنرمند بک کریں')}
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={bi('No jobs booked yet', 'ابھی کوئی کام بک نہیں کیا گیا')}
            description={bi(
              'Explore verified pros to book a skilled worker with Fair Price Guide transparency and 7-day Guarantee protection.',
              'مناسب نرخ نامے اور ۷ روزہ گارنٹی کے ساتھ تصدیق شدہ ہنرمند بک کرنے کے لیے تلاش کریں۔'
            )}
            action={
              <Link to="/employer/search" className="rounded-full bg-[#176B4A] px-5 py-2.5 text-sm font-semibold text-white">
                {bi('Search Verified Workers', 'ہنرمند تلاش کریں')}
              </Link>
            }
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
                      <TierPill tier={job.workerTier} compact />
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
                            ? bi('Fair Price Guide Match', 'مناسب نرخ نامے کے مطابق')
                            : job.priceStatus === 'BELOW_GUIDE'
                              ? bi('Below Price Guide', 'نرخ نامے سے کم')
                              : bi('Above Price Guide', 'نرخ نامے سے زیادہ')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#69726B]">
                      <Link
                        to={`/employer/workers/${job.workerPublicId}`}
                        className="font-bold text-[#176B4A] hover:underline"
                      >
                        {job.workerName}
                      </Link>{' '}
                      · {isUr && job.tradeUrduName ? job.tradeUrduName : job.tradeName} ·{' '}
                      <MapPin className="inline h-3.5 w-3.5 text-[#399B6B]" /> {job.area}, {job.city}
                    </p>
                  </div>

                  <div className="text-xs sm:text-end space-y-1">
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

                <p className="text-sm text-[#17251E]">{job.description}</p>
                {job.workerNotes && (
                  <p className="text-xs text-[#69726B] bg-[#F7F4EC] rounded-xl p-2.5 border border-[#E6E0D2]">
                    <strong className="text-[#17251E]">{bi('Worker Quote Note:', 'ہنرمند کا نوٹ:')}</strong> {job.workerNotes}
                  </p>
                )}

                {/* Photos */}
                {(job.problemPhotos?.length > 0 || job.beforePhotos?.length > 0 || job.afterPhotos?.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {job.problemPhotos?.length > 0 && (
                      <div className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] p-3">
                        <p className="text-[11px] font-bold text-[#69726B] mb-2">{bi('Your Problem Photos', 'آپ کی تصاویر')}</p>
                        <div className="flex flex-wrap gap-2">
                          {job.problemPhotos.map((p: any) => (
                            <img key={p.id} src={p.signedUrl} alt={p.originalName} className="h-16 w-16 rounded-lg object-cover border border-[#E6E0D2]" />
                          ))}
                        </div>
                      </div>
                    )}
                    {job.beforePhotos?.length > 0 && (
                      <div className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] p-3">
                        <p className="text-[11px] font-bold text-[#69726B] mb-2">{bi('Before Work', 'کام سے پہلے')}</p>
                        <div className="flex flex-wrap gap-2">
                          {job.beforePhotos.map((p: any) => (
                            <img key={p.id} src={p.signedUrl} alt={p.originalName} className="h-16 w-16 rounded-lg object-cover border border-[#E6E0D2]" />
                          ))}
                        </div>
                      </div>
                    )}
                    {job.afterPhotos?.length > 0 && (
                      <div className="rounded-xl border border-[#D8D0BE] bg-[#ECE6D7]/35 p-3">
                        <p className="text-[11px] font-bold text-[#176B4A] mb-2">{bi('After Work Proof', 'کام کے بعد ثبوت')}</p>
                        <div className="flex flex-wrap gap-2">
                          {job.afterPhotos.map((p: any) => (
                            <img key={p.id} src={p.signedUrl} alt={p.originalName} className="h-16 w-16 rounded-lg object-cover border border-[#D8D0BE]" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Worker Contact Gating */}
                {job.contactUnlocked && job.workerContact ? (
                  <div className="rounded-xl border border-[#C9973A] bg-[#ECE6D7]/55 p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-[#176B4A]">
                    <div className="flex flex-wrap gap-5">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        <span className="font-mono">{job.workerContact.phone}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{job.workerContact.email}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => shareWithTrustedContact(job)}
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-[#176B4A] border border-[#D8D0BE] hover:bg-[#F7F4EC]"
                    >
                      <Share2 className="h-3 w-3" />
                      {bi('Share with Trusted Contact', 'معتمد رابطے کو تفصیل بھیجیں')}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-[#69726B] flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-[#399B6B]" />
                    <span>
                      {bi(
                        'Worker phone and email unlock once they accept your job request.',
                        'ہنرمند کے کام قبول کرنے پر فون اور ای میل کھل جائیں گے۔'
                      )}
                    </span>
                  </p>
                )}

                {/* Existing Review summary */}
                {job.review && (
                  <div className="rounded-xl border border-[#D8D0BE] bg-[#F7F4EC] p-3.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#176B4A]">
                        {bi('Your Verified Hire Review:', 'آپ کا تصدیق شدہ ریویو:')} {job.review.overallRating}★
                      </span>
                      {job.review.canEdit && (
                        <button
                          type="button"
                          onClick={() => openReviewModal(job, job.review)}
                          className="font-semibold text-[#176B4A] hover:underline"
                        >
                          {bi('Edit (within 48h)', 'ترمیم (۴۸ گھنٹے کے اندر)')}
                        </button>
                      )}
                    </div>
                    {job.review.comment && <p className="text-[#17251E]">{job.review.comment}</p>}
                  </div>
                )}

                {/* Guarantee Dispute */}
                {job.dispute && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-3.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 font-bold text-orange-900">
                        <Scale className="h-3.5 w-3.5" />
                        {bi('7-Day Karigar Guarantee Request:', '۷ روزہ گارنٹی درخواست:')} {job.dispute.reason}
                      </span>
                      <StatusLabel status={job.dispute.status} />
                    </div>
                    <p className="text-[#17251E]">{job.dispute.details}</p>
                    {job.dispute.workerResponse && (
                      <p className="text-[#176B4A]">
                        <strong>{bi('Worker Response:', 'ہنرمند کا جواب:')}</strong> {job.dispute.workerResponse}
                      </p>
                    )}
                    {job.dispute.adminResolutionNotes && (
                      <p className="text-[#69726B]">
                        <strong>{bi('Admin Resolution:', 'ایڈمن فیصلہ:')}</strong> {job.dispute.adminResolutionNotes}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Row */}
                <div className="border-t border-[#E6E0D2] pt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    {['REQUESTED', 'ACCEPTED', 'SCHEDULED'].includes(job.status) && (
                      <button
                        type="button"
                        onClick={() => handleCancelJob(job.id)}
                        className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        {bi('Cancel Job', 'منسوخ کریں')}
                      </button>
                    )}

                    {job.status === 'COMPLETED' && !job.customerConfirmedProof && (
                      <button
                        type="button"
                        onClick={() => handleConfirmProof(job.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#C9973A] bg-[#ECE6D7]/75 px-4 py-1.5 text-xs font-semibold text-[#176B4A] hover:bg-[#ECE6D7]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {bi('Confirm Completion & Proof', 'تکمیل اور ثبوت کی تصدیق کریں')}
                      </button>
                    )}

                    {job.status === 'COMPLETED' && !job.review && (
                      <button
                        type="button"
                        onClick={() => openReviewModal(job)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#13563B]"
                      >
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {bi('Rate & Review Worker', 'ریٹنگ اور ریویو دیں')}
                      </button>
                    )}

                    {job.canOpenGuaranteeDispute && (
                      <button
                        type="button"
                        onClick={() => setDisputeJob(job)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-4 py-1.5 text-xs font-semibold text-orange-900 hover:bg-orange-100"
                      >
                        <Scale className="h-3.5 w-3.5" />
                        {bi('7-Day Guarantee Rework', '۷ روزہ گارنٹی دوبارہ کام')}
                      </button>
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

      {/* Review Modal */}
      {reviewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251E]/45 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#E6E0D2] bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#17251E]">
                  {editingReviewId
                    ? bi('Edit Verified Hire Review', 'تصدیق شدہ ریویو میں ترمیم')
                    : bi(`Rate ${reviewJob.workerName}`, `${reviewJob.workerName} کی کارکردگی کی درجہ بندی`)}
                </h3>
                <p className="text-xs text-[#69726B]">{reviewJob.title}</p>
              </div>
              <button type="button" onClick={() => setReviewJob(null)} className="text-[#69726B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17251E] mb-1.5">
                  {bi('Overall Rating (1–5 Stars)', 'مجموعی ریٹنگ (۱ تا ۵ ستارے)')}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setOverallRating(s)}
                      className={`flex-1 rounded-xl border py-2 text-sm font-bold flex items-center justify-center gap-1 ${
                        overallRating >= s
                          ? 'border-amber-300 bg-amber-50 text-amber-800'
                          : 'border-[#E6E0D2] bg-[#F7F4EC] text-[#69726B]'
                      }`}
                    >
                      <Star className={`h-4 w-4 ${overallRating >= s ? 'fill-amber-400 text-amber-500' : ''}`} />
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: bi('Quality of Work', 'کام کا معیار'), val: qualityRating, set: setQualityRating },
                  { label: bi('Punctuality', 'وقت کی پابندی'), val: punctualityRating, set: setPunctualityRating },
                  { label: bi('Behaviour', 'رویہ اور اخلاق'), val: behaviourRating, set: setBehaviourRating },
                  { label: bi('Value for Money', 'مناسب قیمت'), val: valueRating, set: setValueRating },
                ].map((sub) => (
                  <div key={String(sub.label)} className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] p-2.5">
                    <div className="flex justify-between font-semibold text-[#17251E] mb-1">
                      <span>{sub.label}</span>
                      <span>{sub.val}★</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={sub.val}
                      onChange={(e) => sub.set(Number(e.target.value))}
                      className="w-full accent-[#176B4A]"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17251E] mb-1.5">
                  {bi('Quick Tags', 'فوری ٹیگز')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {REVIEW_TAG_OPTIONS.map((tag) => {
                    const checked = selectedTags.includes(tag.en);
                    return (
                      <button
                        key={tag.en}
                        type="button"
                        onClick={() =>
                          setSelectedTags((prev) =>
                            checked ? prev.filter((x) => x !== tag.en) : [...prev, tag.en]
                          )
                        }
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                          checked
                            ? 'border-[#176B4A] bg-[#ECE6D7] text-[#176B4A]'
                            : 'border-[#E6E0D2] bg-[#F7F4EC] text-[#69726B]'
                        }`}
                      >
                        {isUr ? tag.ur : tag.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17251E] mb-1">
                  {bi('Written Review (Optional)', 'تحریری تبصرہ (اختیاری)')}
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={bi('Share how the job went for future homeowners...', 'آئندہ گاہکوں کے لیے اپنا تجربہ بیان کریں...')}
                  className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm"
                />
              </div>

              {!editingReviewId && (
                <div className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] p-3">
                  <label className="block text-xs font-semibold text-[#17251E] mb-1">
                    <Camera className="inline h-3.5 w-3.5 me-1" />
                    {bi('Completed Work Photos (Optional)', 'مکمل کام کی تصاویر (اختیاری)')}
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => setReviewPhotos(Array.from(e.target.files || []))}
                    className="w-full text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReviewJob(null)} className="rounded-xl border px-4 py-2 text-xs font-semibold">
                  {bi('Cancel', 'منسوخ')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#176B4A] px-5 py-2 text-xs font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
                >
                  {submitting ? bi('Saving...', 'محفوظ ہو رہا ہے...') : bi('Publish Verified Review', 'ریویو شائع کریں')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guarantee Dispute Modal */}
      {disputeJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251E]/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#E6E0D2] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#17251E]">
                  {bi('7-Day Karigar Guarantee Request', '۷ روزہ کاریگر گارنٹی درخواست')}
                </h3>
                <p className="text-xs text-[#69726B]">{disputeJob.title}</p>
              </div>
              <button type="button" onClick={() => setDisputeJob(null)} className="text-[#69726B]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitDispute} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#17251E] mb-1">{bi('Reason', 'وجہ')}</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm"
                >
                  <option value="Work issue returned within 7 days">{bi('Work issue returned within 7 days', '۷ دن میں دوبارہ خرابی آ گئی')}</option>
                  <option value="Incomplete workmanship or unfinished finish">{bi('Incomplete workmanship or unfinished finish', 'ادھورا یا غیر معیاری کام')}</option>
                  <option value="Price charged exceeded agreed quote">{bi('Price charged exceeded agreed quote', 'طے شدہ قیمت سے زیادہ وصول کیا گیا')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#17251E] mb-1">{bi('Details for Worker & Admin', 'تفصیلات')}</label>
                <textarea
                  rows={3}
                  required
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  placeholder={bi('Describe the rework needed...', 'مطلوبہ دوبارہ کام کی تفصیل لکھیں...')}
                  className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setDisputeJob(null)} className="rounded-xl border px-4 py-2 text-xs font-semibold">
                  {bi('Cancel', 'منسوخ')}
                </button>
                <button type="submit" disabled={submitting} className="rounded-xl bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white">
                  {bi('Submit Request', 'درخواست جمع کریں')}
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
            <form onSubmit={submitSos} className="space-y-3">
              <textarea
                rows={3}
                required
                value={sosDetails}
                onChange={(e) => setSosDetails(e.target.value)}
                placeholder={bi('Describe the urgent safety or misconduct concern...', 'ہنگامی حفاظتی مسئلہ بیان کریں...')}
                className="w-full rounded-xl border border-red-200 bg-red-50/40 px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSosJob(null)} className="rounded-xl border px-4 py-2 text-xs font-semibold">
                  {bi('Cancel', 'منسوخ')}
                </button>
                <button type="submit" disabled={submitting} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white">
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
