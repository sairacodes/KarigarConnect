import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Scale } from 'lucide-react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import {
  BadgeCard,
  EmptyState,
  LoadingSkeleton,
  StatusLabel,
  formatDate,
  formatLevelLabel,
} from '../../components/ui/Components';
import { useToast } from '../../context/ToastContext';
import { api, getApiErrorMessage } from '../../services/api';
import { useI18n } from '../../i18n/translations';

export function MyAssessmentsPage() {
  const { showToast } = useToast();
  const { bi, lang, statusText } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [appealTarget, setAppealTarget] = useState<any>(null);
  const [appealReason, setAppealReason] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/workers/me/assessments')
      .then((res) => setItems(res.data.data || []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const submitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealTarget) return;
    setSubmittingAppeal(true);
    try {
      await api.post(`/workers/me/assessments/${appealTarget.id}/appeal`, { reason: appealReason });
      showToast(bi('Appeal submitted for independent assessor review.', 'نظرثانی کے لیے اپیل جمع کر دی گئی ہے۔'), 'success');
      setAppealTarget(null);
      setAppealReason('');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  return (
    <DashboardLayout title={bi('My Assessments', 'میرے جائزے')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          title={bi('No assessments requested yet', 'ابھی کوئی جائزہ طلب نہیں کیا گیا')}
          description={bi(
            'Upload evidence in your Competency Matrix and click Request Verification to start.',
            'شروع کرنے کے لیے مہارتوں کے صفحے پر ثبوت اپ لوڈ کریں اور تصدیق کی درخواست کریں۔'
          )}
          action={
            <Link to="/worker/matrix" className="rounded-full bg-[#176B4A] px-5 py-2.5 text-sm font-semibold text-white">
              {bi('Open Competency Matrix', 'مہارتوں کی فہرست کھولیں')}
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl kc-glass-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-[#69726B]">
                    {item.tradeName} · {bi('Requested', 'درخواست تاریخ:')} {formatDate(item.requestedAt, lang)}
                  </p>
                  <h3 className="text-lg font-bold text-[#17251E]">{item.competencyTitle}</h3>
                </div>
                <StatusLabel status={item.status} />
              </div>

              {item.status !== 'PENDING' && (
                <div className="mt-4 space-y-4 border-t border-[#E6E0D2] pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[#69726B]">{bi('Assessor', 'ماہرِ جائزہ')}</span>
                      <p className="font-semibold text-[#17251E]">
                        {item.assessorName || bi('Assigned Assessor', 'مقرر کردہ ماہر')}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#69726B]">{bi('Rubric Score', 'معیاری اسکور')}</span>
                      <p className="font-mono font-semibold text-[#17251E] tabular-nums">
                        {item.totalScore} / {item.maxScore} ({item.percentage}%)
                      </p>
                    </div>
                    <div>
                      <span className="text-[#69726B]">{bi('Level Awarded', 'تفویض کردہ درجہ')}</span>
                      <p className="font-semibold text-[#176B4A]">{formatLevelLabel(item.level, lang)}</p>
                    </div>
                    <div>
                      <span className="text-[#69726B]">{bi('Assessed Date', 'جائزے کی تاریخ')}</span>
                      <p className="font-mono text-[#17251E]">{formatDate(item.assessedAt, lang)}</p>
                    </div>
                  </div>

                  {item.feedback && (
                    <div className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] p-3.5 text-sm text-[#17251E]">
                      <span className="font-bold">{bi('Assessor Feedback:', 'ماہر کی رائے:')} </span>
                      {item.feedback}
                    </div>
                  )}

                  {item.scores?.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-start text-xs">
                        <thead>
                          <tr className="border-b border-[#E6E0D2] text-[#69726B]">
                            <th className="py-2 pe-4 font-semibold">{bi('Criterion', 'معیار')}</th>
                            <th className="py-2 pe-4 font-semibold">{bi('Safety', 'حفاظت')}</th>
                            <th className="py-2 text-end font-semibold">{bi('Score', 'اسکور')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6E0D2]">
                          {item.scores.map((s: any, i: number) => (
                            <tr key={i}>
                              <td className="py-2 pe-4 text-[#17251E]">{s.criterionTitle}</td>
                              <td className="py-2 pe-4 text-[#69726B]">
                                {s.isSafetyCritical ? bi('Safety-Critical', 'حفاظتی لازم') : bi('Standard', 'معیاری')}
                              </td>
                              <td className="py-2 text-end font-mono font-semibold text-[#176B4A] tabular-nums">
                                {s.score} / {s.maxScore}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {item.status === 'NEEDS_MORE_EVIDENCE' && (
                      <Link
                        to={`/worker/evidence?competencyId=${item.competencyId}`}
                        className="rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B]"
                      >
                        {bi('Upload Additional Evidence & Resubmit', 'مزید ثبوت اپ لوڈ کر کے دوبارہ بھیجیں')}
                      </Link>
                    )}
                    {(item.status === 'NOT_VERIFIED' || item.status === 'NEEDS_MORE_EVIDENCE') && !item.isAppealed && (
                      <button
                        type="button"
                        onClick={() => setAppealTarget(item)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#E6E0D2] bg-[#F7F4EC] px-4 py-2 text-xs font-semibold text-[#17251E] hover:bg-[#ECE6D7]/50"
                      >
                        <Scale className="h-3.5 w-3.5 text-[#176B4A]" />
                        {bi('Appeal Decision', 'فیصلے پر اپیل کریں')}
                      </button>
                    )}
                    {item.isAppealed && (
                      <span className="text-xs font-medium text-amber-700">
                        {bi('Appeal Status:', 'اپیل کی صورتحال:')} {statusText(item.appealStatus || 'PENDING')}{' '}
                        {bi('(assigned to a different assessor)', '(دوسرے ماہر کو تفویض)')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {appealTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251E]/45 backdrop-blur-[2px] p-4">
          <form onSubmit={submitAppeal} className="w-full max-w-md rounded-2xl kc-glass-card p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-[#17251E]">{bi('Appeal Assessment Decision', 'جائزے کے فیصلے پر اپیل')}</h3>
            <p className="text-xs text-[#69726B]">
              {bi(
                'Your appeal for',
                'آپ کی اپیل برائے'
              )}{' '}
              <strong className="text-[#17251E]">{appealTarget.competencyTitle}</strong>{' '}
              {bi(
                'will be routed to a different approved assessor. The original assessor cannot review their own decision.',
                'کسی دوسرے منظور شدہ ماہر کو بھیجی جائے گی۔ اصل ماہر اپنے فیصلے کا دوبارہ جائزہ نہیں لے سکتا۔'
              )}
            </p>
            <textarea
              rows={4}
              required
              minLength={10}
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder={bi(
                'Explain why you believe the rubric evaluation should be re-reviewed...',
                'وضاحت کریں کہ اس جائزے پر دوبارہ غور کیوں ضروری ہے...'
              )}
              className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAppealTarget(null)}
                className="rounded-full border border-[#E6E0D2] px-4 py-2 text-sm font-semibold text-[#17251E]"
              >
                {bi('Cancel', 'منسوخ کریں')}
              </button>
              <button
                type="submit"
                disabled={submittingAppeal}
                className="rounded-full bg-[#176B4A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
              >
                {submittingAppeal ? bi('Submitting...', 'جمع ہو رہا ہے...') : bi('Submit Appeal', 'اپیل جمع کرائیں')}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}

export function MyBadgesPage() {
  const { showToast } = useToast();
  const { bi } = useI18n();
  const [badges, setBadges] = useState<any[]>([]);
  const [publicId, setPublicId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/workers/me/badges'), api.get('/workers/me')])
      .then(([bRes, mRes]) => {
        setBadges(bRes.data.data || []);
        setPublicId(mRes.data.data?.publicId || '');
      })
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, []);

  const copyPortfolioLink = () => {
    if (!publicId) return;
    navigator.clipboard.writeText(`${window.location.origin}/workers/${publicId}`);
    showToast(bi('Public portfolio link copied.', 'عوامی پورٹ فولیو لنک کاپی ہو گیا۔'), 'success');
  };

  return (
    <DashboardLayout title={bi('My Verified Badges', 'میرے تصدیق شدہ بیجز')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : badges.length === 0 ? (
        <EmptyState
          title={bi('No verified competency badges yet', 'ابھی کوئی تصدیق شدہ بیج موجود نہیں')}
          description={bi(
            'Once an approved assessor verifies your competency evidence, your 12-month badge will appear here.',
            'جیسے ہی منظور شدہ ماہر آپ کے ثبوت کی تصدیق کرے گا، ۱۲ ماہ کا بیج یہاں نظر آئے گا۔'
          )}
          action={
            <Link to="/worker/matrix" className="rounded-full bg-[#176B4A] px-5 py-2.5 text-sm font-semibold text-white">
              {bi('Go to Competency Matrix', 'مہارتوں کی فہرست پر جائیں')}
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#D8D0BE] bg-gradient-to-r from-white/95 to-[#ECE6D7]/70 backdrop-blur-md p-5 kc-card-shadow">
            <div>
              <h2 className="text-base font-bold text-[#17251E]">
                {bi('Share Your Verified Credentials', 'اپنی تصدیق شدہ مہارتیں شیئر کریں')}
              </h2>
              <p className="text-xs text-[#69726B]">
                {bi(
                  'Badges are valid for 12 months per competency and do not represent government accreditation.',
                  'ہر مہارت کے بیج ۱۲ ماہ کے لیے مؤثر ہوتے ہیں اور سرکاری سند کی نمائندگی نہیں کرتے۔'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={copyPortfolioLink}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#13563B] whitespace-nowrap shrink-0"
            >
              <Copy className="h-3.5 w-3.5" />
              {bi('Copy Portfolio Link', 'پورٹ فولیو لنک کاپی کریں')}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {badges.map((b) => (
              <BadgeCard key={b.id} {...b} />
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
