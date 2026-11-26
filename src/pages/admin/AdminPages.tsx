import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ConfirmDialog, EmptyState, LoadingSkeleton, StatusLabel, formatDate } from '../../components/ui/Components';
import {
  AnimatedBarChart,
  BarDatum,
  HorizontalProgressBar,
  SemiCircleGauge,
  StatKpiCard,
} from '../../components/ui/DataViz';
import { useToast } from '../../context/ToastContext';
import { SERVICE_GROUPS } from '../../data/serviceCatalog';
import { api, getApiErrorMessage } from '../../services/api';
import { useI18n } from '../../i18n/translations';

export function AdminDashboard() {
  const { showToast } = useToast();
  const { bi, lang } = useI18n();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((res) => setData(res.data.data))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, []);

  const maxBadgeCount = Math.max(1, ...(data?.badgesByTrade || []).map((b: any) => b.count));

  const badgeChartData: BarDatum[] = (data?.badgesByTrade || []).map((row: any, idx: number) => ({
    label: row.tradeName,
    shortLabel: row.tradeName.slice(0, 6),
    value: row.count,
    variant: idx === 0 ? 'dark' : idx === 1 ? 'medium' : idx === 2 ? 'light' : 'hatched',
  }));

  const totalPendingGovernance =
    (data?.stats?.pendingAssessors || 0) +
    (data?.stats?.pendingReports || 0) +
    (data?.stats?.pendingTierApprovals || 0) +
    (data?.stats?.pendingDisputes || 0);
  const workerSharePct =
    data?.stats?.totalUsers > 0
      ? Math.round((data.stats.totalWorkers / data.stats.totalUsers) * 100)
      : 0;

  return (
    <DashboardLayout title={bi('Admin Dashboard', 'ایڈمن ڈیش بورڈ')}>
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : !data ? null : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#17251E]">
                {bi('Platform Overview & Governance', 'پلیٹ فارم کا جائزہ اور نگرانی')}
              </h2>
              <p className="mt-1 text-sm text-[#78857D]">
                {bi(
                  'Monitor verified badges, Karigar tier upgrades, guarantee disputes, assessor approvals, and audit logs.',
                  'تصدیق شدہ بیجز، کاریگر درجے، گارنٹی تنازعات، ماہرین کی منظوری اور آڈٹ لاگز کی نگرانی کریں۔'
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/admin/tiers"
                className="rounded-full bg-[#176B4A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#13563B] whitespace-nowrap"
              >
                {bi('Tier Queue', 'درجہ قطار')} ({data.stats.pendingTierApprovals || 0})
              </Link>
              <Link
                to="/admin/disputes"
                className="rounded-full border border-[#B8E4C7] bg-[#DDF3E4]/65 px-4 py-2.5 text-xs font-semibold text-[#176B4A] hover:bg-[#DDF3E4] whitespace-nowrap"
              >
                {bi('Guarantee Disputes', 'گارنٹی تنازعات')} ({data.stats.pendingDisputes || 0})
              </Link>
              <Link
                to="/admin/assessors"
                className="rounded-full border border-[#E5EEE8] kc-glass-card px-4 py-2.5 text-xs font-semibold text-[#17251E] hover:bg-[#DDF3E4]/50 whitespace-nowrap"
              >
                {bi('Assessors', 'ماہرین')} ({data.stats.pendingAssessors})
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatKpiCard
              highlighted
              label={bi('Total Platform Users', 'کل صارفین')}
              value={data.stats.totalUsers}
              sublabel={bi(
                `${data.stats.totalWorkers} Workers · ${data.stats.totalEmployers} Customers · ${data.stats.totalAssessors} Assessors`,
                `${data.stats.totalWorkers} ہنرمند · ${data.stats.totalEmployers} گاہک/آجِر · ${data.stats.totalAssessors} ماہرین`
              )}
              icon={Users}
              to="/admin/users"
            />
            <StatKpiCard
              label={bi('Verified Badges & Jobs', 'تصدیق شدہ بیجز اور کام')}
              value={data.stats.verifiedCompetencies}
              sublabel={bi(
                `${data.stats.completedJobs || 0} completed of ${data.stats.totalJobs || 0} jobs`,
                `${data.stats.totalJobs || 0} میں سے ${data.stats.completedJobs || 0} مکمل کام`
              )}
              icon={Award}
              to="/admin/competencies"
            />
            <StatKpiCard
              label={bi('Tier & Assessor Queue', 'درجہ اور ماہر منظوری قطار')}
              value={(data.stats.pendingTierApprovals || 0) + (data.stats.pendingAssessors || 0)}
              sublabel={bi(
                `${data.stats.pendingTierApprovals || 0} tiers · ${data.stats.pendingAssessors} assessors`,
                `${data.stats.pendingTierApprovals || 0} درجے · ${data.stats.pendingAssessors} ماہرین`
              )}
              icon={UserCheck}
              to="/admin/tiers"
            />
            <StatKpiCard
              label={bi('Reports & Disputes', 'شکایات اور تنازعات')}
              value={(data.stats.pendingReports || 0) + (data.stats.pendingDisputes || 0)}
              sublabel={bi(
                `${data.stats.pendingReports} moderation · ${data.stats.pendingDisputes || 0} rework disputes`,
                `${data.stats.pendingReports} رپورٹس · ${data.stats.pendingDisputes || 0} تنازعات`
              )}
              icon={ShieldAlert}
              to="/admin/reports"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <AnimatedBarChart
                title={bi('Verified Badges by Category', 'شعبے کے لحاظ سے تصدیق شدہ بیجز')}
                subtitle={bi('Active competency badges issued per service category', 'ہر سروس شعبے میں جاری کردہ فعال بیجز')}
                data={badgeChartData}
              />
            </div>

            <div className="lg:col-span-4">
              <SemiCircleGauge
                title={bi('Worker Representation', 'ہنرمندوں کا تناسب')}
                percentage={workerSharePct}
                caption={bi(
                  `${data.stats.totalWorkers} of ${data.stats.totalUsers} accounts`,
                  `${data.stats.totalUsers} میں سے ${data.stats.totalWorkers} اکاؤنٹس`
                )}
                primaryLabel={bi('Skilled Workers', 'ہنرمند افراد')}
                secondaryLabel={bi('Customers / Assessors / Admin', 'گاہک / ماہرین / ایڈمن')}
              />
            </div>

            <div className="lg:col-span-3 kc-dark-surface rounded-2xl p-5 sm:p-6 text-white flex flex-col justify-between kc-hover-lift">
              <div>
                <p className="text-xs font-semibold text-[#73C99B]">{bi('Governance Queue', 'انتظامی قطار')}</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums">{totalPendingGovernance}</p>
                <p className="mt-1.5 text-xs text-[#B8E4C7]/85 leading-relaxed">
                  {bi(
                    'Open governance items across tier upgrades, guarantee disputes, assessors, and safety/moderation reports.',
                    'درجہ ترقی، گارنٹی تنازعات، ماہرین اور شکایات کے لیے کھلے معاملات۔'
                  )}
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  to="/admin/reports"
                  className="inline-flex items-center justify-center rounded-full bg-[#399B6B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#176B4A] transition-colors"
                >
                  {bi('Open Reports & SOS', 'رپورٹس کھولیں')} ({data.stats.pendingReports})
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-5 rounded-2xl kc-glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#17251E]">
                  {bi('Trade Verification Coverage', 'پیشوں کے لحاظ سے تصدیق')}
                </h2>
                <Award className="h-4 w-4 text-[#176B4A]" />
              </div>
              <div className="space-y-3.5">
                {data.badgesByTrade.map((row: any) => (
                  <div key={row.tradeName}>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-[#17251E]">{row.tradeName}</span>
                      <span className="font-mono tabular-nums text-[#176B4A]">{row.count}</span>
                    </div>
                    <HorizontalProgressBar value={row.count} max={maxBadgeCount} heightClass="h-2.5" />
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 rounded-2xl kc-glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#17251E]">
                  {bi('Recent Platform Activity', 'پلیٹ فارم کی حالیہ سرگرمی')}
                </h2>
                <Link to="/admin/audit-logs" className="text-xs font-semibold text-[#176B4A] hover:underline">
                  {bi('Full Log →', 'مکمل لاگ ←')}
                </Link>
              </div>
              <div className="divide-y divide-[#E5EEE8]">
                {data.recentActivity.map((act: any) => (
                  <div key={act.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                    <div>
                      <p className="font-bold text-[#17251E]">{act.action.replace(/_/g, ' ')}</p>
                      <p className="text-[#78857D]">{act.description}</p>
                    </div>
                    <span className="font-mono text-[#78857D] whitespace-nowrap">{formatDate(act.createdAt, lang)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export function UserManagementPage() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { bi, roleText } = useI18n();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [role, setRole] = useState('');
  const [confirmUser, setConfirmUser] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  const loadUsers = (overrideQ?: string) => {
    setLoading(true);
    const activeQ = overrideQ !== undefined ? overrideQ : q;
    api
      .get('/admin/users', { params: { q: activeQ || undefined, role: role || undefined } })
      .then((res) => setUsers(res.data.data || []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const paramQ = searchParams.get('q') || '';
    setQ(paramQ);
    loadUsers(paramQ);
  }, [role, searchParams]);

  const handleToggleStatus = async () => {
    if (!confirmUser) return;
    const nextStatus = confirmUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setUpdating(true);
    try {
      await api.patch(`/admin/users/${confirmUser.id}/status`, { status: nextStatus });
      showToast(
        nextStatus === 'ACTIVE'
          ? bi('User account reactivated.', 'صارف کا اکاؤنٹ بحال کر دیا گیا۔')
          : bi('User account suspended.', 'صارف کا اکاؤنٹ معطل کر دیا گیا۔'),
        'success'
      );
      setConfirmUser(null);
      loadUsers();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DashboardLayout title={bi('User Management', 'صارفین کا انتظام')}>
      <div className="space-y-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadUsers();
          }}
          className="rounded-2xl kc-glass-card p-4 flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute start-3.5 top-2.5 h-4 w-4 text-[#78857D]" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={bi('Search user name, email, or city...', 'صارف کا نام، ای میل یا شہر تلاش کریں...')}
              className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] ps-9 pe-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
          >
            <option value="">{bi('All Roles', 'تمام کردار')}</option>
            <option value="WORKER">{bi('Workers', 'ہنرمند')}</option>
            <option value="EMPLOYER">{bi('Customers / Employers', 'گاہک / آجِر')}</option>
            <option value="ASSESSOR">{bi('Assessors', 'ماہرین')}</option>
            <option value="ADMIN">{bi('Admins', 'ایڈمن')}</option>
          </select>
          <button type="submit" className="rounded-full bg-[#176B4A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#13563B]">
            {bi('Filter', 'فلٹر')}
          </button>
        </form>

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : (
          <div className="rounded-2xl kc-glass-card overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-[#E5EEE8] bg-[#F7FAF8] text-xs font-semibold text-[#78857D]">
                  <th className="px-4 py-3">{bi('User', 'صارف')}</th>
                  <th className="px-4 py-3">{bi('Role', 'کردار')}</th>
                  <th className="px-4 py-3">{bi('City', 'شہر')}</th>
                  <th className="px-4 py-3">{bi('Status', 'حالت')}</th>
                  <th className="px-4 py-3 text-end">{bi('Actions', 'اقدامات')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EEE8]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F7FAF8]/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#17251E]">{u.fullName}</p>
                      <p className="text-xs text-[#78857D]">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-[#17251E]">{roleText(u.role)}</td>
                    <td className="px-4 py-3 text-xs text-[#78857D]">{u.city}</td>
                    <td className="px-4 py-3">
                      <StatusLabel status={u.status} />
                    </td>
                    <td className="px-4 py-3 text-end whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {u.workerPublicId && (
                          <Link
                            to={`/workers/${u.workerPublicId}`}
                            className="text-xs font-semibold text-[#176B4A] hover:underline"
                          >
                            {bi('Portfolio', 'پورٹ فولیو')}
                          </Link>
                        )}
                        {u.role !== 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => setConfirmUser(u)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              u.status === 'ACTIVE'
                                ? 'border-red-200 text-red-700 hover:bg-red-50'
                                : 'border-[#B8E4C7] text-[#176B4A] hover:bg-[#DDF3E4]/60'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? bi('Suspend', 'معطل کریں') : bi('Reactivate', 'بحال کریں')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirmUser)}
        title={
          confirmUser?.status === 'ACTIVE'
            ? bi('Suspend User Account', 'صارف اکاؤنٹ معطل کریں')
            : bi('Reactivate User Account', 'صارف اکاؤنٹ بحال کریں')
        }
        message={bi(
          `${confirmUser?.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'} ${confirmUser?.fullName} (${confirmUser?.email})?`,
          `کیا آپ ${confirmUser?.fullName} (${confirmUser?.email}) کا اکاؤنٹ ${confirmUser?.status === 'ACTIVE' ? 'معطل' : 'بحال'} کرنا چاہتے ہیں؟`
        )}
        confirmLabel={confirmUser?.status === 'ACTIVE' ? bi('Suspend', 'معطل کریں') : bi('Reactivate', 'بحال کریں')}
        destructive={confirmUser?.status === 'ACTIVE'}
        loading={updating}
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmUser(null)}
      />
    </DashboardLayout>
  );
}

export function AssessorApplicationsPage() {
  const { showToast } = useToast();
  const { bi, isUr } = useI18n();
  const [assessors, setAssessors] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTradeMap, setSelectedTradeMap] = useState<Record<string, string[]>>({});
  const [processingId, setProcessingId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, tRes] = await Promise.all([api.get('/admin/assessors'), api.get('/admin/trades')]);
      const list = aRes.data.data || [];
      setAssessors(list);
      setTrades(tRes.data.data || []);
      const map: Record<string, string[]> = {};
      for (const a of list) {
        map[a.id] = a.approvedTradeIds.length > 0 ? a.approvedTradeIds : a.appliedTradeIds;
      }
      setSelectedTradeMap(map);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleTrade = (assessorId: string, tradeId: string) => {
    setSelectedTradeMap((prev) => {
      const curr = prev[assessorId] || [];
      return {
        ...prev,
        [assessorId]: curr.includes(tradeId) ? curr.filter((id) => id !== tradeId) : [...curr, tradeId],
      };
    });
  };

  const handleDecision = async (assessorId: string, approvalStatus: 'APPROVED' | 'REJECTED' | 'REVOKED') => {
    setProcessingId(assessorId);
    try {
      await api.patch(`/admin/assessors/${assessorId}/approval`, {
        approvalStatus,
        approvedTradeIds: selectedTradeMap[assessorId] || [],
        rejectionReason: approvalStatus === 'REJECTED' ? 'Insufficient trade evidence provided.' : '',
      });
      showToast(bi(`Assessor ${approvalStatus.toLowerCase()}.`, 'ماہر کی درخواست اپ ڈیٹ ہو گئی۔'), 'success');
      await load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setProcessingId('');
    }
  };

  return (
    <DashboardLayout title={bi('Assessor Applications', 'ماہرین کی درخواستیں')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : assessors.length === 0 ? (
        <EmptyState
          title={bi('No assessor profiles', 'ماہرین کا کوئی پروفائل نہیں')}
          description={bi('Assessor applications will appear here when submitted.', 'جمع کرائی گئی ماہرین کی درخواستیں یہاں نظر آئیں گی۔')}
        />
      ) : (
        <div className="space-y-4">
          {assessors.map((a) => (
            <div key={a.id} className="rounded-2xl kc-glass-card kc-hover-lift p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-[#17251E]">{a.fullName}</h3>
                  <p className="text-xs text-[#78857D]">
                    {a.email} · {a.city} · {a.yearsExperience} {bi('yrs experience', 'سال تجربہ')}
                  </p>
                </div>
                <StatusLabel status={a.approvalStatus} />
              </div>

              <div className="text-sm text-[#78857D] space-y-1">
                <p>
                  <strong className="text-[#17251E]">{bi('Qualifications:', 'اسناد و قابلیت:')}</strong>{' '}
                  {a.qualifications || bi('Not provided yet', 'درج نہیں کی گئیں')}
                </p>
                <p>
                  <strong className="text-[#17251E]">{bi('Biography:', 'تعارف:')}</strong>{' '}
                  {a.bio || bi('Not provided yet', 'درج نہیں کیا گیا')}
                </p>
              </div>

              <div className="border-t border-[#E5EEE8] pt-3">
                <p className="text-xs font-bold text-[#17251E] mb-2">
                  {bi('Assign Approved Categories:', 'منظور شدہ شعبے تفویض کریں:')} ({(selectedTradeMap[a.id] || []).length})
                </p>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-[#E5EEE8] bg-[#F7FAF8]/70 p-3 space-y-3">
                  {SERVICE_GROUPS.map((grp) => {
                    const grpTrades = trades.filter((t) => (t.group || 'Home Repair & Maintenance') === grp.group);
                    if (grpTrades.length === 0) return null;
                    return (
                      <div key={grp.group}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#176B4A] mb-1.5">
                          {isUr ? grp.urduGroup : grp.group}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {grpTrades.map((t) => {
                            const checked = (selectedTradeMap[a.id] || []).includes(t.id);
                            return (
                              <label
                                key={t.id}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs cursor-pointer transition-colors ${
                                  checked
                                    ? 'border-[#176B4A] bg-[#DDF3E4]/80 text-[#176B4A] font-semibold'
                                    : 'border-[#E5EEE8] bg-white text-[#78857D]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleTrade(a.id, t.id)}
                                  className="h-3 w-3 rounded accent-[#176B4A]"
                                />
                                <span>{isUr && t.urduName ? t.urduName : t.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={processingId === a.id}
                  onClick={() => handleDecision(a.id, 'APPROVED')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  {a.approvalStatus === 'APPROVED'
                    ? bi('Update Assigned Trades', 'تفویض کردہ پیشے اپ ڈیٹ کریں')
                    : bi('Approve Assessor', 'ماہر کو منظور کریں')}
                </button>
                {a.approvalStatus === 'PENDING' && (
                  <button
                    type="button"
                    disabled={processingId === a.id}
                    onClick={() => handleDecision(a.id, 'REJECTED')}
                    className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    {bi('Reject', 'مسترد کریں')}
                  </button>
                )}
                {a.approvalStatus === 'APPROVED' && (
                  <button
                    type="button"
                    disabled={processingId === a.id}
                    onClick={() => handleDecision(a.id, 'REVOKED')}
                    className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    {bi('Revoke Approval', 'منظوری منسوخ کریں')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export function TradeManagementPage() {
  const { showToast } = useToast();
  const { bi, isUr } = useI18n();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState('');
  const [form, setForm] = useState({
    name: '',
    urduName: '',
    group: SERVICE_GROUPS[0].group,
    description: '',
    icon: 'wrench',
    isActive: true,
    priceGuide: [] as Array<{ id: string; serviceLabel: string; serviceUrduLabel: string; minPkr: number; maxPkr: number; unit: string }>,
  });

  const load = () => {
    setLoading(true);
    api
      .get('/admin/trades')
      .then((res) => setTrades(res.data.data || []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      urduName: '',
      group: SERVICE_GROUPS[0].group,
      description: '',
      icon: 'wrench',
      isActive: true,
      priceGuide: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const grpMeta = SERVICE_GROUPS.find((g) => g.group === form.group);
    const payload = {
      ...form,
      urduGroup: grpMeta?.urduGroup || '',
      priceGuide: form.priceGuide.filter((pg) => pg.serviceLabel.trim() && pg.maxPkr >= pg.minPkr),
    };
    try {
      if (editingId) {
        await api.put(`/admin/trades/${editingId}`, payload);
        showToast(bi('Category & Fair Price Guide updated.', 'شعبہ اور مناسب قیمت نامہ اپ ڈیٹ ہو گیا۔'), 'success');
      } else {
        await api.post('/admin/trades', payload);
        showToast(bi('Category added.', 'نیا شعبہ شامل ہو گیا۔'), 'success');
      }
      resetForm();
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const toggleActive = async (trade: any) => {
    try {
      await api.put(`/admin/trades/${trade.id}`, {
        name: trade.name,
        urduName: trade.urduName,
        group: trade.group,
        urduGroup: trade.urduGroup,
        description: trade.description,
        icon: trade.icon,
        priceGuide: trade.priceGuide,
        isActive: !trade.isActive,
      });
      showToast(
        !trade.isActive ? bi('Category activated.', 'شعبہ فعال کر دیا گیا۔') : bi('Category deactivated.', 'شعبہ غیر فعال کر دیا گیا۔'),
        'info'
      );
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const filteredTrades = groupFilter
    ? trades.filter((t) => (t.group || 'Home Repair & Maintenance') === groupFilter)
    : trades;

  return (
    <DashboardLayout title={bi('Service Categories & Fair Price Guide', 'سروس شعبے اور مناسب قیمت نامہ')}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form onSubmit={handleSubmit} className="lg:col-span-5 rounded-2xl kc-glass-card p-6 space-y-4 h-fit">
          <h2 className="text-base font-bold text-[#17251E]">
            {editingId ? bi('Edit Category & Price Guide', 'شعبہ اور قیمت نامے میں ترمیم') : bi('Add New Service Category', 'نیا سروس شعبہ شامل کریں')}
          </h2>
          <div>
            <label className="block text-xs font-semibold text-[#17251E] mb-1">{bi('Service Group', 'سروس گروپ')}</label>
            <select
              value={form.group}
              onChange={(e) => setForm({ ...form, group: e.target.value })}
              className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
            >
              {SERVICE_GROUPS.map((g) => (
                <option key={g.group} value={g.group}>
                  {isUr ? `${g.urduGroup} (${g.group})` : g.group}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#17251E] mb-1">{bi('Category Name', 'شعبے کا نام')}</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17251E] mb-1">{bi('Urdu Label', 'اردو نام')}</label>
              <input
                type="text"
                value={form.urduName}
                onChange={(e) => setForm({ ...form, urduName: e.target.value })}
                className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#17251E] mb-1">{bi('Description', 'تفصیل')}</label>
            <textarea
              rows={2}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
            />
          </div>

          <div className="border-t border-[#E5EEE8] pt-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#17251E]">
                {bi('Fair Price Guide Benchmarks (PKR)', 'مناسب قیمت نامہ (PKR)')}
              </span>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    priceGuide: [
                      ...form.priceGuide,
                      { id: `pg_${Date.now()}`, serviceLabel: '', serviceUrduLabel: '', minPkr: 800, maxPkr: 2000, unit: 'per job' },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#176B4A] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                {bi('Add Price Row', 'نرخ شامل کریں')}
              </button>
            </div>
            {form.priceGuide.map((pg, idx) => (
              <div key={pg.id} className="rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] p-2.5 space-y-1.5 text-xs">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder={bi('Task name (EN)', 'کام (انگریزی)')}
                    value={pg.serviceLabel}
                    onChange={(e) => {
                      const next = [...form.priceGuide];
                      next[idx].serviceLabel = e.target.value;
                      setForm({ ...form, priceGuide: next });
                    }}
                    className="flex-1 rounded-lg border border-[#E5EEE8] bg-white px-2 py-1"
                  />
                  <input
                    type="text"
                    placeholder={bi('Urdu label', 'اردو')}
                    value={pg.serviceUrduLabel}
                    onChange={(e) => {
                      const next = [...form.priceGuide];
                      next[idx].serviceUrduLabel = e.target.value;
                      setForm({ ...form, priceGuide: next });
                    }}
                    className="flex-1 rounded-lg border border-[#E5EEE8] bg-white px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, priceGuide: form.priceGuide.filter((_, i) => i !== idx) })}
                    className="text-red-600 px-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="number"
                    min={0}
                    placeholder="Min PKR"
                    value={pg.minPkr}
                    onChange={(e) => {
                      const next = [...form.priceGuide];
                      next[idx].minPkr = Number(e.target.value);
                      setForm({ ...form, priceGuide: next });
                    }}
                    className="rounded-lg border border-[#E5EEE8] bg-white px-2 py-1"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Max PKR"
                    value={pg.maxPkr}
                    onChange={(e) => {
                      const next = [...form.priceGuide];
                      next[idx].maxPkr = Number(e.target.value);
                      setForm({ ...form, priceGuide: next });
                    }}
                    className="rounded-lg border border-[#E5EEE8] bg-white px-2 py-1"
                  />
                  <input
                    type="text"
                    placeholder="per job"
                    value={pg.unit}
                    onChange={(e) => {
                      const next = [...form.priceGuide];
                      next[idx].unit = e.target.value;
                      setForm({ ...form, priceGuide: next });
                    }}
                    className="rounded-lg border border-[#E5EEE8] bg-white px-2 py-1"
                  />
                </div>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded accent-[#176B4A]"
            />
            <span>{bi('Active on platform', 'پلیٹ فارم پر فعال')}</span>
          </label>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 rounded-full bg-[#176B4A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#13563B]">
              {editingId ? bi('Update Category', 'شعبہ اپ ڈیٹ کریں') : bi('Add Category', 'شعبہ شامل کریں')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-[#E5EEE8] px-4 py-2 text-sm"
              >
                {bi('Cancel', 'منسوخ')}
              </button>
            )}
          </div>
        </form>

        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl kc-glass-card p-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#17251E]">
              {filteredTrades.length} {bi('Categories', 'شعبے')}
            </span>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-1.5 text-xs"
            >
              <option value="">{bi('All 8 Service Groups', 'تمام ۸ گروپس')}</option>
              {SERVICE_GROUPS.map((g) => (
                <option key={g.group} value={g.group}>
                  {isUr ? g.urduGroup : g.group}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <LoadingSkeleton rows={3} />
          ) : (
            filteredTrades.map((t) => (
              <div key={t.id} className="rounded-2xl kc-glass-card kc-hover-lift p-5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#399B6B]">
                      {isUr && t.urduGroup ? t.urduGroup : t.group || 'Home Repair & Maintenance'}
                    </p>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#17251E]">
                        {t.name} {t.urduName ? `(${t.urduName})` : ''}
                      </h3>
                      <StatusLabel status={t.isActive ? 'ACTIVE' : 'SUSPENDED'} />
                    </div>
                    <p className="mt-1 text-xs text-[#78857D]">{t.description}</p>
                    <p className="mt-1 text-xs font-medium text-[#176B4A]">
                      {t.competencies?.length || 0} {bi('competencies', 'مہارتیں')} · {t.priceGuide?.length || 0}{' '}
                      {bi('price benchmarks', 'قیمت نامہ')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(t.id);
                        setForm({
                          name: t.name,
                          urduName: t.urduName || '',
                          group: t.group || SERVICE_GROUPS[0].group,
                          description: t.description,
                          icon: t.icon || 'wrench',
                          isActive: t.isActive,
                          priceGuide: t.priceGuide || [],
                        });
                      }}
                      className="rounded-full border border-[#E5EEE8] bg-[#F7FAF8] px-3.5 py-1.5 text-xs font-semibold text-[#17251E] hover:bg-[#DDF3E4]/50"
                    >
                      {bi('Edit & Prices', 'ترمیم و قیمت')}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(t)}
                      className="rounded-full border border-[#E5EEE8] bg-[#F7FAF8] px-3.5 py-1.5 text-xs font-semibold text-[#17251E] hover:bg-[#DDF3E4]/50"
                    >
                      {t.isActive ? bi('Deactivate', 'غیر فعال') : bi('Activate', 'فعال')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export function CompetencyManagementPage() {
  const { showToast } = useToast();
  const { bi, isUr } = useI18n();
  const [trades, setTrades] = useState<any[]>([]);
  const [selectedTradeId, setSelectedTradeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  const [compForm, setCompForm] = useState({
    title: '',
    urduTitle: '',
    description: '',
    orderIndex: 1,
    isActive: true,
    criteria: [{ id: undefined as string | undefined, title: '', description: '', isSafetyCritical: false, maxScore: 3 }],
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/trades');
      const list = res.data.data || [];
      setTrades(list);
      if (!selectedTradeId && list.length > 0) setSelectedTradeId(list[0].id);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const currentTrade = trades.find((t) => t.id === selectedTradeId);

  const handleSaveCompetency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTradeId) return;
    try {
      const payload = {
        tradeId: selectedTradeId,
        ...compForm,
        orderIndex: Number(compForm.orderIndex),
        criteria: compForm.criteria.map((c, i) => ({ ...c, orderIndex: i + 1 })),
      };
      if (editingCompId) {
        await api.put(`/admin/competencies/${editingCompId}`, payload);
        showToast(bi('Competency and rubric criteria updated.', 'مہارت اور معیارات اپ ڈیٹ ہو گئے۔'), 'success');
      } else {
        await api.post('/admin/competencies', payload);
        showToast(bi('Competency added.', 'مہارت شامل کر دی گئی۔'), 'success');
      }
      setEditingCompId(null);
      setCompForm({
        title: '',
        urduTitle: '',
        description: '',
        orderIndex: (currentTrade?.competencies?.length || 0) + 1,
        isActive: true,
        criteria: [{ id: undefined, title: '', description: '', isSafetyCritical: false, maxScore: 3 }],
      });
      await load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const startEdit = (comp: any) => {
    setEditingCompId(comp.id);
    setCompForm({
      title: comp.title,
      urduTitle: comp.urduTitle || '',
      description: comp.description,
      orderIndex: comp.orderIndex,
      isActive: comp.isActive,
      criteria: (comp.criteria || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        isSafetyCritical: r.isSafetyCritical,
        maxScore: r.maxScore,
      })),
    });
  };

  return (
    <DashboardLayout title={bi('Competency & Rubric Management', 'مہارتوں اور معیارات کا انتظام')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl kc-glass-card p-4">
            <span className="text-sm font-bold text-[#17251E]">{bi('Select Trade:', 'پیشہ منتخب کریں:')}</span>
            {trades.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTradeId(t.id);
                  setEditingCompId(null);
                }}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  selectedTradeId === t.id
                    ? 'bg-[#176B4A] text-white'
                    : 'border border-[#E5EEE8] bg-[#F7FAF8] text-[#17251E] hover:bg-[#DDF3E4]/50'
                }`}
              >
                {isUr && t.urduName ? t.urduName : t.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6 space-y-3">
              <h2 className="text-base font-bold text-[#17251E]">
                {currentTrade?.name} {bi('Competencies', 'مہارتیں')} ({currentTrade?.competencies?.length || 0})
              </h2>
              {(currentTrade?.competencies || []).map((c: any) => (
                <div key={c.id} className="rounded-2xl kc-glass-card kc-hover-lift p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#17251E]">
                        {isUr && c.urduTitle ? c.urduTitle : c.title}
                      </h3>
                      <p className="text-xs text-[#78857D]">{c.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="rounded-full border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-1 text-xs font-semibold text-[#17251E] hover:bg-[#DDF3E4]/50"
                    >
                      {bi('Edit', 'ترمیم')}
                    </button>
                  </div>
                  <div className="border-t border-[#E5EEE8] pt-2 space-y-1">
                    {(c.criteria || []).map((r: any) => (
                      <p key={r.id} className="text-xs text-[#78857D] flex items-center gap-1.5">
                        {r.isSafetyCritical && <AlertTriangle className="h-3 w-3 text-red-600 shrink-0" />}
                        <span className="font-semibold text-[#17251E]">{r.title}</span>
                        <span>(0–{r.maxScore})</span>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSaveCompetency} className="lg:col-span-6 rounded-2xl kc-glass-card p-6 space-y-4 h-fit">
              <h2 className="text-base font-bold text-[#17251E]">
                {editingCompId
                  ? bi('Edit Competency & Rubric', 'مہارت اور معیار میں ترمیم')
                  : bi(`Add Competency to ${currentTrade?.name}`, `${currentTrade?.name} میں نئی مہارت شامل کریں`)}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#17251E] mb-1">
                    {bi('Competency Title', 'مہارت کا عنوان')}
                  </label>
                  <input
                    type="text"
                    required
                    value={compForm.title}
                    onChange={(e) => setCompForm({ ...compForm, title: e.target.value })}
                    className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17251E] mb-1">{bi('Urdu Title', 'اردو عنوان')}</label>
                  <input
                    type="text"
                    value={compForm.urduTitle}
                    onChange={(e) => setCompForm({ ...compForm, urduTitle: e.target.value })}
                    className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17251E] mb-1">{bi('Description', 'تفصیل')}</label>
                <textarea
                  rows={2}
                  required
                  value={compForm.description}
                  onChange={(e) => setCompForm({ ...compForm, description: e.target.value })}
                  className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
                />
              </div>

              <div className="border-t border-[#E5EEE8] pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17251E]">
                    {bi('Rubric Criteria (3–4 recommended)', 'جانچ کے معیارات (۳ تا ۴ تجویز کردہ)')}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCompForm({
                        ...compForm,
                        criteria: [
                          ...compForm.criteria,
                          { id: undefined, title: '', description: '', isSafetyCritical: false, maxScore: 3 },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#176B4A] hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> {bi('Add Criterion', 'معیار شامل کریں')}
                  </button>
                </div>
                {compForm.criteria.map((crit, idx) => (
                  <div key={idx} className="rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        required
                        placeholder={bi('Criterion title', 'معیار کا عنوان')}
                        value={crit.title}
                        onChange={(e) => {
                          const next = [...compForm.criteria];
                          next[idx].title = e.target.value;
                          setCompForm({ ...compForm, criteria: next });
                        }}
                        className="flex-1 rounded-lg border border-[#E5EEE8] bg-white px-2.5 py-1.5 text-xs"
                      />
                      {compForm.criteria.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setCompForm({
                              ...compForm,
                              criteria: compForm.criteria.filter((_, i) => i !== idx),
                            })
                          }
                          className="text-red-600 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder={bi('Criterion description', 'معیار کی وضاحت')}
                      value={crit.description}
                      onChange={(e) => {
                        const next = [...compForm.criteria];
                        next[idx].description = e.target.value;
                        setCompForm({ ...compForm, criteria: next });
                      }}
                      className="w-full rounded-lg border border-[#E5EEE8] bg-white px-2.5 py-1.5 text-xs"
                    />
                    <label className="inline-flex items-center gap-2 text-xs text-[#17251E] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={crit.isSafetyCritical}
                        onChange={(e) => {
                          const next = [...compForm.criteria];
                          next[idx].isSafetyCritical = e.target.checked;
                          setCompForm({ ...compForm, criteria: next });
                        }}
                        className="h-3.5 w-3.5 rounded accent-red-600"
                      />
                      <span>{bi('Safety-Critical (score of 0 blocks verification)', 'حفاظتی لازم (صفر اسکور تصدیق روک دیتا ہے)')}</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button type="submit" className="flex-1 rounded-full bg-[#176B4A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#13563B]">
                  {editingCompId ? bi('Save Changes', 'تبدیلیاں محفوظ کریں') : bi('Create Competency', 'مہارت شامل کریں')}
                </button>
                {editingCompId && (
                  <button
                    type="button"
                    onClick={() => setEditingCompId(null)}
                    className="rounded-full border border-[#E5EEE8] px-4 py-2 text-sm"
                  >
                    {bi('Cancel', 'منسوخ')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export function ReportsModerationPage() {
  const { showToast } = useToast();
  const { bi, lang } = useI18n();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    api
      .get('/admin/reports')
      .then((res) => setReports(res.data.data || []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resolve = async (
    id: string,
    status: 'RESOLVED' | 'DISMISSED',
    suspendTargetUser = false,
    hideTargetReview = false
  ) => {
    try {
      await api.patch(`/admin/reports/${id}`, {
        status,
        adminNotes: notesById[id] || '',
        suspendTargetUser,
        hideTargetReview,
      });
      showToast(bi('Report updated.', 'رپورٹ اپ ڈیٹ کر دی گئی۔'), 'success');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <DashboardLayout title={bi('Reports & Moderation', 'شکایات اور ماڈریشن')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : reports.length === 0 ? (
        <EmptyState
          title={bi('No moderation reports', 'کوئی شکایت موجود نہیں')}
          description={bi(
            'Submitted reports on profiles, reviews, evidence, or urgent SOS alerts will appear here.',
            'پروفائلز، ریویوز، ثبوت یا ہنگامی SOS الرٹس کی شکایات یہاں ظاہر ہوں گی۔'
          )}
        />
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div
              key={r.id}
              className={`rounded-2xl kc-glass-card kc-hover-lift p-5 space-y-3 ${
                r.targetType === 'JOB_SOS' && (r.status === 'OPEN' || r.status === 'UNDER_REVIEW')
                  ? 'border-red-400 bg-red-50/40'
                  : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {r.targetType === 'JOB_SOS' && (
                      <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        {bi('URGENT SOS', 'ہنگامی SOS')}
                      </span>
                    )}
                    <p className="text-xs font-medium text-[#78857D]">
                      {r.targetType} · {bi('Reported by', 'رپورٹ کنندہ:')} {r.reporterName} · {formatDate(r.createdAt, lang)}
                    </p>
                  </div>
                  <h3 className="text-base font-bold text-[#17251E] mt-0.5">{r.reason}</h3>
                  <p className="text-xs text-[#78857D] mt-0.5">
                    {bi('Target:', 'ہدف:')} {r.targetSummary}
                  </p>
                </div>
                <StatusLabel status={r.status} />
              </div>
              {r.details && <p className="text-sm text-[#17251E]">{r.details}</p>}

              {r.status === 'OPEN' || r.status === 'UNDER_REVIEW' ? (
                <div className="border-t border-[#E5EEE8] pt-3 space-y-3">
                  <input
                    type="text"
                    value={notesById[r.id] || ''}
                    onChange={(e) => setNotesById({ ...notesById, [r.id]: e.target.value })}
                    placeholder={bi('Admin resolution notes...', 'ایڈمن کے حل کے نوٹس...')}
                    className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-xs"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => resolve(r.id, 'RESOLVED', false, false)}
                      className="rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B]"
                    >
                      {bi('Mark Resolved', 'حل شدہ قرار دیں')}
                    </button>
                    {r.targetType === 'REVIEW' && (
                      <button
                        type="button"
                        onClick={() => resolve(r.id, 'RESOLVED', false, true)}
                        className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        {bi('Resolve & Hide Review', 'حل کریں اور ریویو چھپائیں')}
                      </button>
                    )}
                    {r.targetType !== 'JOB_SOS' && (
                      <button
                        type="button"
                        onClick={() => resolve(r.id, 'RESOLVED', true, false)}
                        className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        {bi('Resolve & Suspend Account', 'حل کریں اور اکاؤنٹ معطل کریں')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => resolve(r.id, 'DISMISSED', false, false)}
                      className="rounded-full border border-[#E5EEE8] px-4 py-2 text-xs font-semibold text-[#17251E]"
                    >
                      {bi('Dismiss', 'خارج کریں')}
                    </button>
                  </div>
                </div>
              ) : (
                r.adminNotes && (
                  <p className="text-xs text-[#78857D]">
                    {bi('Resolution Note:', 'فیصلہ نوٹ:')} {r.adminNotes}
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

export function AuditLogsPage() {
  const { showToast } = useToast();
  const { bi, lang, roleText } = useI18n();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/admin/audit-logs', { params: { action: actionFilter || undefined } })
      .then((res) => setLogs(res.data.data || []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [actionFilter]);

  return (
    <DashboardLayout title={bi('Audit Logs', 'آڈٹ لاگز')}>
      <div className="space-y-4">
        <div className="rounded-2xl kc-glass-card p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#78857D]">
            {bi('Immutable security and verification audit trail (read-only).', 'محفوظ سیکیورٹی اور تصدیقی ریکارڈ (صرف پڑھنے کے لیے)۔')}
          </p>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-1.5 text-xs"
          >
            <option value="">{bi('All Actions', 'تمام سرگرمیاں')}</option>
            <option value="USER_REGISTERED">{bi('User Registered', 'صارف رجسٹر ہوا')}</option>
            <option value="USER_LOGIN">{bi('User Login', 'صارف لاگ ان')}</option>
            <option value="ASSESSOR_APPROVED">{bi('Assessor Approved', 'ماہر منظور')}</option>
            <option value="ASSESSMENT_SUBMITTED">{bi('Assessment Submitted', 'جائزہ جمع')}</option>
            <option value="BADGE_CREATED">{bi('Badge Created', 'بیج جاری')}</option>
            <option value="JOB_REQUESTED">{bi('Job Requested', 'کام کی درخواست')}</option>
            <option value="JOB_COMPLETED">{bi('Job Completed', 'کام مکمل')}</option>
            <option value="REVIEW_SUBMITTED">{bi('Review Submitted', 'ریویو جمع')}</option>
            <option value="REVIEW_HIDDEN">{bi('Review Hidden', 'ریویو چھپایا گیا')}</option>
            <option value="TIER_APPROVED">{bi('Tier Approved', 'درجہ منظور')}</option>
            <option value="GUARANTEE_DISPUTE_OPENED">{bi('Dispute Opened', 'گارنٹی تنازع')}</option>
            <option value="JOB_SOS_REPORTED">{bi('SOS Alert', 'ہنگامی SOS')}</option>
            <option value="USER_SUSPENDED">{bi('User Suspended', 'صارف معطل')}</option>
          </select>
        </div>

        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : (
          <div className="rounded-2xl kc-glass-card overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-[#E5EEE8] bg-[#F7FAF8] font-semibold text-[#78857D]">
                  <th className="px-4 py-3">{bi('Action', 'عمل')}</th>
                  <th className="px-4 py-3">{bi('User', 'صارف')}</th>
                  <th className="px-4 py-3">{bi('Record', 'ریکارڈ')}</th>
                  <th className="px-4 py-3">{bi('Description', 'تفصیل')}</th>
                  <th className="px-4 py-3">{bi('Date & Time', 'تاریخ اور وقت')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EEE8]">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-[#F7FAF8]/60">
                    <td className="px-4 py-3 font-mono font-semibold text-[#176B4A] whitespace-nowrap">{l.action}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-[#17251E]">{l.actorName}</span>{' '}
                      <span className="text-[#78857D]">({roleText(l.actorRole)})</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#78857D] whitespace-nowrap">
                      {l.entityType} · {l.entityId.slice(0, 12)}
                    </td>
                    <td className="px-4 py-3 text-[#17251E]">{l.description}</td>
                    <td className="px-4 py-3 font-mono text-[#78857D] whitespace-nowrap tabular-nums">
                      {new Date(l.createdAt).toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-PK')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
