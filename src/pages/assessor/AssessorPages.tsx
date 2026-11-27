import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Award, CheckCircle2, ClipboardCheck, ShieldCheck, Wrench } from 'lucide-react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { CityCombobox } from '../../components/ui/CityCombobox';
import {
  ConfirmDialog,
  EmptyState,
  LoadingSkeleton,
  StatusLabel,
  formatDate,
  formatLevelLabel,
} from '../../components/ui/Components';
import {
  AnimatedBarChart,
  BarDatum,
  SemiCircleGauge,
  StatKpiCard,
} from '../../components/ui/DataViz';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SERVICE_GROUPS } from '../../data/serviceCatalog';
import { api, getApiErrorMessage } from '../../services/api';
import { useI18n } from '../../i18n/translations';

export function AssessorDashboard() {
  const { showToast } = useToast();
  const { bi, lang, statusText } = useI18n();
  const [data, setData] = useState<any>(null);
  const [completed, setCompleted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/assessors/me'), api.get('/assessors/completed')])
      .then(([meRes, compRes]) => {
        setData(meRes.data.data);
        setCompleted(compRes.data.data || []);
      })
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, []);

  const verifiedCount = completed.filter((c) => c.status === 'VERIFIED').length;
  const moreEvidenceCount = completed.filter((c) => c.status === 'NEEDS_MORE_EVIDENCE').length;
  const notVerifiedCount = completed.filter((c) => c.status === 'NOT_VERIFIED').length;
  const verificationRate =
    completed.length > 0 ? Math.round((verifiedCount / completed.length) * 100) : 0;

  const outcomesData: BarDatum[] = [
    { label: bi('Verified', 'تصدیق شدہ'), shortLabel: bi('Ver', 'تصدیق'), value: verifiedCount, variant: 'dark' },
    { label: bi('More Evidence', 'مزید ثبوت'), shortLabel: bi('More', 'ثبوت'), value: moreEvidenceCount, variant: 'medium' },
    { label: bi('Pending Queue', 'زیرِ التواء'), shortLabel: bi('Pend', 'قطار'), value: data?.stats?.pendingQueueCount || 0, variant: 'light' },
    { label: bi('Not Verified', 'غیر تصدیق'), shortLabel: bi('Fail', 'مسترد'), value: notVerifiedCount, variant: 'hatched' },
  ];

  return (
    <DashboardLayout title={bi('Assessor Dashboard', 'ماہرِ جائزہ ڈیش بورڈ')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : !data ? null : (
        <div className="space-y-6">
          {/* Approval Banner */}
          <div className="rounded-2xl kc-glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[#17251E]">{data.fullName}</h2>
                <StatusLabel status={data.approvalStatus} />
              </div>
              <p className="mt-1 text-sm text-[#69726B]">
                {bi('Assigned Trades:', 'مقرر کردہ پیشے:')}{' '}
                <span className="font-semibold text-[#17251E]">
                  {data.approvedTrades?.length > 0
                    ? data.approvedTrades.map((t: any) => t.name).join(', ')
                    : bi('None assigned yet', 'ابھی کوئی پیشہ تفویض نہیں')}
                </span>
              </p>
              {data.approvalStatus === 'NOT_APPLIED' && (
                <p className="mt-1 text-xs text-amber-700">
                  {bi(
                    'Submit your assessor application to get approved by Admin for trade reviews.',
                    'پیشہ ورانہ جائزوں کی منظوری کے لیے ایڈمن کو اپنی درخواست جمع کرائیں۔'
                  )}
                </p>
              )}
              {data.approvalStatus === 'PENDING' && (
                <p className="mt-1 text-xs text-amber-700">
                  {bi(
                    'Your application is under Admin review. You cannot verify competencies until approved.',
                    'آپ کی درخواست ایڈمن کے زیرِ جائزہ ہے۔ منظوری سے قبل تصدیق کی اجازت نہیں ہے۔'
                  )}
                </p>
              )}
              {data.rejectionReason && (
                <p className="mt-1 text-xs text-red-700">
                  {bi('Reason:', 'وجہ:')} {data.rejectionReason}
                </p>
              )}
            </div>
            {data.approvalStatus === 'APPROVED' ? (
              <Link
                to="/assessor/queue"
                className="rounded-full bg-[#176B4A] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#13563B] whitespace-nowrap"
              >
                {bi('Open Verification Queue', 'تصدیقی قطار کھولیں')}
              </Link>
            ) : (
              <Link
                to="/assessor/application"
                className="rounded-full bg-[#176B4A] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#13563B] whitespace-nowrap"
              >
                {data.approvalStatus === 'NOT_APPLIED'
                  ? bi('Submit Application', 'درخواست جمع کرائیں')
                  : bi('View Application', 'درخواست دیکھیں')}
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatKpiCard
              highlighted
              label={bi('Pending Queue', 'زیرِ التواء قطار')}
              value={data.stats.pendingQueueCount}
              sublabel={bi('Ready for rubric review', 'معیاری جائزے کے لیے تیار')}
              icon={ClipboardCheck}
              to="/assessor/queue"
            />
            <StatKpiCard
              label={bi('Completed Reviews', 'مکمل جائزے')}
              value={data.stats.completedAssessments}
              sublabel={bi('Total scored submissions', 'کل جانچے گئے ثبوت')}
              icon={CheckCircle2}
              to="/assessor/completed"
            />
            <StatKpiCard
              label={bi('Verified Badges Issued', 'جاری کردہ تصدیقی بیج')}
              value={verifiedCount}
              sublabel={bi('Passed safety & threshold', 'حفاظت اور معیار میں کامیاب')}
              icon={Award}
              to="/assessor/completed"
            />
            <StatKpiCard
              label={bi('Assigned Trades', 'تفویض کردہ پیشے')}
              value={data.approvedTrades?.length || 0}
              sublabel={statusText(data.approvalStatus)}
              icon={Wrench}
              to="/assessor/profile"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <AnimatedBarChart
                title={bi('Evaluation Outcomes Breakdown', 'جائزوں کے نتائج کی تفصیل')}
                subtitle={bi('Distribution across your queue and completed reviews', 'زیرِ التواء اور مکمل جائزوں کی تقسیم')}
                data={outcomesData}
              />
            </div>

            <div className="lg:col-span-4">
              <SemiCircleGauge
                title={bi('Verification Pass Share', 'کامیابی کی شرح')}
                percentage={verificationRate}
                caption={
                  completed.length > 0
                    ? bi(`${verifiedCount} of ${completed.length} verified`, `${completed.length} میں سے ${verifiedCount} تصدیق شدہ`)
                    : bi('No completed reviews yet', 'ابھی کوئی مکمل جائزہ نہیں')
                }
                primaryLabel={bi('Verified', 'تصدیق شدہ')}
                secondaryLabel={bi('Revision / Not Verified', 'نظرثانی / غیر تصدیق')}
              />
            </div>

            <div className="lg:col-span-3 kc-dark-surface rounded-2xl p-5 sm:p-6 text-white flex flex-col justify-between kc-hover-lift">
              <div>
                <p className="text-xs font-semibold text-[#C9973A]">{bi('Rubric Safeguard', 'معیاری تحفظ')}</p>
                <h3 className="mt-2 text-lg font-bold leading-snug">{bi('0–3 Criterion Scoring', '۰ تا ۳ معیاری اسکورنگ')}</h3>
                <p className="mt-2 text-xs text-[#D8D0BE]/85 leading-relaxed">
                  {bi(
                    'Any score of 0 on a safety-critical criterion automatically prevents badge issuance.',
                    'کسی بھی اہم حفاظتی معیار پر صفر اسکور بیج کے اجراء کو خودکار روک دیتا ہے۔'
                  )}
                </p>
              </div>
              <Link
                to="/assessor/queue"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-[#399B6B] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#176B4A] transition-colors"
              >
                {bi('Open Queue →', 'قطار کھولیں ←')}
              </Link>
            </div>
          </div>

          <div className="rounded-2xl kc-glass-card p-6">
            <h3 className="text-base font-bold text-[#17251E]">
              {bi('Recent Assessment Activity', 'حالیہ جائزہ سرگرمی')}
            </h3>
            {data.recentActivity.length === 0 ? (
              <p className="mt-3 text-sm text-[#69726B]">
                {bi('No completed assessments recorded yet.', 'ابھی کوئی مکمل جائزہ ریکارڈ نہیں ہوا۔')}
              </p>
            ) : (
              <div className="mt-4 divide-y divide-[#E6E0D2]">
                {data.recentActivity.map((act: any) => (
                  <div key={act.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                    <div>
                      <span className="font-bold text-[#17251E]">{act.workerName}</span> ·{' '}
                      <span className="text-[#69726B]">{act.competencyTitle}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono font-semibold text-[#17251E] tabular-nums">{act.percentage}%</span>
                      <StatusLabel status={act.status} />
                      <span className="font-mono text-[#69726B]">{formatDate(act.assessedAt, lang)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export function AssessorApplicationPage() {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const { bi, isUr } = useI18n();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [approvalStatus, setApprovalStatus] = useState('NOT_APPLIED');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [selectedTradeIds, setSelectedTradeIds] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState(5);
  const [qualifications, setQualifications] = useState('');
  const [bio, setBio] = useState('');
  const [tradeQuery, setTradeQuery] = useState('');

  useEffect(() => {
    Promise.all([api.get('/assessors/me'), api.get('/public/trades')])
      .then(([meRes, tradesRes]) => {
        const d = meRes.data.data;
        setApprovalStatus(d.approvalStatus);
        setFullName(d.fullName || '');
        setCity(d.city || '');
        setSelectedTradeIds(d.appliedTradeIds || []);
        setYearsExperience(d.yearsExperience || 5);
        setQualifications(d.qualifications || '');
        setBio(d.bio || '');
        setTrades(tradesRes.data.data || []);
      })
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, []);

  const toggleTrade = (id: string) => {
    setSelectedTradeIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      showToast(bi('Select your city in Pakistan.', 'پاکستان کا شہر منتخب کریں۔'), 'error');
      return;
    }
    if (selectedTradeIds.length === 0) {
      showToast(bi('Select at least one trade you are qualified to assess.', 'کم از کم ایک پیشہ منتخب کریں جس کی جانچ کے آپ اہل ہیں۔'), 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/assessors/apply', {
        fullName,
        city,
        tradeIds: selectedTradeIds,
        yearsExperience: Number(yearsExperience),
        qualifications,
        bio,
      });
      await refreshUser();
      setApprovalStatus('PENDING');
      showToast(bi('Assessor application submitted to Admin.', 'ماہرِ جائزہ کی درخواست ایڈمن کو جمع کر دی گئی۔'), 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title={bi('Assessor Application', 'ماہرِ جائزہ کی درخواست')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <form onSubmit={handleSubmit} className="max-w-3xl rounded-2xl kc-glass-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#17251E]">
              {bi('Assessor Verification Credentials', 'ماہرِ جائزہ کی اہلیت کی تفصیلات')}
            </h2>
            <StatusLabel status={approvalStatus} />
          </div>
          <p className="text-sm text-[#69726B]">
            {bi(
              'Admin reviews your trade experience and qualifications before enabling access to verification queues.',
              'تصدیقی قطار تک رسائی دینے سے قبل ایڈمن آپ کے پیشہ ورانہ تجربے اور اسناد کا جائزہ لیتا ہے۔'
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#17251E] mb-1">{bi('Full Name', 'مکمل نام')}</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#17251E] mb-1">{bi('City (Pakistan)', 'شہر (پاکستان)')}</label>
              <CityCombobox value={city} onChange={setCity} required />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-sm font-medium text-[#17251E]">
                {bi('Service Categories You Are Applying to Assess', 'جن شعبوں کا آپ جائزہ لینا چاہتے ہیں')} ({selectedTradeIds.length})
              </label>
              <input
                type="text"
                value={tradeQuery}
                onChange={(e) => setTradeQuery(e.target.value)}
                placeholder={bi('Filter categories...', 'شعبے تلاش کریں...')}
                className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-1.5 text-xs"
              />
            </div>

            <div className="max-h-72 overflow-y-auto rounded-2xl border border-[#E6E0D2] bg-[#F7F4EC]/60 p-3 space-y-4">
              {SERVICE_GROUPS.map((grp) => {
                const q = tradeQuery.trim().toLowerCase();
                const grpTrades = trades.filter(
                  (t) =>
                    (t.group || 'Home Repair & Maintenance') === grp.group &&
                    (!q || t.name.toLowerCase().includes(q) || (t.urduName || '').toLowerCase().includes(q))
                );
                if (grpTrades.length === 0) return null;
                return (
                  <div key={grp.group}>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#176B4A] mb-2">
                      {isUr ? `${grp.urduGroup} (${grp.group})` : grp.group}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {grpTrades.map((t) => (
                        <label
                          key={t.id}
                          className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs cursor-pointer transition-colors ${
                            selectedTradeIds.includes(t.id)
                              ? 'border-[#176B4A] bg-[#ECE6D7]/75 font-semibold text-[#17251E]'
                              : 'border-[#E6E0D2] bg-white text-[#69726B]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTradeIds.includes(t.id)}
                            onChange={() => toggleTrade(t.id)}
                            className="h-3.5 w-3.5 rounded border-[#D8D0BE] accent-[#176B4A]"
                          />
                          <span className="truncate">{isUr && t.urduName ? t.urduName : t.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#17251E] mb-1">
              {bi('Years of Trade / Supervisory Experience', 'پیشہ ورانہ یا نگرانی کے تجربے کے سال')}
            </label>
            <input
              type="number"
              min={1}
              max={60}
              required
              value={yearsExperience}
              onChange={(e) => setYearsExperience(Number(e.target.value))}
              className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#17251E] mb-1">
              {bi('Qualifications & Supporting Background', 'تعلیمی قابلیت اور پیشہ ورانہ پس منظر')}
            </label>
            <textarea
              rows={3}
              required
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              placeholder={bi(
                'List vocational diplomas, workshop leadership, safety certifications...',
                'ووکیشنل ڈپلومہ، ورکشاپ نگرانی اور حفاظتی سرٹیفکیٹس درج کریں...'
              )}
              className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#17251E] mb-1">
              {bi('Short Professional Biography', 'مختصر پیشہ ورانہ تعارف')}
            </label>
            <textarea
              rows={3}
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-[#176B4A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
          >
            {submitting
              ? bi('Submitting...', 'جمع ہو رہا ہے...')
              : approvalStatus === 'APPROVED'
                ? bi('Update Application', 'درخواست اپ ڈیٹ کریں')
                : bi('Submit Application', 'درخواست جمع کرائیں')}
          </button>
        </form>
      )}
    </DashboardLayout>
  );
}

export function VerificationQueuePage() {
  const { showToast } = useToast();
  const { bi, lang } = useI18n();
  const [queueData, setQueueData] = useState<{ approvalStatus: string; items: any[] }>({
    approvalStatus: 'PENDING',
    items: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/assessors/queue')
      .then((res) => setQueueData(res.data.data))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title={bi('Verification Queue', 'تصدیقی قطار')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : queueData.approvalStatus !== 'APPROVED' ? (
        <EmptyState
          title={bi('Assessor Approval Required', 'ماہر کی منظوری درکار ہے')}
          description={bi(
            'Only Admin-approved assessors can view and evaluate verification requests in their assigned trades.',
            'صرف ایڈمن سے منظور شدہ ماہرین اپنے مقرر کردہ پیشوں کی درخواستوں کا جائزہ لے سکتے ہیں۔'
          )}
          action={
            <Link to="/assessor/application" className="rounded-full bg-[#176B4A] px-5 py-2.5 text-sm font-semibold text-white">
              {bi('Go to Application', 'درخواست پر جائیں')}
            </Link>
          }
        />
      ) : queueData.items.length === 0 ? (
        <EmptyState
          title={bi('Verification queue is clear', 'تصدیقی قطار خالی ہے')}
          description={bi(
            'No pending verification requests are waiting in your approved trades right now.',
            'اس وقت آپ کے منظور شدہ پیشوں میں کوئی زیرِ التواء درخواست موجود نہیں ہے۔'
          )}
        />
      ) : (
        <div className="space-y-4">
          {queueData.items.map((item) => (
            <div
              key={item.itemId}
              className="rounded-2xl kc-glass-card kc-hover-lift p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <p className="text-xs font-medium text-[#69726B]">
                  {item.tradeName} · {bi('Submitted', 'جمع تاریخ:')} {formatDate(item.requestedAt, lang)} · {item.evidenceCount}{' '}
                  {bi('private file(s)', 'نجی فائل')}
                  {item.isAppeal ? bi(' · Appeal Re-review', ' · اپیل پر دوبارہ جائزہ') : ''}
                </p>
                <h3 className="mt-1 text-base font-bold text-[#17251E]">
                  {item.workerName} — {item.competencyTitle}
                </h3>
                <p className="text-xs text-[#69726B]">{item.workerCity}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusLabel status={item.status} />
                <Link
                  to={`/assessor/queue/${item.requestId}`}
                  className="rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B] whitespace-nowrap"
                >
                  {bi('Review Evidence & Score', 'ثبوت دیکھیں اور اسکور دیں')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export function EvidenceReviewPage() {
  const { requestId } = useParams();
  const { showToast } = useToast();
  const { bi, lang } = useI18n();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [scoresByItem, setScoresByItem] = useState<Record<string, Record<string, number>>>({});
  const [feedbackByItem, setFeedbackByItem] = useState<Record<string, string>>({});
  const [confirmSubmit, setConfirmSubmit] = useState<{ item: any; decision: 'VERIFY' | 'REQUEST_MORE_EVIDENCE' | 'NOT_VERIFY' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadRequest = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/assessors/requests/${requestId}`);
      const d = res.data.data;
      setData(d);

      const initScores: Record<string, Record<string, number>> = {};
      const initFb: Record<string, string> = {};
      for (const item of d.items) {
        initScores[item.id] = {};
        for (const crit of item.criteria || []) {
          const saved = (item.savedScores || []).find((s: any) => s.criterion_id === crit.id);
          initScores[item.id][crit.id] = saved ? saved.score : 2;
        }
        initFb[item.id] = item.feedback || '';
      }
      setScoresByItem(initScores);
      setFeedbackByItem(initFb);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) loadRequest();
  }, [requestId]);

  const computePreview = (item: any) => {
    const critList = item.criteria || [];
    const scores = scoresByItem[item.id] || {};
    let total = 0;
    let max = 0;
    let safetyFailed = false;
    for (const c of critList) {
      const val = scores[c.id] ?? 0;
      if (c.isSafetyCritical && val === 0) safetyFailed = true;
      total += val;
      max += c.maxScore;
    }
    const pct = max > 0 ? Math.round((total / max) * 1000) / 10 : 0;
    let level: string | null = null;
    if (!safetyFailed) {
      if (pct >= 85) level = 'ADVANCED';
      else if (pct >= 70) level = 'COMPETENT';
      else if (pct >= 50) level = 'BASIC';
    }
    return { total, max, pct, safetyFailed, level };
  };

  const handleConfirmAssessment = async () => {
    if (!confirmSubmit) return;
    const { item, decision } = confirmSubmit;
    const feedback = (feedbackByItem[item.id] || '').trim();
    if (feedback.length < 5) {
      showToast(
        bi('Please enter clear assessor feedback (at least 5 characters).', 'براہِ کرم کم از کم ۵ حروف کی واضح رائے درج کریں۔'),
        'error'
      );
      setConfirmSubmit(null);
      return;
    }

    const scoreMap = scoresByItem[item.id] || {};
    const scores = (item.criteria || []).map((c: any) => ({
      criterionId: c.id,
      score: scoreMap[c.id] ?? 0,
    }));

    setSubmitting(true);
    try {
      const res = await api.post(`/assessors/requests/${requestId}/assessment`, {
        competencyId: item.competencyId,
        decision,
        feedback,
        scores,
      });
      showToast(res.data.message || bi('Assessment submitted.', 'جائزہ جمع ہو گیا۔'), 'success');
      setConfirmSubmit(null);
      navigate('/assessor/queue');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      setConfirmSubmit(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title={bi('Evidence Review & Rubric Assessment', 'ثبوت کا جائزہ اور معیاری اسکورنگ')}>
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : error || !data ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : (
        <div className="space-y-6">
          {/* Worker Summary */}
          <div className="rounded-2xl border border-[#D8D0BE] bg-gradient-to-r from-white/95 to-[#ECE6D7]/65 backdrop-blur-md p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 kc-card-shadow">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#399B6B]">
                {data.tradeName} · {bi('Requested', 'درخواست تاریخ:')} {formatDate(data.requestedAt, lang)}
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-[#17251E]">{data.worker.fullName}</h2>
              <p className="text-sm text-[#69726B]">
                {data.worker.city} · {data.worker.yearsExperience} {bi('years experience', 'سال کا تجربہ')}
              </p>
              {data.worker.bio && <p className="mt-2 text-xs text-[#69726B] max-w-2xl">{data.worker.bio}</p>}
            </div>
            <Link
              to="/assessor/queue"
              className="rounded-full border border-[#E6E0D2] bg-white px-4 py-2 text-xs font-semibold text-[#17251E] hover:bg-[#F7F4EC] whitespace-nowrap"
            >
              {bi('← Back to Queue', '→ قطار پر واپس جائیں')}
            </Link>
          </div>

          {data.items.map((item: any) => {
            if (item.restrictedAppealConflict) {
              return (
                <div key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
                  {bi(
                    'This item is an appeal of your earlier decision and must be reviewed by a different authorized assessor.',
                    'یہ آپ کے سابقہ فیصلے پر اپیل ہے اور اس کا جائزہ کسی دوسرے مجاز ماہر کو لینا ہوگا۔'
                  )}
                </div>
              );
            }

            const preview = computePreview(item);
            const isPending = item.status === 'PENDING';

            return (
              <div key={item.id} className="rounded-2xl kc-glass-card p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-[#E6E0D2] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#17251E]">
                      {item.competencyTitle}{' '}
                      {item.competencyUrduTitle && (
                        <span className="text-sm font-normal text-[#69726B]">({item.competencyUrduTitle})</span>
                      )}
                    </h3>
                    <p className="mt-1 text-sm text-[#69726B]">{item.competencyDescription}</p>
                    {item.isAppeal && (
                      <p className="mt-2 text-xs font-semibold text-amber-800">
                        {bi('Appeal Reason:', 'اپیل کی وجہ:')} “{item.appealReason}”
                      </p>
                    )}
                  </div>
                  <StatusLabel status={item.status} />
                </div>

                {/* Private Evidence Files */}
                <div>
                  <h4 className="text-sm font-bold text-[#17251E] mb-3">
                    {bi('Submitted Private Evidence', 'جمع کرائے گئے نجی ثبوت')} ({item.evidence?.length || 0})
                  </h4>
                  {item.evidence?.length === 0 ? (
                    <p className="text-sm text-[#69726B]">{bi('No evidence files found.', 'کوئی ثبوت کی فائل نہیں ملی۔')}</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {item.evidence.map((ev: any) => (
                        <div key={ev.id} className="rounded-2xl border border-[#E6E0D2] overflow-hidden bg-[#F7F4EC] kc-hover-lift">
                          <div className="h-56 bg-[#ECE6D7]/40">
                            {ev.fileType === 'VIDEO' ? (
                              <video src={ev.signedUrl} controls className="h-full w-full object-cover" />
                            ) : (
                              <img
                                src={ev.signedUrl}
                                alt={ev.title}
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="p-4">
                            <p className="text-sm font-bold text-[#17251E]">{ev.title}</p>
                            <p className="mt-1 text-xs text-[#69726B]">{ev.description}</p>
                            <p className="mt-1.5 text-[11px] font-mono text-[#69726B]">
                              {ev.originalName} · {formatDate(ev.createdAt, lang)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rubric Scoring Interface */}
                <div className="border-t border-[#E6E0D2] pt-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[#17251E]">
                        {bi('Structured Assessment Rubric (0–3 Scale)', 'معیاری جائزہ اسکورنگ (۰ تا ۳ پیمانہ)')}
                      </h4>
                      <p className="text-xs text-[#69726B]">
                        {bi(
                          '0 = Not demonstrated · 1 = Basic · 2 = Competent · 3 = Strong. Authoritative score & safety rules are validated before saving.',
                          '۰ = غیر واضح · ۱ = بنیادی · ۲ = ماہر · ۳ = بہترین۔ محفوظ کرنے سے قبل حفاظتی اصولوں کی خودکار جانچ کی جاتی ہے۔'
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#D8D0BE] bg-[#ECE6D7]/55 px-4 py-2 text-end">
                      <p className="font-mono text-sm font-extrabold text-[#17251E] tabular-nums">
                        {preview.total} / {preview.max} ({preview.pct}%)
                      </p>
                      <p className={`text-xs font-bold ${preview.safetyFailed ? 'text-red-700' : 'text-[#176B4A]'}`}>
                        {preview.safetyFailed
                          ? bi('Blocked: Safety-Critical Criterion = 0', 'رکاوٹ: اہم حفاظتی معیار = 0')
                          : preview.level
                            ? formatLevelLabel(preview.level, lang)
                            : bi('Below 50% Threshold', '۵۰٪ کم از کم حد سے کم')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(item.criteria || []).map((crit: any) => {
                      const val = scoresByItem[item.id]?.[crit.id] ?? 2;
                      return (
                        <div key={crit.id} className="rounded-2xl border border-[#E6E0D2] bg-[#F7F4EC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-[#17251E]">{crit.title}</p>
                              {crit.isSafetyCritical && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700">
                                  <AlertTriangle className="h-3 w-3" />
                                  {bi('Safety-Critical', 'حفاظتی لازم')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#69726B] mt-0.5">{crit.description}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {[0, 1, 2, 3].map((scoreOpt) => (
                              <button
                                key={scoreOpt}
                                type="button"
                                disabled={!isPending}
                                onClick={() =>
                                  setScoresByItem((prev) => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], [crit.id]: scoreOpt },
                                  }))
                                }
                                className={`h-9 w-9 rounded-xl border text-xs font-mono font-bold transition-colors ${
                                  val === scoreOpt
                                    ? scoreOpt === 0 && crit.isSafetyCritical
                                      ? 'border-red-700 bg-red-600 text-white'
                                      : 'border-[#176B4A] bg-[#176B4A] text-white'
                                    : 'border-[#E6E0D2] bg-white text-[#17251E] hover:bg-[#ECE6D7]/50'
                                } disabled:opacity-60`}
                              >
                                {scoreOpt}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#17251E] mb-1">
                      {bi('Assessor Feedback (Required)', 'ماہر کی رائے (لازمی)')}
                    </label>
                    <textarea
                      rows={3}
                      disabled={!isPending}
                      value={feedbackByItem[item.id] || ''}
                      onChange={(e) => setFeedbackByItem((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder={bi(
                        'Explain strengths observed, safety compliance, or specific missing evidence...',
                        'کام کی خوبیاں، حفاظتی پابندی یا مطلوبہ اضافی ثبوت کی وضاحت لکھیں...'
                      )}
                      className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none disabled:bg-[#F7F4EC]"
                    />
                  </div>

                  {isPending && (
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        disabled={preview.safetyFailed || !preview.level}
                        onClick={() => setConfirmSubmit({ item, decision: 'VERIFY' })}
                        className="inline-flex items-center gap-2 rounded-full bg-[#176B4A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#13563B] disabled:opacity-40"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {bi('Verify Competency & Issue Badge', 'مہارت کی تصدیق اور بیج جاری کریں')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmSubmit({ item, decision: 'REQUEST_MORE_EVIDENCE' })}
                        className="rounded-full border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                      >
                        {bi('Request More Evidence', 'مزید ثبوت طلب کریں')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmSubmit({ item, decision: 'NOT_VERIFY' })}
                        className="rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        {bi('Not Verify', 'تصدیق نہ کریں')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmSubmit)}
        title={bi('Confirm Assessment Decision', 'جائزے کے فیصلے کی تصدیق')}
        message={
          confirmSubmit?.decision === 'VERIFY'
            ? bi(
                `Verify "${confirmSubmit.item.competencyTitle}" and issue a 12-month competency badge?`,
                `کیا آپ "${confirmSubmit.item.competencyTitle}" کی تصدیق کر کے ۱۲ ماہ کا بیج جاری کرنا چاہتے ہیں؟`
              )
            : confirmSubmit?.decision === 'REQUEST_MORE_EVIDENCE'
              ? bi(
                  `Return "${confirmSubmit?.item.competencyTitle}" to the worker requesting additional evidence?`,
                  `کیا آپ "${confirmSubmit?.item.competencyTitle}" مزید ثبوت کے لیے ہنرمند کو واپس بھیجنا چاہتے ہیں؟`
                )
              : bi(
                  `Mark "${confirmSubmit?.item.competencyTitle}" as Not Verified?`,
                  `کیا آپ "${confirmSubmit?.item.competencyTitle}" کو غیر تصدیق شدہ قرار دینا چاہتے ہیں؟`
                )
        }
        confirmLabel={bi('Submit Decision', 'فیصلہ جمع کرائیں')}
        destructive={confirmSubmit?.decision === 'NOT_VERIFY'}
        loading={submitting}
        onConfirm={handleConfirmAssessment}
        onCancel={() => setConfirmSubmit(null)}
      />
    </DashboardLayout>
  );
}

export function CompletedAssessmentsPage() {
  const { showToast } = useToast();
  const { bi, lang } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/assessors/completed')
      .then((res) => setItems(res.data.data || []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title={bi('Completed Assessments', 'مکمل شدہ جائزے')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          title={bi('No completed assessments yet', 'ابھی کوئی مکمل شدہ جائزہ نہیں')}
          description={bi(
            'Evaluations you submit from your Verification Queue will appear here.',
            'تصدیقی قطار سے جمع کرائے گئے جائزے یہاں نظر آئیں گے۔'
          )}
          action={
            <Link to="/assessor/queue" className="rounded-full bg-[#176B4A] px-5 py-2.5 text-sm font-semibold text-white">
              {bi('Open Queue', 'قطار کھولیں')}
            </Link>
          }
        />
      ) : (
        <div className="rounded-2xl kc-glass-card overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-[#E6E0D2] bg-[#F7F4EC] text-xs font-semibold text-[#69726B]">
                <th className="px-4 py-3">{bi('Worker', 'ہنرمند')}</th>
                <th className="px-4 py-3">{bi('Trade & Competency', 'پیشہ اور مہارت')}</th>
                <th className="px-4 py-3">{bi('Score', 'اسکور')}</th>
                <th className="px-4 py-3">{bi('Outcome', 'نتیجہ')}</th>
                <th className="px-4 py-3">{bi('Date', 'تاریخ')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E0D2]">
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-[#F7F4EC]/60">
                  <td className="px-4 py-3 font-semibold text-[#17251E]">{r.workerName}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#17251E]">{r.competencyTitle}</p>
                    <p className="text-xs text-[#69726B]">{r.tradeName}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-[#17251E]">
                    {r.totalScore}/{r.maxScore} ({r.percentage}%)
                    {r.level ? ` · ${formatLevelLabel(r.level, lang)}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <StatusLabel status={r.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#69726B]">{formatDate(r.assessedAt, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

export function AssessorProfilePage() {
  const { showToast } = useToast();
  const { bi } = useI18n();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/assessors/me')
      .then((res) => setProfile(res.data.data))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title={bi('Assessor Profile', 'ماہرِ جائزہ پروفائل')}>
      {loading ? (
        <LoadingSkeleton rows={3} />
      ) : !profile ? null : (
        <div className="max-w-2xl rounded-2xl kc-glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#17251E]">{profile.fullName}</h2>
              <p className="text-sm text-[#69726B]">{profile.city} · {profile.email}</p>
            </div>
            <StatusLabel status={profile.approvalStatus} />
          </div>
          <div className="border-t border-[#E6E0D2] pt-4 text-sm space-y-2 text-[#69726B]">
            <p>
              <strong className="text-[#17251E]">{bi('Experience:', 'تجربہ:')}</strong> {profile.yearsExperience}{' '}
              {bi('years', 'سال')}
            </p>
            <p>
              <strong className="text-[#17251E]">{bi('Approved Trades:', 'منظور شدہ پیشے:')}</strong>{' '}
              {profile.approvedTrades?.map((t: any) => t.name).join(', ') || bi('None', 'کوئی نہیں')}
            </p>
            <p>
              <strong className="text-[#17251E]">{bi('Qualifications:', 'اسناد و قابلیت:')}</strong>{' '}
              {profile.qualifications || '—'}
            </p>
            <p>
              <strong className="text-[#17251E]">{bi('Biography:', 'تعارف:')}</strong> {profile.bio || '—'}
            </p>
          </div>
          <Link to="/assessor/application" className="inline-block rounded-full border border-[#E6E0D2] bg-[#F7F4EC] px-5 py-2 text-xs font-semibold text-[#17251E] hover:bg-[#ECE6D7]/50">
            {bi('Update Application Details', 'درخواست کی تفصیلات اپ ڈیٹ کریں')}
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
