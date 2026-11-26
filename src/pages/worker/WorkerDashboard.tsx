import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BarChart3,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FolderUp,
  Grid,
  MessageSquare,
  Send,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { LoadingSkeleton, formatDate } from '../../components/ui/Components';
import {
  AnimatedBarChart,
  BarDatum,
  SemiCircleGauge,
  StatKpiCard,
} from '../../components/ui/DataViz';
import { StarRatingInline, TierPill, TrustScoreBadge } from '../../components/ui/RatingDisplay';
import { useToast } from '../../context/ToastContext';
import { api, getApiErrorMessage } from '../../services/api';
import { useI18n } from '../../i18n/translations';

export function WorkerDashboard() {
  const { bi, lang, isUr, tierText } = useI18n();
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  const loadDashboard = () => {
    setLoading(true);
    Promise.all([api.get('/workers/me'), api.get('/workers/me/competencies')])
      .then(([meRes, compRes]) => {
        setData(meRes.data.data);
        setCompetencies(compRes.data.data?.competencies || []);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const copyPortfolio = () => {
    if (!data?.publicId) return;
    const url = `${window.location.origin}/workers/${data.publicId}`;
    navigator.clipboard.writeText(url);
    showToast(bi('Public portfolio link copied.', 'عوامی پورٹ فولیو لنک کاپی ہو گیا۔'), 'success');
  };

  const submitReviewReply = async (reviewId: string) => {
    const reply = (replyDrafts[reviewId] || '').trim();
    if (reply.length < 3) {
      showToast(bi('Enter at least 3 characters for your reply.', 'جواب کم از کم ۳ حروف کا ہونا چاہیے۔'), 'error');
      return;
    }
    setReplyingId(reviewId);
    try {
      await api.post(`/reviews/${reviewId}/reply`, { reply });
      showToast(bi('Public reply posted.', 'عوامی جواب شائع ہو گیا۔'), 'success');
      setReplyDrafts((prev) => ({ ...prev, [reviewId]: '' }));
      loadDashboard();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setReplyingId(null);
    }
  };

  const countByStatus = (statuses: string[]) =>
    competencies.filter((c) => statuses.includes((c.matrixStatus || '').toUpperCase())).length;

  const matrixChartData: BarDatum[] = [
    { label: bi('Verified', 'تصدیق شدہ'), shortLabel: bi('Ver', 'تصدیق'), value: countByStatus(['VERIFIED']), variant: 'dark' },
    { label: bi('Under Review', 'زیرِ جائزہ'), shortLabel: bi('Rev', 'جائزہ'), value: countByStatus(['UNDER_REVIEW', 'PENDING']), variant: 'medium' },
    { label: bi('Evidence Added', 'ثبوت شامل'), shortLabel: bi('Evid', 'ثبوت'), value: countByStatus(['EVIDENCE_ADDED']), variant: 'light' },
    { label: bi('Needs Evidence', 'ثبوت درکار'), shortLabel: bi('Need', 'درکار'), value: countByStatus(['NEEDS_MORE_EVIDENCE']), variant: 'hatched' },
    { label: bi('Not Started', 'شروع نہیں'), shortLabel: bi('Open', 'کھلا'), value: countByStatus(['NOT_STARTED', 'NOT_VERIFIED', 'EXPIRED']), variant: 'hatched' },
  ];

  const tradeDisplay = data?.tradeName
    ? isUr && data.tradeUrduName
      ? `${data.tradeUrduName} (${data.tradeName})`
      : `${data.tradeName}${data.tradeUrduName ? ` (${data.tradeUrduName})` : ''}`
    : bi('Not selected yet', 'ابھی منتخب نہیں');

  const tp = data?.tierProgress;
  const ratingSummary = data?.ratingSummary;

  return (
    <DashboardLayout title={bi('Worker Dashboard', 'ورکر ڈیش بورڈ')}>
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : error || !data ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : (
        <div className="space-y-6">
          {/* Welcome Header & Badges */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#17251E]">
                  {bi(`Welcome back, ${data.fullName}`, `خوش آمدید، ${data.fullName}`)}
                </h2>
                <TierPill
                  tier={data.tier}
                  underReview={data.tierUnderReview}
                  tierStatus={data.tierStatus}
                />
                <Link to="/trust-score" title={bi('View Trust Score Guide', 'ٹرسٹ اسکور گائیڈ دیکھیں')}>
                  <TrustScoreBadge score={data.trustScoreBreakdown?.total ?? 0} />
                </Link>
              </div>
              <p className="mt-1.5 text-sm text-[#78857D] flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  {bi('Primary Category:', 'بنیادی شعبہ:')}{' '}
                  <span className="font-semibold text-[#17251E]">{tradeDisplay}</span> · {data.city}
                </span>
                <span className="font-mono text-xs bg-[#F7FAF8] border border-[#E5EEE8] px-2 py-0.5 rounded-md text-[#176B4A]">
                  {data.passportId}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/worker/jobs"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#13563B] transition-colors whitespace-nowrap"
              >
                <Briefcase className="h-3.5 w-3.5" />
                {bi('My Jobs', 'میرے کام')}
                {(data.stats?.pendingJobRequestsCount || 0) > 0 && (
                  <span className="ms-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-[#17251E]">
                    {data.stats.pendingJobRequestsCount}
                  </span>
                )}
              </Link>
              <Link
                to="/worker/evidence"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#B8E4C7] bg-[#DDF3E4]/65 px-4 py-2.5 text-xs font-semibold text-[#176B4A] hover:bg-[#DDF3E4] transition-colors whitespace-nowrap"
              >
                <FolderUp className="h-3.5 w-3.5" />
                {bi('Upload Evidence', 'ثبوت اپ لوڈ کریں')}
              </Link>
              <button
                type="button"
                onClick={copyPortfolio}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E5EEE8] kc-glass-card px-4 py-2.5 text-xs font-semibold text-[#17251E] hover:bg-[#DDF3E4]/50 transition-colors whitespace-nowrap"
              >
                <Copy className="h-3.5 w-3.5 text-[#176B4A]" />
                {bi('Copy Link', 'لنک کاپی')}
              </button>
              <Link
                to={`/workers/${data.publicId}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E5EEE8] kc-glass-card px-4 py-2.5 text-xs font-semibold text-[#17251E] hover:bg-[#DDF3E4]/50 transition-colors whitespace-nowrap"
              >
                <ExternalLink className="h-3.5 w-3.5 text-[#176B4A]" />
                {bi('Public Portfolio', 'عوامی پورٹ فولیو')}
              </Link>
              <Link
                to="/worker/insights"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#B8E4C7] bg-[#EAF7F0] px-4 py-2.5 text-xs font-bold text-[#11221B] hover:bg-[#DDF3E4] transition-colors whitespace-nowrap"
              >
                <BarChart3 className="h-3.5 w-3.5 text-[#176B4A]" />
                {bi('Skill Demand Insights', 'اسکل ڈیمانڈ بصیرت')}
              </Link>
            </div>
          </div>

          {data.tierUnderReview && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3 text-sm text-amber-900">
              <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {bi('Karigar Tier Under Review', 'کاریگر درجہ زیرِ جائزہ ہے')}
                </p>
                <p className="text-xs mt-0.5">
                  {bi(
                    'Your tier status is temporarily under review due to a rating change or upheld guarantee dispute. Maintain high customer quality and resolve open feedback.',
                    'کسٹمر ریٹنگ میں کمی یا حل شدہ تنازع کی وجہ سے آپ کا درجہ عارضی طور پر زیرِ جائزہ ہے۔ معیار برقرار رکھیں۔'
                  )}
                </p>
              </div>
            </div>
          )}

          {/* 4-Card KPI Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatKpiCard
              highlighted
              label={bi('Verified Competencies', 'تصدیق شدہ مہارتیں')}
              value={data.stats.verifiedCompetencies}
              sublabel={bi(
                `Out of ${data.stats.totalCompetencies} trade skills`,
                `کل ${data.stats.totalCompetencies} مہارتوں میں سے`
              )}
              icon={CheckCircle2}
              to="/worker/badges"
            />
            <StatKpiCard
              label={bi('Job Requests & Active', 'کام کی درخواستیں اور فعال کام')}
              value={(data.stats.pendingJobRequestsCount || 0) + (data.stats.activeJobsCount || 0)}
              sublabel={bi(
                `${data.stats.pendingJobRequestsCount || 0} pending · ${data.stats.completedJobsCount || 0} completed`,
                `${data.stats.pendingJobRequestsCount || 0} نئی · ${data.stats.completedJobsCount || 0} مکمل`
              )}
              icon={Briefcase}
              to="/worker/jobs"
            />
            <StatKpiCard
              label={bi('Pending Assessments', 'زیرِ التواء جائزے')}
              value={data.stats.pendingAssessments}
              sublabel={bi('In assessor review queue', 'ماہرین کے جائزے کی قطار میں')}
              icon={ClipboardCheck}
              to="/worker/assessments"
            />
            <StatKpiCard
              label={bi('Karigar Trust Score', 'کاریگر ٹرسٹ اسکور')}
              value={`${data.trustScoreBreakdown?.total ?? 0}/100`}
              sublabel={
                ratingSummary?.totalReviews > 0
                  ? bi(
                      `${ratingSummary.bayesianRating.toFixed(1)}★ across ${ratingSummary.totalReviews} verified reviews`,
                      `${ratingSummary.totalReviews} تصدیق شدہ ریویوز میں ${ratingSummary.bayesianRating.toFixed(1)}★`
                    )
                  : bi('Complete jobs to build trust score', 'ٹرسٹ اسکور بڑھانے کے لیے کام مکمل کریں')
              }
              icon={TrendingUp}
              to="/worker/growth"
            />
          </div>

          {/* Next Tier Progress + Trust Breakdown */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7 rounded-2xl kc-glass-card p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#17251E]">
                    {bi('Next Karigar Tier Progress', 'اگلے کاریگر درجے کی پیش رفت')}
                  </h3>
                  <p className="text-xs text-[#78857D] mt-0.5">
                    {tp?.nextTier
                      ? bi(
                          `Working toward ${tierText(tp.nextTier)} Tier`,
                          `${tierText(tp.nextTier)} درجے کی جانب پیش رفت`
                        )
                      : bi('Top Platinum Tier Achieved!', 'اعلیٰ ترین پلاٹینم درجہ حاصل!')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {tp?.pendingApplicationTier && (
                    <span className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      {bi(`Pending Admin Approval: ${tp.pendingApplicationTier}`, `ایڈمن منظوری زیرِ التواء: ${tp.pendingApplicationTier}`)}
                    </span>
                  )}
                  <span className="text-lg font-extrabold text-[#176B4A] tabular-nums">
                    {tp?.progressPercent ?? 0}%
                  </span>
                </div>
              </div>

              <div className="h-3 w-full rounded-full bg-[#E5EEE8] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#399B6B] to-[#176B4A] transition-all duration-500"
                  style={{ width: `${tp?.progressPercent ?? 0}%` }}
                />
              </div>

              {tp?.nextRule && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] p-3">
                    <p className="text-[11px] text-[#78857D]">{bi('Verified Skills', 'تصدیق شدہ مہارتیں')}</p>
                    <p className="mt-1 text-sm font-bold text-[#17251E] tabular-nums">
                      {tp.metrics.verifiedCompetencies} / {tp.nextRule.minVerifiedCompetencies}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] p-3">
                    <p className="text-[11px] text-[#78857D]">{bi('Avg Rating', 'اوسط ریٹنگ')}</p>
                    <p className="mt-1 text-sm font-bold text-[#17251E] tabular-nums">
                      {tp.metrics.rating.toFixed(1)} / {tp.nextRule.minRating.toFixed(1)}★
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] p-3">
                    <p className="text-[11px] text-[#78857D]">{bi('Completed Jobs', 'مکمل کام')}</p>
                    <p className="mt-1 text-sm font-bold text-[#17251E] tabular-nums">
                      {tp.metrics.completedJobs} / {tp.nextRule.minCompletedJobs}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] p-3">
                    <p className="text-[11px] text-[#78857D]">{bi('Active Months', 'فعال مہینے')}</p>
                    <p className="mt-1 text-sm font-bold text-[#17251E] tabular-nums">
                      {tp.metrics.activeMonths} / {tp.nextRule.minActiveMonths}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[#78857D]">
                <span>
                  {bi(
                    'When all thresholds & 0 unresolved reports are met, your tier upgrade is queued for Admin verification.',
                    'تمام شرائط اور صفر شکایات مکمل ہونے پر آپ کی درجہ ترقی خودکار ایڈمن قطار میں شامل ہو جاتی ہے۔'
                  )}
                </span>
                <Link to="/worker/growth" className="font-semibold text-[#176B4A] hover:underline whitespace-nowrap">
                  {bi('Growth Hub & Passport →', 'ترقی اور پاسپورٹ ←')}
                </Link>
              </div>
            </div>

            {/* Trust Score Breakdown Card */}
            <div className="lg:col-span-5 rounded-2xl kc-glass-card p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#17251E]">
                  {bi('Trust Score Breakdown (0–100)', 'ٹرسٹ اسکور کی تفصیل (۰ تا ۱۰۰)')}
                </h3>
                <Link to="/trust-score" className="text-xs font-semibold text-[#176B4A] hover:underline">
                  {bi('How it works', 'یہ کیسے کام کرتا ہے')}
                </Link>
              </div>
              {data.trustScoreBreakdown && (
                <div className="space-y-2.5 text-xs">
                  {[
                    {
                      label: bi('Verified Competencies', 'تصدیق شدہ مہارتیں'),
                      pts: data.trustScoreBreakdown.competenciesPoints,
                      max: 40,
                    },
                    {
                      label: bi('Customer Rating (Bayesian)', 'کسٹمر ریٹنگ'),
                      pts: data.trustScoreBreakdown.ratingPoints,
                      max: 30,
                    },
                    {
                      label: bi('Completed & Repeat Jobs', 'مکمل اور بار بار ملنے والے کام'),
                      pts: data.trustScoreBreakdown.jobsAndRepeatPoints,
                      max: 15,
                    },
                    {
                      label: bi('Low Cancellation & Reliability', 'پابندی اور اعتماد'),
                      pts: data.trustScoreBreakdown.reliabilityPoints,
                      max: 10,
                    },
                    {
                      label: bi('Safety Record', 'حفاظتی ریکارڈ'),
                      pts: data.trustScoreBreakdown.safetyPoints,
                      max: 5,
                    },
                  ].map((row) => (
                    <div key={String(row.label)}>
                      <div className="flex justify-between font-medium text-[#17251E] mb-1">
                        <span>{row.label}</span>
                        <span className="font-mono tabular-nums text-[#176B4A]">
                          {row.pts}/{row.max}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#E5EEE8] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#399B6B]"
                          style={{ width: `${Math.round((row.pts / row.max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Analytics + Reminders + Portfolio Contrast Card */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <AnimatedBarChart
                title={bi('Competency Matrix Analytics', 'مہارتوں کا تجزیاتی چارٹ')}
                subtitle={
                  data.tradeName
                    ? bi(`${data.tradeName} progress distribution`, `${data.tradeUrduName || data.tradeName} کی پیش رفت`)
                    : bi('Select a category to view breakdown', 'تفصیل دیکھنے کے لیے شعبہ منتخب کریں')
                }
                data={matrixChartData}
              />
            </div>

            <div className="lg:col-span-4 rounded-2xl kc-glass-card kc-hover-lift p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#17251E]">
                    {bi('Next Recommended Step', 'اگلا تجویز کردہ قدم')}
                  </h3>
                  <Sparkles className="h-4 w-4 text-[#399B6B]" />
                </div>

                {!data.tradeName ? (
                  <div className="mt-4">
                    <p className="text-lg font-bold text-[#17251E]">
                      {bi('Choose Your Primary Service', 'اپنا بنیادی شعبہ منتخب کریں')}
                    </p>
                    <p className="mt-1.5 text-sm text-[#78857D]">
                      {bi(
                        'Select from 48+ home, repair, beauty, moving, or device categories to unlock your practical checklist.',
                        'اپنی عملی مہارتوں کی فہرست کھولنے کے لیے ۴۸+ شعبوں میں سے اپنا ہنر منتخب کریں۔'
                      )}
                    </p>
                  </div>
                ) : (data.stats.pendingJobRequestsCount || 0) > 0 ? (
                  <div className="mt-4">
                    <p className="text-lg font-bold text-[#17251E]">
                      {bi(
                        `${data.stats.pendingJobRequestsCount} New Job Request(s)`,
                        `${data.stats.pendingJobRequestsCount} نئی کام کی درخواستیں`
                      )}
                    </p>
                    <p className="mt-1.5 text-sm text-[#78857D]">
                      {bi(
                        'Review customer job descriptions & photos and send your PKR quote quickly to stay reliable.',
                        'کسٹمر کے کام کی تفصیل دیکھیں اور وقت پر PKR تخمینہ بھیجیں۔'
                      )}
                    </p>
                  </div>
                ) : data.stats.expiringBadges > 0 ? (
                  <div className="mt-4">
                    <p className="text-lg font-bold text-[#17251E]">
                      {bi(`${data.stats.expiringBadges} Badge Expiring Soon`, `${data.stats.expiringBadges} بیج جلد ختم ہونے والا ہے`)}
                    </p>
                    <p className="mt-1.5 text-sm text-[#78857D]">
                      {bi(
                        'Upload updated evidence in your Competency Matrix to renew verification for another 12 months.',
                        'مزید ۱۲ ماہ کے لیے تصدیق کی تجدید کرانے کے لیے مہارتوں کے صفحے پر نیا ثبوت اپ لوڈ کریں۔'
                      )}
                    </p>
                  </div>
                ) : data.profileCompletion < 100 ? (
                  <div className="mt-4">
                    <p className="text-lg font-bold text-[#17251E]">
                      {bi('Complete Skills Profile', 'اپنا ہنر پروفائل مکمل کریں')}
                    </p>
                    <p className="mt-1.5 text-sm text-[#78857D]">
                      {bi(
                        'Add your biography and core skills (you can use Voice input) so customers trust your expertise.',
                        'اپنا تعارف اور بنیادی مہارتیں شامل کریں تاکہ گاہک آپ کے تجربے پر اعتماد کر سکیں۔'
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-lg font-bold text-[#17251E]">
                      {bi('Verify More Skills', 'مزید مہارتوں کی تصدیق کرائیں')}
                    </p>
                    <p className="mt-1.5 text-sm text-[#78857D]">
                      {bi(
                        `Verify competencies in ${data.tradeName} to rank higher on your city leaderboard.`,
                        `اپنے شہر کے لیڈر بورڈ میں نمایاں ہونے کے لیے ${data.tradeUrduName || data.tradeName} کی مزید مہارتوں کی تصدیق کرائیں۔`
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Link
                  to={
                    !data.tradeName
                      ? '/worker/trades'
                      : (data.stats.pendingJobRequestsCount || 0) > 0
                        ? '/worker/jobs'
                        : data.profileCompletion < 100
                          ? '/worker/profile/edit'
                          : '/worker/matrix'
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#176B4A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#13563B] transition-colors"
                >
                  <span>
                    {!data.tradeName
                      ? bi('Select Category', 'شعبہ منتخب کریں')
                      : (data.stats.pendingJobRequestsCount || 0) > 0
                        ? bi('Review Job Requests', 'کام کی درخواستیں دیکھیں')
                        : data.profileCompletion < 100
                          ? bi('Edit Skills Profile', 'پروفائل مکمل کریں')
                          : bi('Open Competency Matrix', 'مہارتوں کی فہرست کھولیں')}
                  </span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-3 kc-dark-surface rounded-2xl p-5 sm:p-6 text-white flex flex-col justify-between kc-hover-lift">
              <div>
                <p className="text-xs font-semibold text-[#73C99B]">
                  {bi('Karigar Passport & Portfolio', 'کاریگر پاسپورٹ اور پورٹ فولیو')}
                </p>
                <p className="mt-2 font-mono text-base font-bold tracking-tight text-white break-all">
                  {data.passportId}
                </p>
                <p className="mt-1 font-mono text-xs text-[#73C99B]">{data.publicId}</p>
                <p className="mt-2 text-xs text-[#B8E4C7]/85 leading-relaxed">
                  {bi(
                    'Show your QR Karigar Passport card to verify badges & completed job trust anywhere.',
                    'کہیں بھی اپنی مہارتوں اور کاموں کی تصدیق کے لیے QR کاریگر پاسپورٹ دکھائیں۔'
                  )}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <Link
                  to="/worker/growth"
                  className="flex-1 text-center rounded-full bg-[#399B6B] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#176B4A] transition-colors"
                >
                  {bi('QR Passport', 'QR پاسپورٹ')}
                </Link>
                <Link
                  to={`/workers/${data.publicId}`}
                  className="rounded-full border border-white/25 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  {bi('Preview', 'پیش نظارہ')}
                </Link>
              </div>
            </div>
          </div>

          {/* Customer Reviews & Replies Section */}
          <div className="rounded-2xl kc-glass-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#17251E]">
                  {bi('Customer Ratings & Verified Hire Reviews', 'کسٹمر کی ریٹنگز اور تصدیق شدہ ریویوز')}
                </h3>
                <div className="mt-1">
                  <StarRatingInline
                    rating={ratingSummary?.bayesianRating || 0}
                    count={ratingSummary?.totalReviews || 0}
                  />
                </div>
              </div>
              <Link to={`/workers/${data.publicId}`} className="text-xs font-semibold text-[#176B4A] hover:underline">
                {bi('View All on Portfolio →', 'پورٹ فولیو پر سب دیکھیں ←')}
              </Link>
            </div>

            {!data.recentReviews || data.recentReviews.length === 0 ? (
              <p className="text-sm text-[#78857D]">
                {bi(
                  'Completed customer jobs that receive a Verified Hire review will appear here so you can post a public reply.',
                  'مکمل کاموں پر ملنے والے کسٹمر ریویوز یہاں ظاہر ہوں گے جہاں آپ عوامی جواب دے سکیں گے۔'
                )}
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentReviews.map((rev: any) => (
                  <div key={rev.id} className="rounded-2xl border border-[#E5EEE8] bg-[#F7FAF8]/80 p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[#17251E]">
                          {rev.customerName}{' '}
                          <span className="text-xs font-normal text-[#78857D]">· {rev.jobTitle}</span>
                        </p>
                        <p className="text-[11px] text-[#78857D]">{formatDate(rev.createdAt, lang)}</p>
                      </div>
                      <span className="rounded-lg bg-[#DDF3E4] px-2.5 py-1 text-xs font-bold text-[#176B4A] tabular-nums">
                        {rev.overallRating.toFixed(1)}★
                      </span>
                    </div>
                    {rev.comment && <p className="text-sm text-[#17251E]">{rev.comment}</p>}
                    {rev.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {rev.tags.map((tg: string) => (
                          <span
                            key={tg}
                            className="rounded-md border border-[#B8E4C7] bg-[#DDF3E4] px-2 py-0.5 text-[11px] font-medium text-[#176B4A]"
                          >
                            {tg}
                          </span>
                        ))}
                      </div>
                    )}

                    {rev.workerReply ? (
                      <div className="rounded-xl border border-[#73C99B] bg-[#DDF3E4]/80 p-3 text-xs">
                        <p className="font-bold text-[#176B4A]">
                          {bi('Your Public Reply:', 'آپ کا عوامی جواب:')}
                        </p>
                        <p className="mt-0.5 text-[#17251E]">{rev.workerReply}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <input
                          type="text"
                          value={replyDrafts[rev.id] || ''}
                          onChange={(e) => setReplyDrafts({ ...replyDrafts, [rev.id]: e.target.value })}
                          placeholder={bi('Write a one-time public thank you / reply...', 'ایک مرتبہ کا عوامی شکریہ یا جواب لکھیں...')}
                          className="flex-1 rounded-xl border border-[#E5EEE8] bg-white px-3 py-2 text-xs focus:border-[#399B6B] focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={replyingId === rev.id}
                          onClick={() => submitReviewReply(rev.id)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
                        >
                          <Send className="h-3.5 w-3.5 rtl:-scale-x-100" />
                          {replyingId === rev.id ? bi('Posting...', 'شائع ہو رہا ہے...') : bi('Post Reply', 'جواب شائع کریں')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Grid: Profile Gauge + Quick Workflow + Recent Activity */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SemiCircleGauge
                title={bi('Profile Readiness', 'پروفائل کی تکمیل')}
                percentage={data.profileCompletion}
                caption={bi('Profile Completed', 'پروفائل مکمل')}
                primaryLabel={bi('Completed', 'مکمل')}
                secondaryLabel={bi('Remaining', 'باقی')}
              />
            </div>

            <div className="lg:col-span-4 rounded-2xl kc-glass-card p-5 sm:p-6 space-y-3">
              <h3 className="text-base font-bold text-[#17251E]">
                {bi('Quick Workflow', 'فوری رہنمائی')}
              </h3>
              {[
                {
                  to: '/worker/jobs',
                  icon: Briefcase,
                  title: bi('Jobs & Bookings', 'کام اور بکنگز'),
                  sub: bi('Accept requests, quote PKR, upload proof', 'درخواستیں قبول کریں، تخمینہ اور ثبوت دیں'),
                },
                {
                  to: '/worker/matrix',
                  icon: Grid,
                  title: bi('Competency Matrix', 'مہارتوں کی فہرست'),
                  sub: bi('Track status & request verification', 'صورتحال دیکھیں اور تصدیق طلب کریں'),
                },
                {
                  to: '/worker/requests',
                  icon: MessageSquare,
                  title: bi('Direct Contact Requests', 'رابطے کی درخواستیں'),
                  sub: bi('Manage customer phone & email consent', 'فون اور ای میل رسائی کی منظوری'),
                },
                {
                  to: '/worker/trades',
                  icon: Wrench,
                  title: bi('Browse 48+ Service Categories', '۴۸+ پیشہ ورانہ شعبے'),
                  sub: bi('Update your primary practical trade', 'اپنا بنیادی پیشہ تبدیل کریں'),
                },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center justify-between rounded-2xl border border-[#B8E4C7] bg-[#E8F6EE] p-3 hover:border-[#399B6B] hover:bg-[#DDF3E4] transition-all kc-hover-lift"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DDF3E4] border border-[#9BD9B4] text-[#176B4A] shrink-0">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#17251E] truncate">{link.title}</p>
                        <p className="text-xs text-[#78857D] truncate">{link.sub}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#176B4A] shrink-0 ms-2">
                      {bi('Open →', 'کھولیں ←')}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="lg:col-span-4 rounded-2xl kc-glass-card p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#17251E]">
                  {bi('Recent Activity', 'حالیہ سرگرمی')}
                </h3>
                <Link to="/worker/assessments" className="text-xs font-semibold text-[#176B4A] hover:underline">
                  {bi('Assessments →', 'جائزے ←')}
                </Link>
              </div>
              {data.recentActivity.length === 0 ? (
                <p className="mt-4 text-sm text-[#78857D]">
                  {bi('No activity recorded yet. Start by uploading evidence.', 'ابھی کوئی سرگرمی ریکارڈ نہیں ہوئی۔ ثبوت اپ لوڈ کر کے آغاز کریں۔')}
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-[#E5EEE8]">
                  {data.recentActivity.slice(0, 5).map((act: any) => (
                    <li key={act.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                      <span className="text-[#17251E] leading-snug">{act.description}</span>
                      <span className="text-[11px] text-[#78857D] font-mono whitespace-nowrap shrink-0 tabular-nums">
                        {formatDate(act.createdAt, lang)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
