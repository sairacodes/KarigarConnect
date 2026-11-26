import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Briefcase,
  Camera,
  CheckCircle2,
  Copy,
  Flag,
  Lock,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Send,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import { PublicLayout } from '../../components/layouts/PublicLayout';
import { BadgeCard, LoadingSkeleton, ReportModal, formatDate } from '../../components/ui/Components';
import { CityCombobox } from '../../components/ui/CityCombobox';
import { PageTransition } from '../../components/ui/MotionPrimitives';
import { QrPassportCard } from '../../components/ui/QrPassport';
import { RatingDistributionCard, StarRatingInline, TierPill, TrustScoreBadge } from '../../components/ui/RatingDisplay';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api, getApiErrorMessage } from '../../services/api';
import { useI18n } from '../../i18n/translations';

export function PublicPortfolioPage() {
  const { publicId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { bi, lang, isUr } = useI18n();
  const navigate = useNavigate();

  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [shortlisting, setShortlisting] = useState(false);

  const [reportTarget, setReportTarget] = useState<{
    type: 'WORKER_PROFILE' | 'REVIEW';
    id: string;
    label: string;
  } | null>(null);

  const [passportOpen, setPassportOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [reviewStarFilter, setReviewStarFilter] = useState<number>(0);

  // Job booking form state
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobCity, setJobCity] = useState('');
  const [jobArea, setJobArea] = useState('');
  const [jobDate, setJobDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [jobTimeSlot, setJobTimeSlot] = useState('Morning (9 AM - 12 PM)');
  const [jobPhotos, setJobPhotos] = useState<File[]>([]);
  const [submittingJob, setSubmittingJob] = useState(false);

  const loadPortfolio = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/workers/${publicId}`);
      const data = res.data.data;
      setWorker(data);
      setJobCity((prev) => prev || user?.city || data.city || 'Islamabad');
    } catch (err) {
      setError(getApiErrorMessage(err, bi('Unable to load worker portfolio.', 'ہنرمند کا پورٹ فولیو لوڈ نہیں ہو سکا۔')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicId) loadPortfolio();
  }, [publicId, user?.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast(bi('Public portfolio link copied to clipboard.', 'عوامی پورٹ فولیو لنک کاپی ہو گیا ہے۔'), 'success');
  };

  const handleToggleShortlist = async () => {
    if (!worker) return;
    setShortlisting(true);
    try {
      if (worker.isShortlisted) {
        await api.delete(`/employers/shortlists/${worker.id}`);
        setWorker({ ...worker, isShortlisted: false });
        showToast(bi('Removed from your shortlist.', 'شارٹ لسٹ سے ہٹا دیا گیا ہے۔'), 'info');
      } else {
        await api.post('/employers/shortlists', { workerProfileId: worker.id });
        setWorker({ ...worker, isShortlisted: true });
        showToast(bi('Added to your shortlist.', 'شارٹ لسٹ میں شامل کر دیا گیا ہے۔'), 'success');
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setShortlisting(false);
    }
  };

  const handleSendContactRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;
    setSendingRequest(true);
    try {
      await api.post('/employers/contact-requests', {
        workerProfileId: worker.id,
        message,
      });
      setWorker({ ...worker, contactPermissionStatus: 'PENDING' });
      setMessage('');
      showToast(
        bi(
          'Contact request sent. Private details remain hidden until accepted.',
          'رابطے کی درخواست بھیج دی گئی ہے۔ منظوری تک ذاتی تفصیلات پوشیدہ رہیں گی۔'
        ),
        'success'
      );
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleBookJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;
    setSubmittingJob(true);
    try {
      const form = new FormData();
      form.append('workerProfileId', worker.id);
      if (worker.tradeId) form.append('tradeId', worker.tradeId);
      form.append('title', jobTitle);
      form.append('description', jobDesc);
      form.append('city', jobCity);
      form.append('area', jobArea);
      form.append('preferredDate', jobDate);
      form.append('preferredTimeSlot', jobTimeSlot);
      jobPhotos.forEach((f) => form.append('photos', f));

      await api.post('/jobs', form);
      showToast(bi('Job request sent! Track progress in My Jobs.', 'کام کی درخواست بھیج دی گئی! مائی جابز میں دیکھیں۔'), 'success');
      setBookingOpen(false);
      navigate('/employer/jobs');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmittingJob(false);
    }
  };

  const filteredReviews = (worker?.reviews || []).filter((r: any) =>
    reviewStarFilter === 0 ? true : r.overallRating === reviewStarFilter
  );

  return (
    <PublicLayout>
      <PageTransition className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : error || !worker ? (
          <div className="rounded-2xl kc-glass-card p-8 text-center">
            <h1 className="text-xl font-bold text-[#17251E]">
              {bi('Portfolio Unavailable', 'پورٹ فولیو دستیاب نہیں')}
            </h1>
            <p className="mt-2 text-sm text-[#78857D]">{error}</p>
            <Link to="/explore" className="mt-4 inline-block text-sm font-semibold text-[#176B4A] hover:underline">
              {bi('← Back to Explore Workers', '→ ہنرمندوں کی فہرست پر واپس جائیں')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Summary */}
            <div className="rounded-3xl kc-glass-card kc-hover-lift p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#B8E4C7] bg-[#DDF3E4] flex items-center justify-center text-xl font-bold text-[#176B4A]">
                    {worker.avatarUrl ? (
                      <img src={worker.avatarUrl} alt={worker.fullName} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    ) : (
                      worker.fullName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-extrabold text-[#17251E]">{worker.fullName}</h1>
                      {worker.isFemaleProfessional && (
                        <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          {bi('Female Professional · Women-Safe', 'خاتون پروفیشنل · ویمن سیف')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#78857D]">
                      {isUr && worker.tradeUrduName ? worker.tradeUrduName : worker.tradeName}{' '}
                      {!isUr && worker.tradeUrduName ? `(${worker.tradeUrduName})` : ''} ·{' '}
                      <span className="tabular-nums">
                        {worker.yearsExperience} {bi('years experience', 'سال کا تجربہ')}
                      </span>
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-[#78857D]">
                      <MapPin className="h-4 w-4 text-[#399B6B]" />
                      <span>{worker.city}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-xs font-bold text-[#176B4A]">{worker.passportId}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <TierPill tier={worker.tier} underReview={worker.tierUnderReview} tierStatus={worker.tierStatus} />
                      <Link to="/trust-score" title={bi('How Trust Score is calculated', 'ٹرسٹ اسکور کی تفصیل')}>
                        <TrustScoreBadge score={worker.trustScoreBreakdown?.total ?? 0} />
                      </Link>
                      {worker.ratingSummary && (
                        <StarRatingInline rating={worker.ratingSummary.bayesianRating} count={worker.ratingSummary.totalReviews} />
                      )}
                      <span className="text-xs font-semibold text-[#78857D] tabular-nums">
                        · {worker.completedJobsCount || 0} {bi('completed jobs', 'مکمل کام')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {user?.role === 'EMPLOYER' ? (
                    <button
                      type="button"
                      onClick={() => setBookingOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#13563B] shadow-sm"
                    >
                      <Briefcase className="h-3.5 w-3.5" />
                      {bi('Request / Book Job', 'کام کی بکنگ کریں')}
                    </button>
                  ) : !user ? (
                    <Link
                      to="/login/hirer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#13563B]"
                    >
                      <Briefcase className="h-3.5 w-3.5" />
                      {bi('Sign in to Book Job', 'بکنگ کے لیے سائن ان کریں')}
                    </Link>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setPassportOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#B8E4C7] bg-[#DDF3E4]/60 px-4 py-2 text-xs font-semibold text-[#176B4A] hover:bg-[#DDF3E4]"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    {bi('QR Passport', 'کیو آر پاسپورٹ')}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#E5EEE8] bg-[#F7FAF8] px-4 py-2 text-xs font-semibold text-[#17251E] hover:bg-[#DDF3E4]/60"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {bi('Copy Link', 'لنک کاپی کریں')}
                  </button>

                  {user && user.role === 'EMPLOYER' && (
                    <button
                      type="button"
                      onClick={handleToggleShortlist}
                      disabled={shortlisting}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                        worker.isShortlisted
                          ? 'bg-[#176B4A] text-white hover:bg-[#13563B]'
                          : 'border border-[#E5EEE8] bg-white text-[#17251E] hover:bg-[#DDF3E4]/50'
                      }`}
                    >
                      <Star className="h-3.5 w-3.5" />
                      {worker.isShortlisted ? bi('Shortlisted', 'شارٹ لسٹ شدہ') : bi('Shortlist', 'شارٹ لسٹ کریں')}
                    </button>
                  )}

                  {user && user.id !== worker.userId && (
                    <button
                      type="button"
                      onClick={() =>
                        setReportTarget({
                          type: 'WORKER_PROFILE',
                          id: worker.id,
                          label: `${bi('Profile:', 'پروفائل:')} ${worker.fullName}`,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E5EEE8] px-3.5 py-2 text-xs font-medium text-[#78857D] hover:bg-[#F7FAF8] hover:text-[#17251E]"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      {bi('Report', 'رپورٹ کریں')}
                    </button>
                  )}
                </div>
              </div>

              {worker.bio && <p className="mt-5 text-sm sm:text-base text-[#17251E]/85 leading-relaxed">{worker.bio}</p>}

              {worker.skills?.length > 0 && (
                <div className="mt-5 border-t border-[#E5EEE8] pt-4 text-sm text-[#78857D]">
                  <span className="font-semibold text-[#17251E] me-2">{bi('Practical Skills:', 'عملی مہارتیں:')}</span>
                  <span>{worker.skills.join(' · ')}</span>
                </div>
              )}
            </div>

            {/* Fair Price Guide Strip */}
            {worker.priceGuide?.length > 0 && (
              <div className="rounded-2xl kc-glass-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h2 className="text-base font-bold text-[#17251E]">
                      {bi(`Fair Price Guide — ${worker.tradeName}`, `مناسب نرخ نامہ — ${worker.tradeUrduName || worker.tradeName}`)}
                    </h2>
                    <p className="text-xs text-[#78857D]">
                      {bi(
                        'Standard labor estimates in PKR so you know typical rates before booking.',
                        'بکنگ سے پہلے اندازاً مناسب مزدوری جاننے کے لیے معیاری نرخ۔'
                      )}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {worker.priceGuide.map((pg: any) => (
                    <div key={pg.id} className="rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] p-3">
                      <p className="text-xs font-bold text-[#17251E]">
                        {isUr && pg.serviceUrduLabel ? pg.serviceUrduLabel : pg.serviceLabel}
                      </p>
                      <p className="mt-1 font-mono text-sm font-extrabold text-[#176B4A] tabular-nums">
                        PKR {Number(pg.minPkr).toLocaleString()} – {Number(pg.maxPkr).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-[#78857D]">{pg.unit}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact / Privacy Box */}
            <div className="rounded-2xl kc-glass-card p-6">
              <h2 className="text-base font-bold text-[#17251E]">{bi('Contact & Privacy', 'رابطہ اور رازداری')}</h2>
              {worker.contactDetails ? (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-[#176B4A] font-semibold">
                    <Phone className="h-4 w-4 text-[#399B6B]" />
                    <span className="font-mono">{worker.contactDetails.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#176B4A] font-semibold">
                    <Mail className="h-4 w-4 text-[#399B6B]" />
                    <span>{worker.contactDetails.email}</span>
                  </div>
                </div>
              ) : user?.role === 'EMPLOYER' ? (
                worker.contactPermissionStatus === 'PENDING' ? (
                  <p className="mt-2 text-sm text-amber-700 font-medium">
                    {bi(
                      `Contact request sent — waiting for ${worker.fullName} to accept before revealing phone and email.`,
                      `رابطہ کی درخواست بھیج دی گئی ہے — فون اور ای میل دیکھنے کے لیے ${worker.fullName} کی منظوری کا انتظار ہے۔`
                    )}
                  </p>
                ) : worker.contactPermissionStatus === 'DECLINED' ? (
                  <p className="mt-2 text-sm text-[#78857D]">
                    {bi('This worker declined your previous contact request.', 'اس ہنرمند نے آپ کی پچھلی رابطہ درخواست مسترد کر دی ہے۔')}
                  </p>
                ) : (
                  <form onSubmit={handleSendContactRequest} className="mt-3 space-y-3">
                    <p className="text-sm text-[#78857D] flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[#399B6B] shrink-0" />
                      <span>
                        {bi(
                          'Phone number and private email remain hidden until the worker accepts your contact or job request.',
                          'فون نمبر اور ذاتی ای میل اس وقت تک پوشیدہ رہتے ہیں جب تک ہنرمند آپ کی درخواست قبول نہ کرے۔'
                        )}
                      </span>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={bi(
                          'Optional introduction message (site location, project type)...',
                          'تعارفی پیغام (کام کی جگہ، کام کی نوعیت)...'
                        )}
                        className="flex-1 rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3.5 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={sendingRequest}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#176B4A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#13563B] disabled:opacity-60 whitespace-nowrap"
                      >
                        <Send className="h-4 w-4 rtl:-scale-x-100" />
                        <span>
                          {sendingRequest ? bi('Sending...', 'بھیجا جا رہا ہے...') : bi('Send Contact Request', 'رابطہ کی درخواست بھیجیں')}
                        </span>
                      </button>
                    </div>
                  </form>
                )
              ) : (
                <p className="mt-2 text-sm text-[#78857D] flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#399B6B] shrink-0" />
                  <span>
                    {bi('Private phone and email are protected.', 'ذاتی فون اور ای میل محفوظ ہیں۔')}{' '}
                    <Link to="/login/hirer" className="font-semibold text-[#176B4A] hover:underline">
                      {bi('Sign in as a Customer / Employer', 'بطور گاہک / آجِر سائن ان کریں')}
                    </Link>{' '}
                    {bi('to book a job or send a contact request.', 'تاکہ کام کی بکنگ یا رابطے کی درخواست بھیجی جا سکے۔')}
                  </span>
                </p>
              )}
            </div>

            {/* Verified Competency Badges */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-[#17251E]">
                  {bi('Verified Competency Badges', 'تصدیق شدہ مہارتوں کے بیج')} ({worker.verifiedBadges.length})
                </h2>
              </div>
              {worker.verifiedBadges.length === 0 ? (
                <div className="rounded-2xl kc-glass-card p-6 text-sm text-[#78857D]">
                  {bi(
                    'No currently active verified badges yet. Check the competency checklist below to view progress.',
                    'ابھی کوئی فعال تصدیق شدہ بیج موجود نہیں ہے۔ پیش رفت دیکھنے کے لیے نیچے مہارتوں کی فہرست دیکھیں۔'
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {worker.verifiedBadges.map((b: any) => (
                    <BadgeCard key={b.id} {...b} />
                  ))}
                </div>
              )}
            </div>

            {/* Customer-Confirmed Verified Work Proof Gallery */}
            {worker.confirmedWorkProof?.length > 0 && (
              <div className="rounded-2xl kc-glass-card p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#17251E]">
                    {bi('Verified Work Proof (Confirmed by Customer)', 'تصدیق شدہ کام کا ثبوت (صارف سے مصدقہ)')}
                  </h2>
                  <p className="text-xs text-[#78857D]">
                    {bi(
                      'Before and after completion photos confirmed by real customers after job handover.',
                      'کام مکمل ہونے پر صارفین کی جانب سے تصدیق شدہ پہلے اور بعد کی تصاویر۔'
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {worker.confirmedWorkProof.map((wpProof: any) => (
                    <div key={wpProof.jobId} className="rounded-2xl border border-[#E5EEE8] bg-[#F7FAF8] p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-[#17251E]">{wpProof.title}</p>
                          <p className="text-xs text-[#78857D]">
                            {wpProof.area}, {wpProof.city} · {bi('Confirmed by', 'تصدیق کنندہ:')} {wpProof.confirmedByName}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#DDF3E4] px-2 py-0.5 text-[11px] font-bold text-[#176B4A]">
                          <CheckCircle2 className="h-3 w-3" />
                          {bi('Confirmed', 'مصدقہ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {wpProof.beforePhotos?.[0]?.signedUrl && (
                          <div>
                            <p className="text-[10px] font-bold uppercase text-[#78857D] mb-1">{bi('Before', 'پہلے')}</p>
                            <img
                              src={wpProof.beforePhotos[0].signedUrl}
                              alt="Before work"
                              className="h-28 w-full rounded-xl object-cover border border-[#E5EEE8]"
                            />
                          </div>
                        )}
                        {wpProof.afterPhotos?.[0]?.signedUrl && (
                          <div>
                            <p className="text-[10px] font-bold uppercase text-[#176B4A] mb-1">{bi('After', 'بعد میں')}</p>
                            <img
                              src={wpProof.afterPhotos[0].signedUrl}
                              alt="After work"
                              className="h-28 w-full rounded-xl object-cover border border-[#B8E4C7]"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ratings & Verified Hire Reviews */}
            <div className="rounded-2xl kc-glass-card p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-[#17251E]">
                    {bi('Ratings & Verified Hire Reviews', 'درجہ بندی اور تصدیق شدہ صارفین کے تبصرے')}
                  </h2>
                  <p className="text-xs text-[#78857D]">
                    {bi('Only customers who completed a job can submit Verified Hire reviews.', 'صرف مکمل شدہ کاموں کے صارفین ہی ریویو دے سکتے ہیں۔')}
                  </p>
                </div>
                {worker.reviews?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {[0, 5, 4, 3, 2, 1].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewStarFilter(s)}
                        className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                          reviewStarFilter === s
                            ? 'bg-[#176B4A] text-white'
                            : 'border border-[#B8E4C7] bg-[#E8F6EE] text-[#4D6357] hover:text-[#17251E]'
                        }`}
                      >
                        {s === 0 ? bi('All', 'تمام') : `${s}★`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {worker.ratingSummary && <RatingDistributionCard summary={worker.ratingSummary} />}

              {filteredReviews.length === 0 ? (
                <p className="text-sm text-[#78857D]">
                  {bi('No reviews match this filter yet.', 'اس فلٹر کے مطابق ابھی کوئی ریویو موجود نہیں۔')}
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((rev: any) => (
                    <div key={rev.id} className="rounded-2xl border border-[#B8E4C7] bg-[#F2FAF5]/90 p-5 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-[#17251E]">{rev.customerName}</span>
                            <span className="inline-flex items-center gap-1 rounded bg-[#DDF3E4] px-2 py-0.5 text-[10px] font-bold text-[#176B4A]">
                              <CheckCircle2 className="h-3 w-3" />
                              {bi('Verified Hire', 'تصدیق شدہ کام')}
                            </span>
                            <span className="text-xs text-[#78857D]">· {rev.jobTitle}</span>
                          </div>
                          <p className="mt-1 text-xs text-[#78857D]">
                            {rev.jobCity} · {formatDate(rev.createdAt, lang)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-[#17251E]">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                            {rev.overallRating}.0
                          </span>
                          {user && (
                            <button
                              type="button"
                              onClick={() =>
                                setReportTarget({
                                  type: 'REVIEW',
                                  id: rev.id,
                                  label: `${bi('Review by', 'ریویو از')} ${rev.customerName}`,
                                })
                              }
                              className="text-xs text-[#78857D] hover:text-red-700 inline-flex items-center gap-1"
                            >
                              <Flag className="h-3 w-3" />
                              {bi('Report', 'رپورٹ')}
                            </button>
                          )}
                        </div>
                      </div>

                      {rev.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {rev.tags.map((tg: string) => (
                            <span key={tg} className="rounded-md bg-[#DDF3E4] border border-[#B8E4C7] px-2 py-0.5 text-[11px] font-medium text-[#176B4A]">
                              {tg}
                            </span>
                          ))}
                        </div>
                      )}

                      {rev.comment && <p className="text-sm text-[#17251E] leading-relaxed">{rev.comment}</p>}

                      {rev.photos?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {rev.photos.map((p: any) =>
                            p.signedUrl ? (
                              <img
                                key={p.id}
                                src={p.signedUrl}
                                alt={p.originalName}
                                className="h-20 w-24 rounded-xl object-cover border border-[#E5EEE8]"
                              />
                            ) : null
                          )}
                        </div>
                      )}

                      {rev.workerReply && (
                        <div className="rounded-xl border border-[#73C99B] bg-[#DDF3E4]/70 p-3 text-xs">
                          <p className="font-bold text-[#176B4A]">
                            {bi(`Reply from ${worker.fullName}`, `${worker.fullName} کا جواب`)}
                          </p>
                          <p className="mt-1 text-[#17251E]">{rev.workerReply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trade Competency Checklist */}
            {worker.competencies?.length > 0 && (
              <div className="rounded-2xl kc-glass-card p-6">
                <h2 className="text-lg font-bold text-[#17251E]">
                  {isUr
                    ? `${worker.tradeUrduName || worker.tradeName} — مہارتوں کی فہرست`
                    : `${worker.tradeName} Competency Checklist`}
                </h2>
                <div className="mt-4 divide-y divide-[#E5EEE8]">
                  {worker.competencies.map((c: any) => (
                    <div key={c.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#17251E]">
                          {isUr && c.urduTitle ? c.urduTitle : c.title}{' '}
                          {!isUr && c.urduTitle ? <span className="text-[#78857D] font-normal">· {c.urduTitle}</span> : null}
                        </p>
                        <p className="text-xs text-[#78857D]">{c.description}</p>
                      </div>
                      <div className="shrink-0 text-xs font-semibold">
                        {c.verified ? (
                          <span className="inline-flex items-center gap-1.5 text-[#176B4A]">
                            <ShieldCheck className="h-4 w-4 text-[#399B6B]" />
                            {bi('Verified', 'تصدیق شدہ')} ({c.level}) · {bi('Exp', 'میعاد')} {formatDate(c.expiresAt, lang)}
                          </span>
                        ) : (
                          <span className="text-[#78857D]">{bi('Not Verified', 'غیر تصدیق شدہ')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supporting Certificates */}
            {worker.certificates?.length > 0 && (
              <div className="rounded-2xl kc-glass-card p-6">
                <h2 className="text-lg font-bold text-[#17251E]">
                  {bi('Supporting Certificates', 'معاون اسناد و سرٹیفکیٹس')}
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {worker.certificates.map((cert: any, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 text-[#17251E]">
                      <CheckCircle2 className="h-4 w-4 text-[#399B6B] shrink-0" />
                      <span className="font-semibold">{cert.title}</span>
                      <span className="text-[#78857D]">· {cert.issuer} ({cert.year})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* QR Karigar Passport Modal */}
        {worker && passportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251E]/50 backdrop-blur-[2px] p-4">
            <div className="w-full max-w-2xl rounded-3xl border border-[#B8E4C7] bg-[#F2FAF5] p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-[#17251E]">
                  {bi('Karigar Passport & Verification QR', 'کاریگر پاسپورٹ اور تصدیقی کیو آر')}
                </h3>
                <button type="button" onClick={() => setPassportOpen(false)} className="text-[#78857D] hover:text-[#17251E]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <QrPassportCard
                workerName={worker.fullName}
                city={worker.city}
                tradeName={isUr && worker.tradeUrduName ? worker.tradeUrduName : worker.tradeName}
                passportId={worker.passportId}
                publicId={worker.publicId}
                tier={worker.tier}
                trustScore={worker.trustScoreBreakdown?.total ?? 0}
                verifiedCount={worker.verifiedBadges?.length || 0}
                completedJobsCount={worker.completedJobsCount || 0}
                rating={worker.ratingSummary?.bayesianRating || 0}
                totalReviews={worker.ratingSummary?.totalReviews || 0}
              />
            </div>
          </div>
        )}

        {/* Request / Book Job Modal */}
        {worker && bookingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251E]/50 backdrop-blur-[2px] p-4 overflow-y-auto">
            <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl space-y-4 my-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-[#17251E]">
                    {bi(`Book Job with ${worker.fullName}`, `${worker.fullName} کے ساتھ کام کی بکنگ`)}
                  </h3>
                  <p className="text-xs text-[#78857D]">
                    {bi('Phone & email remain private until the worker accepts and submits a PKR quote.', 'منظوری اور قیمت موصول ہونے تک رابطہ نمبر پوشیدہ رہتا ہے۔')}
                  </p>
                </div>
                <button type="button" onClick={() => setBookingOpen(false)} className="text-[#78857D] hover:text-[#17251E]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {worker.priceGuide?.length > 0 && (
                <div className="rounded-xl border border-[#B8E4C7] bg-[#F7FAF8] p-3 text-xs">
                  <p className="font-bold text-[#176B4A] mb-1">{bi('Reference Fair Price Guide (PKR):', 'حوالہ جاتی مناسب نرخ (روپے):')}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[#17251E]">
                    {worker.priceGuide.map((pg: any) => (
                      <span key={pg.id}>
                        {isUr && pg.serviceUrduLabel ? pg.serviceUrduLabel : pg.serviceLabel}:{' '}
                        <strong className="font-mono">
                          PKR {pg.minPkr.toLocaleString()}–{pg.maxPkr.toLocaleString()}
                        </strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleBookJob} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#17251E] mb-1">
                    {bi('Job Title', 'کام کا عنوان')}
                  </label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder={bi('e.g. Split AC Master Service / Breaker Check', 'مثلاً سپلیٹ اے سی سروس / بریکر مرمت')}
                    className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17251E] mb-1">
                    {bi('Problem Details', 'مسئلے کی تفصیل')}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder={bi('Describe the fault, model/size, and site notes...', 'خرابی اور کام کی جگہ کی تفصیل لکھیں...')}
                    className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#17251E] mb-1">{bi('City', 'شہر')}</label>
                    <CityCombobox value={jobCity} onChange={setJobCity} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#17251E] mb-1">
                      {bi('Area / Sector / Neighbourhood', 'علاقہ / سیکٹر / محلہ')}
                    </label>
                    <input
                      type="text"
                      required
                      value={jobArea}
                      onChange={(e) => setJobArea(e.target.value)}
                      placeholder={bi('e.g. G-10/4, DHA Phase 5, Gulshan', 'مثلاً جی-۱۰، ڈی ایچ اے، گلشن')}
                      className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#17251E] mb-1">{bi('Preferred Date', 'موزوں تاریخ')}</label>
                    <input
                      type="date"
                      value={jobDate}
                      onChange={(e) => setJobDate(e.target.value)}
                      className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#17251E] mb-1">{bi('Preferred Time Slot', 'موزوں وقت')}</label>
                    <select
                      value={jobTimeSlot}
                      onChange={(e) => setJobTimeSlot(e.target.value)}
                      className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
                    >
                      <option value="Morning (9 AM - 12 PM)">{bi('Morning (9 AM - 12 PM)', 'صبح (۹ تا ۱۲)')}</option>
                      <option value="Afternoon (12 PM - 4 PM)">{bi('Afternoon (12 PM - 4 PM)', 'دوپہر (۱۲ تا ۴)')}</option>
                      <option value="Evening (4 PM - 8 PM)">{bi('Evening (4 PM - 8 PM)', 'شام (۴ تا ۸)')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3.5 py-2 text-xs font-semibold text-[#17251E] cursor-pointer">
                    <Camera className="h-4 w-4 text-[#176B4A]" />
                    <span>
                      {jobPhotos.length > 0
                        ? bi(`${jobPhotos.length} photo(s) attached`, `${jobPhotos.length} تصویر منتخب`)
                        : bi('Attach Problem Photos (Optional)', 'مسئلے کی تصاویر شامل کریں (اختیاری)')}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => setJobPhotos(Array.from(e.target.files || []).slice(0, 4))}
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingOpen(false)}
                    className="rounded-xl border border-[#E5EEE8] px-4 py-2 text-xs font-semibold text-[#17251E]"
                  >
                    {bi('Cancel', 'منسوخ')}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingJob}
                    className="rounded-xl bg-[#176B4A] px-5 py-2 text-xs font-bold text-white hover:bg-[#13563B] disabled:opacity-60"
                  >
                    {submittingJob ? bi('Sending...', 'بھیجا جا رہا ہے...') : bi('Send Job Request', 'درخواست بھیجیں')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {reportTarget && (
          <ReportModal
            open={Boolean(reportTarget)}
            targetType={reportTarget.type}
            targetId={reportTarget.id}
            targetLabel={reportTarget.label}
            onClose={() => setReportTarget(null)}
          />
        )}
      </PageTransition>
    </PublicLayout>
  );
}
