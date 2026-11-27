import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  Camera,
  Flag,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { CityCombobox } from '../../components/ui/CityCombobox';
import {
  BadgeCard,
  ConfirmDialog,
  EmptyState,
  LoadingSkeleton,
  Pagination,
  ReportModal,
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
import { StarRatingInline, TierPill, TrustScoreBadge } from '../../components/ui/RatingDisplay';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SERVICE_GROUPS } from '../../data/serviceCatalog';
import { api, getApiErrorMessage } from '../../services/api';
import { useI18n } from '../../i18n/translations';

export function EmployerDashboard() {
  const { showToast } = useToast();
  const { bi, isUr } = useI18n();
  const [data, setData] = useState<any>(null);
  const [tradeCounts, setTradeCounts] = useState<BarDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentViewed, setRecentViewed] = useState<any[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('kc_recent_viewed');
      if (raw) setRecentViewed(JSON.parse(raw));
    } catch {
      // ignore
    }

    Promise.all([
      api.get('/employers/me'),
      api.get('/public/trades'),
      api.get('/employers/search', { params: { limit: 36 } }),
    ])
      .then(([meRes, tradesRes, searchRes]) => {
        setData(meRes.data.data);
        const trades = tradesRes.data.data || [];
        const workers = searchRes.data.data?.items || [];
        const variants: Array<'dark' | 'medium' | 'light' | 'hatched'> = ['dark', 'medium', 'light', 'hatched'];
        const bars: BarDatum[] = trades
          .map((t: any, idx: number) => ({
            label: isUr && t.urduName ? t.urduName : t.name,
            shortLabel: (isUr && t.urduName ? t.urduName : t.name).slice(0, 6),
            value: workers.filter((w: any) => w.tradeName === t.name).length,
            variant: variants[idx % variants.length],
          }))
          .filter((b: BarDatum) => b.value > 0)
          .slice(0, 8);
        setTradeCounts(bars);
      })
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [isUr]);

  const totalContacts =
    (data?.stats?.pendingContactRequests || 0) + (data?.stats?.acceptedContactRequests || 0);
  const acceptRate =
    totalContacts > 0 ? Math.round(((data?.stats?.acceptedContactRequests || 0) / totalContacts) * 100) : 0;

  return (
    <DashboardLayout title={bi('Customer / Employer Dashboard', 'گاہک / آجِر ڈیش بورڈ')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : !data ? null : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#17251E]">
                {bi(`Welcome, ${data.fullName}`, `خوش آمدید، ${data.fullName}`)}
              </h2>
              <p className="mt-1 text-sm text-[#69726B]">
                {data.companyName || (data.accountType === 'INDIVIDUAL' ? bi('Homeowner / Individual Account', 'گھریلو صارف اکاؤنٹ') : bi('Customer / Employer Account', 'گاہک / آجِر اکاؤنٹ'))} · {data.city}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/employer/search"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#176B4A] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#13563B] whitespace-nowrap"
              >
                <Search className="h-3.5 w-3.5" />
                {bi('Search Verified Workers', 'تصدیق شدہ ہنرمند تلاش کریں')}
              </Link>
              <Link
                to="/employer/jobs"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D8D0BE] bg-[#ECE6D7]/60 px-5 py-2.5 text-xs font-semibold text-[#176B4A] hover:bg-[#ECE6D7] whitespace-nowrap"
              >
                <Briefcase className="h-3.5 w-3.5" />
                {bi('My Jobs', 'میرے کام')} ({(data.stats?.activeJobsCount || 0) + (data.stats?.completedJobsCount || 0)})
              </Link>
              <Link
                to="/employer/insights"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D8D0BE] bg-[#F3EFE4] px-4 py-2.5 text-xs font-bold text-[#11221B] hover:bg-[#ECE6D7] whitespace-nowrap"
              >
                <BarChart3 className="h-3.5 w-3.5 text-[#176B4A]" />
                {bi('Skill Demand Insights', 'اسکل ڈیمانڈ بصیرت')}
              </Link>
            </div>
          </div>

          {/* Pending Reviews Reminder */}
          {data.pendingReviewJobs?.length > 0 && (
            <div className="rounded-2xl border border-[#C9973A] bg-[#ECE6D7]/55 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-[#176B4A] fill-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#17251E]">
                    {bi(
                      `Rate ${data.pendingReviewJobs.length} Completed Job(s)`,
                      `${data.pendingReviewJobs.length} مکمل کاموں کی ریٹنگ دیں`
                    )}
                  </p>
                  <p className="text-xs text-[#176B4A]">
                    {bi(
                      `Confirm proof & leave a Verified Hire review for ${data.pendingReviewJobs.map((p: any) => p.workerName).join(', ')}.`,
                      `${data.pendingReviewJobs.map((p: any) => p.workerName).join('، ')} کے مکمل کام کی تصدیق اور ریویو دیں۔`
                    )}
                  </p>
                </div>
              </div>
              <Link
                to="/employer/jobs"
                className="shrink-0 rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B]"
              >
                {bi('Confirm & Rate →', 'تصدیق اور ریٹنگ ←')}
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatKpiCard
              highlighted
              label={bi('Available Workers', 'دستیاب ہنرمند')}
              value={data.stats.totalAvailableWorkers}
              sublabel={bi('Verified skill portfolios', 'تصدیق شدہ ہنر پورٹ فولیوز')}
              icon={Users}
              to="/employer/search"
            />
            <StatKpiCard
              label={bi('Active & Completed Jobs', 'فعال اور مکمل کام')}
              value={(data.stats.activeJobsCount || 0) + (data.stats.completedJobsCount || 0)}
              sublabel={bi(
                `${data.stats.activeJobsCount || 0} active · ${data.stats.completedJobsCount || 0} completed`,
                `${data.stats.activeJobsCount || 0} فعال · ${data.stats.completedJobsCount || 0} مکمل`
              )}
              icon={Briefcase}
              to="/employer/jobs"
            />
            <StatKpiCard
              label={bi('Pending Reviews', 'زیرِ التواء ریویوز')}
              value={data.stats.pendingReviewsCount || 0}
              sublabel={bi('Confirm proof & rate hires', 'کام کی تصدیق اور ریٹنگ دیں')}
              icon={Star}
              to="/employer/jobs"
            />
            <StatKpiCard
              label={bi('Saved in Shortlist', 'شارٹ لسٹ میں محفوظ')}
              value={data.stats.savedWorkers}
              sublabel={bi(`${data.stats.acceptedContactRequests} unlocked contacts`, `${data.stats.acceptedContactRequests} منظور شدہ روابط`)}
              icon={Phone}
              to="/employer/shortlist"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <AnimatedBarChart
                title={bi('Available Talent by Category', 'شعبے کے لحاظ سے دستیاب ہنرمند')}
                subtitle={bi('Public worker profiles across active categories', 'فعال شعبوں میں عوامی ہنرمند پروفائلز')}
                data={tradeCounts}
              />
            </div>

            <div className="lg:col-span-4">
              <SemiCircleGauge
                title={bi('Contact Acceptance Rate', 'رابطہ قبولیت کی شرح')}
                percentage={acceptRate}
                caption={
                  totalContacts > 0
                    ? bi(
                        `${data.stats.acceptedContactRequests} of ${totalContacts} accepted`,
                        `${totalContacts} میں سے ${data.stats.acceptedContactRequests} منظور`
                      )
                    : bi('Book a job or send a request', 'کام بک کریں یا درخواست بھیجیں')
                }
                primaryLabel={bi('Accepted', 'منظور شدہ')}
                secondaryLabel={bi('Pending / Other', 'زیرِ التواء / دیگر')}
              />
            </div>

            <div className="lg:col-span-3 kc-dark-surface rounded-2xl p-5 sm:p-6 text-white flex flex-col justify-between kc-hover-lift">
              <div>
                <p className="text-xs font-semibold text-[#C9973A]">
                  {bi('3-Layer Verified Hiring', 'تین سطحی تصدیق شدہ بھرتی')}
                </p>
                <h3 className="mt-2 text-lg font-bold leading-snug">
                  {bi('Hire Proven Karigars', 'مستند کاریگر منتخب کریں')}
                </h3>
                <p className="mt-2 text-xs text-[#D8D0BE]/85 leading-relaxed">
                  {bi(
                    'Compare assessor-verified skills, customer ratings, Fair Price Guides, and 7-day Karigar Guarantee protection.',
                    'ماہرین سے تصدیق شدہ مہارتیں، کسٹمر ریٹنگ، مناسب نرخ نامہ اور ۷ روزہ گارنٹی کے ساتھ کام کروائیں۔'
                  )}
                </p>
              </div>
              <Link
                to="/employer/search"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-[#399B6B] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#176B4A] transition-colors"
              >
                {bi('Explore Talent Pool →', 'ہنرمند تلاش کریں ←')}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-2xl kc-glass-card p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#17251E]">
                  {bi('Shortlisted Workers', 'شارٹ لسٹ شدہ ہنرمند')}
                </h3>
                <Link to="/employer/shortlist" className="text-xs font-semibold text-[#176B4A] hover:underline">
                  {bi('View all →', 'سب دیکھیں ←')}
                </Link>
              </div>
              {data.recentShortlist.length === 0 ? (
                <p className="mt-4 text-sm text-[#69726B]">
                  {bi('No workers shortlisted yet.', 'ابھی کوئی ہنرمند شارٹ لسٹ نہیں کیا گیا۔')}
                </p>
              ) : (
                <div className="mt-4 divide-y divide-[#E6E0D2]">
                  {data.recentShortlist.map((w: any) => (
                    <Link
                      key={w.id}
                      to={`/employer/workers/${w.publicId}`}
                      className="py-3 flex items-center justify-between hover:bg-[#F7F4EC] rounded-xl px-2 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-bold text-[#17251E]">{w.fullName}</p>
                        <p className="text-xs text-[#69726B]">
                          {w.tradeName} · {w.city} · {w.yearsExperience} {bi('yrs', 'سال')}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#176B4A]">{bi('Open →', 'کھولیں ←')}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl kc-glass-card p-6">
              <h3 className="text-base font-bold text-[#17251E]">
                {bi('Recently Viewed Profiles', 'حالیہ دیکھے گئے پروفائلز')}
              </h3>
              {recentViewed.length === 0 ? (
                <p className="mt-4 text-sm text-[#69726B]">
                  {bi(
                    'Profiles you open during worker search will appear here.',
                    'تلاش کے دوران کھولے گئے پروفائلز یہاں نظر آئیں گے۔'
                  )}
                </p>
              ) : (
                <div className="mt-4 divide-y divide-[#E6E0D2]">
                  {recentViewed.map((w) => (
                    <Link
                      key={w.publicId}
                      to={`/employer/workers/${w.publicId}`}
                      className="py-3 flex items-center justify-between hover:bg-[#F7F4EC] rounded-xl px-2 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-bold text-[#17251E]">{w.fullName}</p>
                        <p className="text-xs text-[#69726B]">{w.tradeName} · {w.city}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#176B4A]">{bi('View →', 'دیکھیں ←')}</span>
                    </Link>
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

export function SearchWorkersPage() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { bi, lang, isUr } = useI18n();
  const [trades, setTrades] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [group, setGroup] = useState('');
  const [trade, setTrade] = useState('');
  const [city, setCity] = useState('');
  const [competencyId, setCompetencyId] = useState('');
  const [level, setLevel] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [minRating, setMinRating] = useState('');
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [sort, setSort] = useState('verified_desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const paramQ = searchParams.get('q') || '';
    if (paramQ !== q) {
      setQ(paramQ);
    }
  }, [searchParams]);

  useEffect(() => {
    api.get('/public/trades').then((res) => setTrades(res.data.data || [])).catch(() => {});
  }, []);

  const runSearch = async (targetPage = page, overrideQ?: string) => {
    setLoading(true);
    const activeQ = overrideQ !== undefined ? overrideQ : q;
    try {
      const res = await api.get('/employers/search', {
        params: {
          q: activeQ || undefined,
          group: group || undefined,
          trade: trade || undefined,
          city: city || undefined,
          competencyId: competencyId || undefined,
          level: level || undefined,
          minExperience: minExperience || undefined,
          minRating: minRating || undefined,
          femaleOnly: femaleOnly ? 'true' : undefined,
          sort,
          page: targetPage,
          limit: 9,
        },
      });
      setWorkers(res.data.data.items || []);
      setPagination(res.data.data.pagination);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch(page);
  }, [group, trade, city, competencyId, level, minRating, femaleOnly, sort, page, searchParams]);

  const tradesInGroup = group
    ? trades.filter((t) => (t.group || 'Home Repair & Maintenance') === group)
    : trades;
  const selectedTradeObj = trades.find((t) => t.slug === trade || t.id === trade);
  const availableCompetencies = selectedTradeObj
    ? selectedTradeObj.competencies
    : tradesInGroup.flatMap((t) => t.competencies || []);

  const handleClear = () => {
    setQ('');
    setGroup('');
    setTrade('');
    setCity('');
    setCompetencyId('');
    setLevel('');
    setMinExperience('');
    setMinRating('');
    setFemaleOnly(false);
    setSort('verified_desc');
    setPage(1);
    setTimeout(() => runSearch(1, ''), 0);
  };

  const toggleShortlist = async (worker: any) => {
    try {
      if (worker.isShortlisted) {
        await api.delete(`/employers/shortlists/${worker.id}`);
        setWorkers((prev) => prev.map((w) => (w.id === worker.id ? { ...w, isShortlisted: false } : w)));
        showToast(bi('Removed from shortlist.', 'شارٹ لسٹ سے ہٹا دیا گیا۔'), 'info');
      } else {
        await api.post('/employers/shortlists', { workerProfileId: worker.id });
        setWorkers((prev) => prev.map((w) => (w.id === worker.id ? { ...w, isShortlisted: true } : w)));
        showToast(bi('Saved to shortlist.', 'شارٹ لسٹ میں محفوظ ہو گیا۔'), 'success');
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <DashboardLayout title={bi('Search Skilled Workers', 'ہنرمند تلاش کریں')}>
      <div className="space-y-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            runSearch(1);
          }}
          className="rounded-2xl kc-glass-card p-5 space-y-3"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2 relative">
              <Search className="absolute start-3.5 top-2.5 h-4 w-4 text-[#69726B]" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={bi('Search name, skill, or category...', 'نام، ہنر یا شعبہ تلاش کریں...')}
                className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] ps-9 pe-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={group}
              onChange={(e) => {
                setGroup(e.target.value);
                setTrade('');
                setCompetencyId('');
                setPage(1);
              }}
              className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm"
            >
              <option value="">{bi('All Service Groups', 'تمام ۸ گروپس')}</option>
              {SERVICE_GROUPS.map((g) => (
                <option key={g.group} value={g.group}>
                  {isUr ? g.urduGroup : g.group}
                </option>
              ))}
            </select>

            <select
              value={trade}
              onChange={(e) => {
                setTrade(e.target.value);
                setCompetencyId('');
                setPage(1);
              }}
              className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm"
            >
              <option value="">{bi('All Categories', 'تمام شعبے')}</option>
              {tradesInGroup.map((t) => (
                <option key={t.id} value={t.slug}>
                  {isUr && t.urduName ? t.urduName : t.name}
                </option>
              ))}
            </select>

            <CityCombobox
              allowAll
              value={city}
              onChange={(c) => {
                setCity(c);
                setPage(1);
              }}
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#176B4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#13563B]"
              >
                {bi('Search', 'تلاش')}
              </button>
              <button
                type="button"
                onClick={handleClear}
                title={bi('Clear filters', 'فلٹر صاف کریں')}
                className="rounded-xl border border-[#E6E0D2] px-3 py-2 text-[#69726B] hover:bg-[#F7F4EC]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#E6E0D2] text-xs">
            <span className="inline-flex items-center gap-1 text-[#69726B] font-medium">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {bi('Filters:', 'فلٹرز:')}
            </span>

            <select
              value={competencyId}
              onChange={(e) => {
                setCompetencyId(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-[#E6E0D2] bg-[#F7F4EC] px-2.5 py-1.5 max-w-[200px]"
            >
              <option value="">{bi('All Verified Competencies', 'تمام تصدیق شدہ مہارتیں')}</option>
              {availableCompetencies.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {isUr && c.urduTitle ? c.urduTitle : c.title}
                </option>
              ))}
            </select>

            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-[#E6E0D2] bg-[#F7F4EC] px-2.5 py-1.5"
            >
              <option value="">{bi('Any Level', 'کوئی بھی درجہ')}</option>
              <option value="BASIC">{bi('Level 1 — Basic', 'درجہ ۱ — بنیادی')}</option>
              <option value="COMPETENT">{bi('Level 2 — Competent', 'درجہ ۲ — ماہر')}</option>
              <option value="ADVANCED">{bi('Level 3 — Advanced', 'درجہ ۳ — اعلیٰ')}</option>
            </select>

            <select
              value={minRating}
              onChange={(e) => {
                setMinRating(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-[#E6E0D2] bg-[#F7F4EC] px-2.5 py-1.5"
            >
              <option value="">{bi('Any Rating', 'کوئی بھی ریٹنگ')}</option>
              <option value="4">{bi('4.0★ & up', '۴.۰★ اور اوپر')}</option>
              <option value="4.5">{bi('4.5★ & up', '۴.۵★ اور اوپر')}</option>
            </select>

            <select
              value={minExperience}
              onChange={(e) => {
                setMinExperience(e.target.value);
                setPage(1);
                setTimeout(() => runSearch(1), 0);
              }}
              className="rounded-lg border border-[#E6E0D2] bg-[#F7F4EC] px-2.5 py-1.5"
            >
              <option value="">{bi('Any Experience', 'کوئی بھی تجربہ')}</option>
              <option value="1">{bi('1+ years', '۱+ سال')}</option>
              <option value="3">{bi('3+ years', '۳+ سال')}</option>
              <option value="5">{bi('5+ years', '۵+ سال')}</option>
            </select>

            <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6E0D2] bg-[#F7F4EC] px-2.5 py-1.5 cursor-pointer font-semibold text-[#176B4A]">
              <input
                type="checkbox"
                checked={femaleOnly}
                onChange={(e) => {
                  setFemaleOnly(e.target.checked);
                  setPage(1);
                }}
                className="h-3.5 w-3.5 accent-[#176B4A]"
              />
              <span>{bi('Women pros only', 'صرف خواتین ماہرین')}</span>
            </label>

            <span className="text-[#69726B] tabular-nums ms-auto">
              {isUr ? `${pagination.total} نتائج` : `${pagination.total} result${pagination.total === 1 ? '' : 's'}`}
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-[#E6E0D2] bg-[#F7F4EC] px-2.5 py-1.5"
            >
              <option value="verified_desc">{bi('Most Verified', 'سب سے زیادہ تصدیق شدہ')}</option>
              <option value="top_rated">{bi('Highest Rated', 'سب سے زیادہ ریٹنگ')}</option>
              <option value="most_jobs">{bi('Most Jobs Done', 'سب سے زیادہ مکمل کام')}</option>
              <option value="trust_desc">{bi('Highest Trust Score', 'سب سے زیادہ ٹرسٹ اسکور')}</option>
              <option value="experience_desc">{bi('Most Experienced', 'سب سے زیادہ تجربہ')}</option>
              <option value="name_asc">{bi('Name A–Z', 'نام کے مطابق')}</option>
            </select>
          </div>
        </form>

        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : workers.length === 0 ? (
          <EmptyState
            title={bi('No matching workers', 'کوئی مطابق ہنرمند نہیں ملا')}
            description={bi(
              'Adjust your service category, verified competency, rating, or city filter to see available tradespeople.',
              'دستیاب ہنرمند دیکھنے کے لیے شعبہ، مہارت، ریٹنگ یا شہر کا فلٹر تبدیل کریں۔'
            )}
            action={
              <button
                type="button"
                onClick={handleClear}
                className="rounded-full bg-[#176B4A] px-5 py-2 text-sm font-semibold text-white"
              >
                {bi('Clear Filters', 'فلٹرز صاف کریں')}
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {workers.map((w) => (
              <div
                key={w.id}
                className="flex flex-col justify-between rounded-2xl kc-glass-card kc-hover-lift p-5"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#D8D0BE] bg-[#ECE6D7] flex items-center justify-center font-bold text-[#176B4A]">
                      {w.avatarUrl ? (
                        <img src={w.avatarUrl} alt={w.fullName} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      ) : (
                        w.fullName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-base font-bold text-[#17251E] truncate">{w.fullName}</h3>
                        <TierPill tier={w.tier} underReview={w.tierUnderReview} tierStatus={w.tierStatus} compact />
                      </div>
                      <p className="text-xs text-[#69726B]">
                        {isUr && w.tradeUrduName ? w.tradeUrduName : w.tradeName} · {w.yearsExperience} {bi('yrs exp', 'سال تجربہ')}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-[#69726B]">
                        <MapPin className="h-3.5 w-3.5 text-[#399B6B]" />
                        <span>{w.city}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <TrustScoreBadge score={w.trustScore ?? 0} compact />
                    <StarRatingInline
                      rating={w.ratingSummary?.bayesianRating || 0}
                      count={w.ratingSummary?.totalReviews || 0}
                    />
                    {w.isFemaleProfessional && (
                      <span className="rounded-md bg-[#ECE6D7] px-2 py-0.5 text-[11px] font-semibold text-[#176B4A]">
                        {bi('Women Pro', 'خاتون ماہر')}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 border-t border-[#E6E0D2] pt-3">
                    <p className="text-xs font-semibold text-[#176B4A] flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-[#399B6B]" />
                      <span className="tabular-nums">
                        {w.verifiedCount} {bi('Verified Competencies', 'تصدیق شدہ مہارتیں')}
                      </span>
                      <span className="text-[#69726B] font-normal">
                        · {w.completedJobsCount || 0} {bi('jobs', 'کام')}
                      </span>
                    </p>
                    {w.verifiedBadges.length > 0 && (
                      <ul className="mt-1.5 space-y-1 text-xs text-[#17251E]">
                        {w.verifiedBadges.slice(0, 2).map((b: any) => (
                          <li key={b.id} className="truncate">
                            • {b.competencyTitle} ({formatLevelLabel(b.level, lang)})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E6E0D2] flex items-center gap-2">
                  <Link
                    to={`/employer/workers/${w.publicId}`}
                    className="flex-1 rounded-full bg-[#176B4A] px-3 py-2 text-center text-xs font-semibold text-white hover:bg-[#13563B]"
                  >
                    {bi('View & Book', 'پروفائل اور بکنگ')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleShortlist(w)}
                    className={`rounded-full border p-2.5 text-xs font-semibold transition-colors ${
                      w.isShortlisted
                        ? 'border-[#176B4A] bg-[#ECE6D7] text-[#176B4A]'
                        : 'border-[#E6E0D2] bg-white text-[#69726B] hover:bg-[#F7F4EC]'
                    }`}
                  >
                    <Star className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
      </div>
    </DashboardLayout>
  );
}

export function EmployerWorkerViewPage() {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { bi, isUr } = useI18n();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Quick Job Request Modal state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobCity, setJobCity] = useState(user?.city || '');
  const [jobArea, setJobArea] = useState('');
  const [jobDate, setJobDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [jobTimeSlot, setJobTimeSlot] = useState('Morning (9 AM - 12 PM)');
  const [jobPhotos, setJobPhotos] = useState<File[]>([]);
  const [submittingJob, setSubmittingJob] = useState(false);

  useEffect(() => {
    if (!publicId) return;
    setLoading(true);
    api
      .get(`/workers/${publicId}`)
      .then((res) => {
        const w = res.data.data;
        setWorker(w);
        setJobCity((prev) => prev || user?.city || w.city || 'Islamabad');
        try {
          const prev = JSON.parse(sessionStorage.getItem('kc_recent_viewed') || '[]');
          const next = [
            { publicId: w.publicId, fullName: w.fullName, tradeName: w.tradeName, city: w.city },
            ...prev.filter((p: any) => p.publicId !== w.publicId),
          ].slice(0, 5);
          sessionStorage.setItem('kc_recent_viewed', JSON.stringify(next));
        } catch {
          // ignore
        }
      })
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [publicId]);

  const toggleShortlist = async () => {
    if (!worker) return;
    try {
      if (worker.isShortlisted) {
        await api.delete(`/employers/shortlists/${worker.id}`);
        setWorker({ ...worker, isShortlisted: false });
        showToast(bi('Removed from shortlist.', 'شارٹ لسٹ سے ہٹا دیا گیا۔'), 'info');
      } else {
        await api.post('/employers/shortlists', { workerProfileId: worker.id });
        setWorker({ ...worker, isShortlisted: true });
        showToast(bi('Worker shortlisted.', 'ہنرمند شارٹ لسٹ ہو گیا۔'), 'success');
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const sendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;
    setSending(true);
    try {
      await api.post('/employers/contact-requests', { workerProfileId: worker.id, message });
      setWorker({ ...worker, contactPermissionStatus: 'PENDING' });
      setMessage('');
      showToast(bi('Contact request sent.', 'رابطے کی درخواست بھیج دی گئی۔'), 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSending(false);
    }
  };

  const submitJobRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;
    setSubmittingJob(true);
    try {
      const fd = new FormData();
      fd.append('workerProfileId', worker.id);
      fd.append('tradeId', worker.selectedTradeId || '');
      fd.append('title', jobTitle);
      fd.append('description', jobDesc);
      fd.append('city', jobCity);
      fd.append('area', jobArea);
      fd.append('preferredDate', jobDate);
      fd.append('preferredTimeSlot', jobTimeSlot);
      jobPhotos.forEach((f) => fd.append('photos', f));
      await api.post('/jobs', fd);
      showToast(bi('Job request sent! Track progress in My Jobs.', 'کام کی درخواست بھیج دی گئی!'), 'success');
      setBookingOpen(false);
      navigate('/employer/jobs');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmittingJob(false);
    }
  };

  return (
    <DashboardLayout title={bi('Worker Portfolio & Booking', 'ہنرمند کا پورٹ فولیو اور بکنگ')}>
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : !worker ? (
        <EmptyState
          title={bi('Worker not found', 'ہنرمند نہیں ملا')}
          description={bi('This portfolio is unavailable or set to private.', 'یہ پورٹ فولیو دستیاب نہیں یا نجی ہے۔')}
        />
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl kc-glass-card p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-2xl border border-[#D8D0BE] bg-[#ECE6D7] flex items-center justify-center font-bold text-[#176B4A]">
                  {worker.avatarUrl ? (
                    <img src={worker.avatarUrl} alt={worker.fullName} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  ) : (
                    worker.fullName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-[#17251E]">{worker.fullName}</h2>
                    <TierPill tier={worker.tier} underReview={worker.tierUnderReview} tierStatus={worker.tierStatus} />
                    <TrustScoreBadge score={worker.trustScoreBreakdown?.total ?? worker.trustScore ?? 0} />
                  </div>
                  <p className="text-sm text-[#69726B] mt-0.5">
                    {isUr && worker.tradeUrduName ? worker.tradeUrduName : worker.tradeName} · {worker.city} · {worker.yearsExperience} {bi('years experience', 'سال تجربہ')}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <StarRatingInline
                      rating={worker.ratingSummary?.bayesianRating || 0}
                      count={worker.ratingSummary?.totalReviews || 0}
                    />
                    {worker.passportId && (
                      <span className="font-mono text-xs bg-[#F7F4EC] border border-[#E6E0D2] px-2 py-0.5 rounded text-[#176B4A]">
                        {worker.passportId}
                      </span>
                    )}
                    {worker.isFemaleProfessional && (
                      <span className="rounded-md bg-[#ECE6D7] px-2 py-0.5 text-xs font-semibold text-[#176B4A]">
                        {bi('Women-Safe Verified Pro', 'خواتین سروسز ماہر')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBookingOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B]"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  {bi('Request / Book Job', 'کام بک کریں')}
                </button>
                <button
                  type="button"
                  onClick={toggleShortlist}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold ${
                    worker.isShortlisted
                      ? 'bg-[#ECE6D7] text-[#176B4A] border border-[#C9973A]'
                      : 'border border-[#E6E0D2] bg-[#F7F4EC] text-[#17251E] hover:bg-[#ECE6D7]/50'
                  }`}
                >
                  <Star className="h-3.5 w-3.5" />
                  {worker.isShortlisted ? bi('Shortlisted', 'شارٹ لسٹ شدہ') : bi('Shortlist', 'شارٹ لسٹ')}
                </button>
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E6E0D2] px-3.5 py-2 text-xs font-medium text-[#69726B] hover:bg-[#F7F4EC]"
                >
                  <Flag className="h-3.5 w-3.5" />
                  {bi('Report', 'رپورٹ')}
                </button>
              </div>
            </div>
            {worker.bio && <p className="mt-4 text-sm text-[#17251E] leading-relaxed">{worker.bio}</p>}
            {worker.skills?.length > 0 && (
              <p className="mt-3 text-xs text-[#69726B]">
                <strong className="text-[#17251E]">{bi('Skills:', 'مہارتیں:')}</strong> {worker.skills.join(' · ')}
              </p>
            )}
          </div>

          {worker.priceGuide?.length > 0 && (
            <div className="rounded-2xl kc-glass-card p-6 space-y-3">
              <h3 className="text-base font-bold text-[#17251E]">
                {bi('Fair Price Guide (PKR Benchmark)', 'مناسب قیمت نامہ (PKR)')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {worker.priceGuide.map((pg: any) => (
                  <div key={pg.id} className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] p-3 text-xs">
                    <p className="font-bold text-[#17251E]">
                      {isUr && pg.serviceUrduLabel ? pg.serviceUrduLabel : pg.serviceLabel}
                    </p>
                    <p className="mt-1 font-mono font-bold text-[#176B4A]">
                      PKR {pg.minPkr.toLocaleString()} – {pg.maxPkr.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#69726B]">{pg.unit}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl kc-glass-card p-6">
            <h3 className="text-base font-bold text-[#17251E]">{bi('Contact Access', 'رابطے تک رسائی')}</h3>
            {worker.contactDetails ? (
              <div className="mt-3 flex flex-wrap gap-6 text-sm font-semibold text-[#176B4A]">
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#399B6B]" />
                  <span className="font-mono">{worker.contactDetails.phone}</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#399B6B]" />
                  <span>{worker.contactDetails.email}</span>
                </span>
              </div>
            ) : worker.contactPermissionStatus === 'PENDING' ? (
              <p className="mt-2 text-sm text-amber-700 font-medium">
                {bi(
                  'Contact request pending. Phone and email will appear here if the worker accepts.',
                  'رابطے کی درخواست زیرِ التواء ہے۔ ہنرمند کی منظوری پر فون اور ای میل یہاں ظاہر ہوں گے۔'
                )}
              </p>
            ) : worker.contactPermissionStatus === 'DECLINED' ? (
              <p className="mt-2 text-sm text-[#69726B]">
                {bi('This worker declined your contact request.', 'اس ہنرمند نے آپ کی رابطہ درخواست مسترد کر دی ہے۔')}
              </p>
            ) : (
              <form onSubmit={sendContact} className="mt-3 space-y-3">
                <p className="text-xs text-[#69726B] flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-[#399B6B]" />
                  {bi(
                    'Phone and email are hidden until the worker accepts your job booking or contact request.',
                    'فون اور ای میل اس وقت تک پوشیدہ ہیں جب تک ہنرمند آپ کی بکنگ یا رابطہ درخواست قبول نہ کرے۔'
                  )}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={bi(
                      'Introduce your home or business requirement...',
                      'اپنے گھر یا کاروبار کے کام کی ضرورت لکھیں...'
                    )}
                    className="flex-1 rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3.5 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#176B4A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
                  >
                    <Send className="h-4 w-4 rtl:-scale-x-100" />
                    {sending ? bi('Sending...', 'بھیجا جا رہا ہے...') : bi('Send Contact Request', 'رابطہ درخواست بھیجیں')}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {worker.verifiedBadges.map((b: any) => (
              <BadgeCard key={b.id} {...b} />
            ))}
          </div>

          <ReportModal
            open={reportOpen}
            targetType="WORKER_PROFILE"
            targetId={worker.id}
            targetLabel={worker.fullName}
            onClose={() => setReportOpen(false)}
          />

          {/* Book Job Modal */}
          {bookingOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251E]/45 backdrop-blur-[2px] p-4">
              <div className="w-full max-w-lg rounded-2xl border border-[#E6E0D2] bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#17251E]">
                      {bi(`Book ${worker.fullName}`, `${worker.fullName} کو بک کریں`)}
                    </h3>
                    <p className="text-xs text-[#69726B]">
                      {worker.tradeName} · {bi('7-Day Karigar Guarantee covered', '۷ روزہ کاریگر گارنٹی شامل ہے')}
                    </p>
                  </div>
                  <button type="button" onClick={() => setBookingOpen(false)} className="text-[#69726B]">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={submitJobRequest} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#17251E] mb-1">
                      {bi('Job Title', 'کام کا عنوان')}
                    </label>
                    <input
                      type="text"
                      required
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder={bi('e.g. Main Breaker Trip Diagnosis', 'مثلاً مین بریکر ٹرپنگ کا مسئلہ')}
                      className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm"
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
                      placeholder={bi('Describe the fault, location in home, or equipment...', 'خرابی یا کام کی مکمل تفصیل لکھیں...')}
                      className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#17251E] mb-1">{bi('City', 'شہر')}</label>
                      <CityCombobox value={jobCity} onChange={setJobCity} required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#17251E] mb-1">
                        {bi('Sector / Neighbourhood', 'سیکٹر / محلہ')}
                      </label>
                      <input
                        type="text"
                        required
                        value={jobArea}
                        onChange={(e) => setJobArea(e.target.value)}
                        placeholder={bi('e.g. G-10/4 or DHA Phase 5', 'مثلاً G-10/4 یا DHA فیز ۵')}
                        className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#17251E] mb-1">{bi('Preferred Date', 'پسندیدہ تاریخ')}</label>
                      <input
                        type="date"
                        required
                        value={jobDate}
                        onChange={(e) => setJobDate(e.target.value)}
                        className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#17251E] mb-1">{bi('Time Slot', 'وقت')}</label>
                      <select
                        value={jobTimeSlot}
                        onChange={(e) => setJobTimeSlot(e.target.value)}
                        className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm"
                      >
                        <option value="Morning (9 AM - 12 PM)">{bi('Morning (9 AM - 12 PM)', 'صبح (۹ تا ۱۲)')}</option>
                        <option value="Afternoon (12 PM - 4 PM)">{bi('Afternoon (12 PM - 4 PM)', 'دوپہر (۱۲ تا ۴)')}</option>
                        <option value="Evening (4 PM - 7 PM)">{bi('Evening (4 PM - 7 PM)', 'شام (۴ تا ۷)')}</option>
                        <option value="Flexible">{bi('Flexible', 'کسی بھی وقت')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] p-3">
                    <label className="block text-xs font-semibold text-[#17251E] mb-1">
                      <Camera className="inline h-3.5 w-3.5 me-1" />
                      {bi('Problem Photos (Optional)', 'مسئلے کی تصاویر (اختیاری)')}
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) => setJobPhotos(Array.from(e.target.files || []))}
                      className="w-full text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setBookingOpen(false)} className="rounded-xl border px-4 py-2 text-xs font-semibold">
                      {bi('Cancel', 'منسوخ')}
                    </button>
                    <button
                      type="submit"
                      disabled={submittingJob}
                      className="rounded-xl bg-[#176B4A] px-5 py-2 text-xs font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
                    >
                      {submittingJob ? bi('Sending...', 'بھیجا جا رہا ہے...') : bi('Send Job Request', 'کام کی درخواست بھیجیں')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

export function MyShortlistPage() {
  const { showToast } = useToast();
  const { bi } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [removeTarget, setRemoveTarget] = useState<any>(null);

  const load = () => {
    setLoading(true);
    api
      .get('/employers/shortlists')
      .then((res) => setItems(res.data.data || []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const saveNote = async (id: string) => {
    try {
      await api.patch(`/employers/shortlists/${id}`, { notes: noteText });
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, notes: noteText } : item)));
      setEditingNoteId(null);
      showToast(bi('Private note saved.', 'ذاتی نوٹ محفوظ ہو گیا۔'), 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    try {
      await api.delete(`/employers/shortlists/${removeTarget.id}`);
      setItems((prev) => prev.filter((item) => item.id !== removeTarget.id));
      setRemoveTarget(null);
      showToast(bi('Removed from shortlist.', 'شارٹ لسٹ سے ہٹا دیا گیا۔'), 'info');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <DashboardLayout title={bi('My Shortlist', 'میری شارٹ لسٹ')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          title={bi('Your shortlist is empty', 'آپ کی شارٹ لسٹ خالی ہے')}
          description={bi(
            'Search verified tradespeople and click the star icon to save promising professionals.',
            'تصدیق شدہ ہنرمند تلاش کریں اور بہترین افراد کو محفوظ کرنے کے لیے اسٹار آئیکن دبائیں۔'
          )}
          action={
            <Link to="/employer/search" className="rounded-full bg-[#176B4A] px-5 py-2.5 text-sm font-semibold text-white">
              {bi('Search Workers', 'ہنرمند تلاش کریں')}
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl kc-glass-card kc-hover-lift p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#17251E]">{item.fullName}</h3>
                  <p className="text-xs text-[#69726B]">
                    {item.tradeName} · {item.city} · {item.yearsExperience} {bi('yrs', 'سال')} · {item.verifiedCount}{' '}
                    {bi('verified badge(s)', 'تصدیق شدہ بیج')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/employer/workers/${item.publicId}`}
                    className="rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B]"
                  >
                    {bi('Open Portfolio', 'پورٹ فولیو کھولیں')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setRemoveTarget(item)}
                    className="rounded-full border border-[#E6E0D2] p-2 text-red-600 hover:bg-red-50"
                    title={bi('Remove from shortlist', 'شارٹ لسٹ سے ہٹائیں')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 border-t border-[#E6E0D2] pt-3">
                {editingNoteId === item.id ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder={bi('Add private hiring notes...', 'ذاتی نوٹس شامل کریں...')}
                      className="flex-1 rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => saveNote(item.id)}
                      className="rounded-full bg-[#176B4A] px-4 py-1.5 text-xs font-semibold text-white"
                    >
                      {bi('Save Note', 'نوٹ محفوظ کریں')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingNoteId(null)}
                      className="rounded-full border border-[#E6E0D2] px-4 py-1.5 text-xs font-medium text-[#69726B]"
                    >
                      {bi('Cancel', 'منسوخ')}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <p className="text-[#69726B]">
                      <span className="font-semibold text-[#17251E]">{bi('Private Note:', 'ذاتی نوٹ:')} </span>
                      {item.notes || bi('None', 'کوئی نہیں')}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteId(item.id);
                        setNoteText(item.notes || '');
                      }}
                      className="font-semibold text-[#176B4A] hover:underline"
                    >
                      {item.notes ? bi('Edit Note', 'نوٹ میں ترمیم') : bi('Add Note', 'نوٹ شامل کریں')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title={bi('Remove from Shortlist', 'شارٹ لسٹ سے ہٹائیں')}
        message={bi(
          `Remove ${removeTarget?.fullName} from your saved workers list?`,
          `کیا آپ ${removeTarget?.fullName} کو محفوظ فہرست سے ہٹانا چاہتے ہیں؟`
        )}
        confirmLabel={bi('Remove', 'ہٹائیں')}
        destructive
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </DashboardLayout>
  );
}

export function EmployerContactRequestsPage() {
  const { showToast } = useToast();
  const { bi, lang } = useI18n();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/contact-requests')
      .then((res) => setRequests(res.data.data || []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title={bi('Contact Requests', 'بھیجی گئی رابطہ درخواستیں')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : requests.length === 0 ? (
        <EmptyState
          title={bi('No contact requests sent', 'ابھی کوئی رابطہ درخواست نہیں بھیجی گئی')}
          description={bi("Open a worker's portfolio to send a contact request or book a job directly.", 'رابطہ درخواست بھیجنے یا کام بک کرنے کے لیے ہنرمند کا پورٹ فولیو کھولیں۔')}
          action={
            <Link to="/employer/search" className="rounded-full bg-[#176B4A] px-5 py-2.5 text-sm font-semibold text-white">
              {bi('Search Workers', 'ہنرمند تلاش کریں')}
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl kc-glass-card kc-hover-lift p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Link to={`/employer/workers/${r.workerPublicId}`} className="text-base font-bold text-[#17251E] hover:text-[#176B4A] hover:underline">
                    {r.workerName}
                  </Link>
                  <p className="text-xs text-[#69726B]">
                    {r.tradeName} · {r.workerCity} · {bi('Sent', 'بھیجی گئی:')} {formatDate(r.createdAt, lang)}
                  </p>
                </div>
                <StatusLabel status={r.status} />
              </div>

              {r.message && (
                <p className="mt-2 text-sm text-[#17251E]">
                  {bi('Message:', 'پیغام:')} “{r.message}”
                </p>
              )}

              {r.status === 'ACCEPTED' && r.contactDetails ? (
                <div className="mt-3 rounded-xl border border-[#C9973A] bg-[#ECE6D7]/65 p-3.5 flex flex-wrap gap-6 text-xs font-semibold text-[#176B4A]">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="font-mono">{r.contactDetails.phone}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{r.contactDetails.email}</span>
                  </span>
                </div>
              ) : (
                <p className="mt-3 text-xs text-[#69726B] flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-[#399B6B]" />
                  <span>
                    {bi(
                      'Contact details remain protected unless accepted by the worker.',
                      'ہنرمند کی منظوری تک رابطے کی تفصیلات محفوظ رہتی ہیں۔'
                    )}
                  </span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export function EmployerProfilePage() {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const { bi } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    city: '',
    phone: '',
    accountType: 'INDIVIDUAL' as 'INDIVIDUAL' | 'BUSINESS',
    companyName: '',
    industry: '',
    website: '',
    description: '',
  });

  useEffect(() => {
    api
      .get('/employers/me')
      .then((res) => {
        const d = res.data.data;
        setForm({
          fullName: d.fullName || '',
          city: d.city || '',
          phone: d.phone || '',
          accountType: d.accountType === 'BUSINESS' ? 'BUSINESS' : 'INDIVIDUAL',
          companyName: d.companyName || '',
          industry: d.industry || '',
          website: d.website || '',
          description: d.description || '',
        });
      })
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.city.trim()) {
      showToast(bi('Select your city in Pakistan.', 'پاکستان کا شہر منتخب کریں۔'), 'error');
      return;
    }
    setSaving(true);
    try {
      await api.put('/employers/me', form);
      await refreshUser();
      showToast(bi('Customer / Employer profile updated.', 'گاہک / آجِر کا پروفائل محفوظ ہو گیا۔'), 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title={bi('Customer / Employer Profile', 'گاہک / آجِر پروفائل')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <form onSubmit={handleSave} className="max-w-2xl rounded-2xl kc-glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#17251E] font-bold text-base">
            <Briefcase className="h-4 w-4 text-[#176B4A]" />
            <span>{bi('Account Type & Contact Details', 'اکاؤنٹ کی قسم اور رابطے کی تفصیلات')}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'INDIVIDUAL' as const, label: bi('Homeowner / Individual', 'گھریلو صارف / فرد') },
              { id: 'BUSINESS' as const, label: bi('Business / Facility Employer', 'کاروبار / کمپنی آجِر') },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setForm({ ...form, accountType: opt.id })}
                className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors ${
                  form.accountType === opt.id
                    ? 'border-[#176B4A] bg-[#ECE6D7]/75 text-[#176B4A]'
                    : 'border-[#E6E0D2] bg-[#F7F4EC] text-[#69726B]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#17251E] mb-1">{bi('Your Name', 'آپ کا نام')}</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#17251E] mb-1">
                {form.accountType === 'BUSINESS'
                  ? bi('Company / Organization Name', 'کمپنی / ادارے کا نام')
                  : bi('Company / Property Name (Optional)', 'کمپنی یا گھر کا نام (اختیاری)')}
              </label>
              <input
                type="text"
                required={form.accountType === 'BUSINESS'}
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder={form.accountType === 'INDIVIDUAL' ? bi('Optional for homeowners', 'گھریلو صارفین کے لیے اختیاری') : ''}
                className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#17251E] mb-1">{bi('City (Pakistan)', 'شہر (پاکستان)')}</label>
              <CityCombobox
                value={form.city}
                onChange={(c) => setForm({ ...form, city: c })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#17251E] mb-1">{bi('Phone', 'فون')}</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {form.accountType === 'BUSINESS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#17251E] mb-1">{bi('Industry', 'صنعت / شعبہ')}</label>
                <input
                  type="text"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#17251E] mb-1">{bi('Website', 'ویب سائٹ')}</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#17251E] mb-1">
              {form.accountType === 'BUSINESS' ? bi('About Organization', 'ادارے کا تعارف') : bi('Preferences / Notes', 'پسندیدگی / نوٹس')}
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#176B4A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
          >
            {saving ? bi('Saving...', 'محفوظ ہو رہا ہے...') : bi('Save Profile', 'پروفائل محفوظ کریں')}
          </button>
        </form>
      )}
    </DashboardLayout>
  );
}
