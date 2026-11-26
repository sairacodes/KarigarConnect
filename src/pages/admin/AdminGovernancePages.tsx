import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, Scale, Sliders, XCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { EmptyState, LoadingSkeleton, StatusLabel, formatDate } from '../../components/ui/Components';
import { TierPill, TrustScoreBadge } from '../../components/ui/RatingDisplay';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../i18n/translations';
import { api, getApiErrorMessage } from '../../services/api';
import { TIER_ORDER } from '../../services/storage/trustAndTiers';
import { TierRuleConfig } from '../../services/storage/types';

export function AdminTierQueuePage() {
  const { bi, lang, tierText } = useI18n();
  const { showToast } = useToast();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/admin/tier-queue')
      .then((res) => setApps(res.data.data || []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    try {
      await api.patch(`/admin/tier-queue/${id}`, {
        status,
        adminNotes: notesById[id] || '',
      });
      showToast(
        status === 'APPROVED'
          ? bi('Karigar Tier approved and issued!', 'کاریگر درجہ منظور کر کے جاری کر دیا گیا!')
          : bi('Tier application declined.', 'درجہ کی درخواست مسترد کر دی گئی۔'),
        status === 'APPROVED' ? 'success' : 'info'
      );
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setProcessingId('');
    }
  };

  return (
    <DashboardLayout title={bi('Karigar Tier Approval Queue', 'کاریگر درجہ منظوری قطار')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : apps.length === 0 ? (
        <EmptyState
          title={bi('No tier applications in queue', 'قطار میں کوئی درجہ درخواست نہیں')}
          description={bi(
            'When skilled workers meet verified competency, rating, completed job, and clean-report rules, they appear here for Admin badge sign-off.',
            'جب ہنرمند تصدیق شدہ مہارتوں، ریٹنگ اور مکمل کاموں کی شرائط پوری کر لیتے ہیں تو منظوری کے لیے یہاں آتے ہیں۔'
          )}
        />
      ) : (
        <div className="space-y-4">
          {apps.map((app) => (
            <div key={app.id} className="rounded-2xl kc-glass-card p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/workers/${app.workerPublicId}`}
                      className="text-lg font-bold text-[#17251E] hover:text-[#176B4A] hover:underline"
                    >
                      {app.workerName}
                    </Link>
                    <TierPill tier={app.requestedTier} />
                    <TrustScoreBadge score={app.trustScore ?? 0} compact />
                  </div>
                  <p className="text-xs text-[#78857D] mt-0.5">
                    {app.tradeName} · {app.workerCity} ·{' '}
                    {bi(`Current Tier: ${tierText(app.currentTier)}`, `موجودہ درجہ: ${tierText(app.currentTier)}`)} ·{' '}
                    {formatDate(app.createdAt, lang)}
                  </p>
                </div>
                <StatusLabel status={app.status} />
              </div>

              {app.metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                  <div className="rounded-xl bg-[#F7FAF8] border border-[#E5EEE8] p-2.5">
                    <p className="text-[#78857D]">{bi('Verified Skills', 'تصدیق شدہ مہارتیں')}</p>
                    <p className="font-bold text-[#17251E] tabular-nums">{app.metrics.verifiedCompetencies}</p>
                  </div>
                  <div className="rounded-xl bg-[#F7FAF8] border border-[#E5EEE8] p-2.5">
                    <p className="text-[#78857D]">{bi('Rating', 'ریٹنگ')}</p>
                    <p className="font-bold text-[#17251E] tabular-nums">{app.metrics.rating.toFixed(1)}★</p>
                  </div>
                  <div className="rounded-xl bg-[#F7FAF8] border border-[#E5EEE8] p-2.5">
                    <p className="text-[#78857D]">{bi('Completed Jobs', 'مکمل کام')}</p>
                    <p className="font-bold text-[#17251E] tabular-nums">{app.metrics.completedJobs}</p>
                  </div>
                  <div className="rounded-xl bg-[#F7FAF8] border border-[#E5EEE8] p-2.5">
                    <p className="text-[#78857D]">{bi('Active Months', 'فعال مہینے')}</p>
                    <p className="font-bold text-[#17251E] tabular-nums">{app.metrics.activeMonths}</p>
                  </div>
                  <div className="rounded-xl bg-[#F7FAF8] border border-[#E5EEE8] p-2.5">
                    <p className="text-[#78857D]">{bi('Open Reports', 'کھلی شکایات')}</p>
                    <p className={`font-bold tabular-nums ${app.metrics.unresolvedReports > 0 ? 'text-red-600' : 'text-[#176B4A]'}`}>
                      {app.metrics.unresolvedReports}
                    </p>
                  </div>
                </div>
              )}

              {app.status === 'PENDING' ? (
                <div className="border-t border-[#E5EEE8] pt-3 space-y-2.5">
                  <input
                    type="text"
                    value={notesById[app.id] || ''}
                    onChange={(e) => setNotesById({ ...notesById, [app.id]: e.target.value })}
                    placeholder={bi('Optional Admin review note...', 'اختیاری ایڈمن نوٹ...')}
                    className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-xs"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={processingId === app.id}
                      onClick={() => decide(app.id, 'APPROVED')}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {bi(`Approve ${tierText(app.requestedTier)} Badge`, `${tierText(app.requestedTier)} بیج منظور کریں`)}
                    </button>
                    <button
                      type="button"
                      disabled={processingId === app.id}
                      onClick={() => decide(app.id, 'REJECTED')}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {bi('Reject', 'مسترد کریں')}
                    </button>
                  </div>
                </div>
              ) : (
                app.adminNotes && (
                  <p className="text-xs text-[#78857D]">
                    {bi('Admin Note:', 'ایڈمن نوٹ:')} {app.adminNotes}
                  </p>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export function AdminTierRulesPage() {
  const { bi, tierText } = useI18n();
  const { showToast } = useToast();
  const [rules, setRules] = useState<TierRuleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/admin/tier-rules')
      .then((res) => setRules(res.data.data))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rules) return;
    setSaving(true);
    try {
      const res = await api.put('/admin/tier-rules', rules);
      setRules(res.data.data);
      showToast(bi('Karigar Tier qualification rules updated!', 'کاریگر درجہ بندی کے قوانین محفوظ ہو گئے!'), 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title={bi('Karigar Tier & Badge Rules', 'کاریگر درجہ بندی اور بیج قوانین')}>
      {loading || !rules ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="rounded-2xl kc-glass-card p-5 flex items-start gap-3 text-sm text-[#78857D]">
            <Sliders className="h-5 w-5 text-[#176B4A] shrink-0 mt-0.5" />
            <p>
              {bi(
                'Configure minimum thresholds for Bronze, Silver, Gold, and Platinum Karigar Tiers. Workers must also maintain zero unresolved reports and meet ongoing minimum ratings.',
                'برونز، سلور، گولڈ اور پلاٹینم کاریگر درجوں کے کم از کم معیارات طے کریں۔ ہنرمندوں کے لیے صفر شکایات بھی لازمی ہیں۔'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TIER_ORDER.map((tierKey) => {
              const r = rules[tierKey];
              return (
                <div key={tierKey} className="rounded-2xl kc-glass-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-[#176B4A]" />
                      <h3 className="text-base font-bold text-[#17251E]">{tierText(tierKey)}</h3>
                    </div>
                    <TierPill tier={tierKey} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-[#78857D] mb-1">
                        {bi('Min Verified Skills', 'کم از کم تصدیق شدہ مہارتیں')}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={r.minVerifiedCompetencies}
                        onChange={(e) =>
                          setRules({
                            ...rules,
                            [tierKey]: { ...r, minVerifiedCompetencies: Number(e.target.value) },
                          })
                        }
                        className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#78857D] mb-1">
                        {bi('Min Rating (1–5)', 'کم از کم ریٹنگ')}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min={1}
                        max={5}
                        value={r.minRating}
                        onChange={(e) =>
                          setRules({
                            ...rules,
                            [tierKey]: { ...r, minRating: Number(e.target.value) },
                          })
                        }
                        className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#78857D] mb-1">
                        {bi('Min Completed Jobs', 'کم از کم مکمل کام')}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={r.minCompletedJobs}
                        onChange={(e) =>
                          setRules({
                            ...rules,
                            [tierKey]: { ...r, minCompletedJobs: Number(e.target.value) },
                          })
                        }
                        className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#78857D] mb-1">
                        {bi('Min Active Months', 'کم از کم فعال مہینے')}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={r.minActiveMonths}
                        onChange={(e) =>
                          setRules({
                            ...rules,
                            [tierKey]: { ...r, minActiveMonths: Number(e.target.value) },
                          })
                        }
                        className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block font-semibold text-[#78857D] mb-1">
                        {bi('Badge Validity (Months)', 'بیج کی معیاد (مہینے)')}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={36}
                        value={r.validityMonths}
                        onChange={(e) =>
                          setRules({
                            ...rules,
                            [tierKey]: { ...r, validityMonths: Number(e.target.value) },
                          })
                        }
                        className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#176B4A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
          >
            {saving ? bi('Saving...', 'محفوظ ہو رہا ہے...') : bi('Save Tier Rules', 'درجہ بندی قوانین محفوظ کریں')}
          </button>
        </form>
      )}
    </DashboardLayout>
  );
}

export function AdminDisputesPage() {
  const { bi, lang } = useI18n();
  const { showToast } = useToast();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/admin/disputes')
      .then((res) => setDisputes(res.data.data || []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resolve = async (id: string, status: 'RESOLVED_UPHELD' | 'RESOLVED_DISMISSED') => {
    setProcessingId(id);
    try {
      await api.patch(`/admin/disputes/${id}/resolve`, {
        status,
        adminResolutionNotes: notesById[id] || '',
      });
      showToast(bi('Guarantee dispute resolved.', 'گارنٹی تنازع حل کر دیا گیا۔'), 'success');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setProcessingId('');
    }
  };

  return (
    <DashboardLayout title={bi('7-Day Karigar Guarantee Disputes', '۷ روزہ کاریگر گارنٹی تنازعات')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : disputes.length === 0 ? (
        <EmptyState
          title={bi('No guarantee disputes', 'کوئی گارنٹی تنازع نہیں')}
          description={bi(
            '7-day rework or quality disputes filed by customers on completed jobs will appear here.',
            'مکمل کاموں پر گاہکوں کی جانب سے دائر کردہ ۷ روزہ گارنٹی تنازعات یہاں ظاہر ہوں گے۔'
          )}
        />
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div key={d.id} className="rounded-2xl kc-glass-card p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#78857D]">
                    <Scale className="h-3.5 w-3.5 text-[#176B4A]" />
                    <span>
                      {d.jobTitle} ({d.jobCity}) · {formatDate(d.createdAt, lang)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#17251E] mt-0.5">{d.reason}</h3>
                  <p className="text-xs text-[#78857D]">
                    {bi('Customer:', 'گاہک:')} <strong className="text-[#17251E]">{d.customerName}</strong> ·{' '}
                    {bi('Worker:', 'ہنرمند:')}{' '}
                    <Link to={`/workers/${d.workerPublicId}`} className="font-bold text-[#176B4A] hover:underline">
                      {d.workerName}
                    </Link>
                  </p>
                </div>
                <StatusLabel status={d.status} />
              </div>

              <p className="text-sm text-[#17251E]">{d.details}</p>

              {d.workerResponse && (
                <div className="rounded-xl border border-[#B8E4C7] bg-[#F7FAF8] p-3 text-xs">
                  <strong className="text-[#176B4A]">{bi('Worker Response:', 'ہنرمند کا جواب:')}</strong>{' '}
                  {d.workerResponse}
                </div>
              )}

              {['OPEN', 'WORKER_RESPONDED'].includes(d.status) ? (
                <div className="border-t border-[#E5EEE8] pt-3 space-y-2.5">
                  <input
                    type="text"
                    value={notesById[d.id] || ''}
                    onChange={(e) => setNotesById({ ...notesById, [d.id]: e.target.value })}
                    placeholder={bi('Admin resolution notes (e.g. Free rework scheduled / Claim dismissed)...', 'ایڈمن کے فیصلے کی تفصیل...')}
                    className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-xs"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={processingId === d.id}
                      onClick={() => resolve(d.id, 'RESOLVED_UPHELD')}
                      className="rounded-full bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                    >
                      {bi('Uphold Customer Claim (Flag Tier)', 'گاہک کا مؤقف درست قرار دیں')}
                    </button>
                    <button
                      type="button"
                      disabled={processingId === d.id}
                      onClick={() => resolve(d.id, 'RESOLVED_DISMISSED')}
                      className="rounded-full border border-[#E5EEE8] px-4 py-2 text-xs font-semibold text-[#17251E] hover:bg-[#F7FAF8] disabled:opacity-60"
                    >
                      {bi('Dismiss & Restore Job Completed', 'خارج کریں اور کام بحال کریں')}
                    </button>
                  </div>
                </div>
              ) : (
                d.adminResolutionNotes && (
                  <p className="text-xs text-[#78857D]">
                    <strong>{bi('Admin Resolution:', 'ایڈمن فیصلہ:')}</strong> {d.adminResolutionNotes}
                  </p>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
