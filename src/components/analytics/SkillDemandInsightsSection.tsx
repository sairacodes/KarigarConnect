import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Briefcase,
  Calendar,
  Compass,
  Flame,
  Layers,
  MapPin,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  CategoryDistributionDatum,
  CategoryDoughnutChart,
  InDemandSkillDatum,
  InDemandSkillsBarChart,
  LocationDemandChart,
  LocationDemandDatum,
  MonthlyDemandLineChart,
  MonthlyTrendDatum,
} from './DemandCharts';
import { LoadingSkeleton } from '../ui/Components';
import { useAuth } from '../../context/AuthContext';
import { SERVICE_GROUPS } from '../../data/serviceCatalog';
import { api, getApiErrorMessage } from '../../services/api';
import { useI18n } from '../../i18n/translations';

interface TrendingSkillDatum {
  tradeId: string;
  slug: string;
  name: string;
  urduName: string;
  group: string;
  recentCount: number;
  previousCount: number;
  delta: number;
  growthPct: number;
  totalRequests: number;
}

interface SkillOpportunityDatum {
  tradeId: string;
  slug: string;
  name: string;
  urduName: string;
  group: string;
  requestsCount: number;
  availableKarigars: number;
  verifiedKarigars: number;
  demandPerKarigar: number;
  status: 'HIGH_OPPORTUNITY' | 'GROWING_NEED' | 'BALANCED';
}

interface DemandInsightsPayload {
  summary: {
    totalDemandRequests: number;
    completedBookings: number;
    activeKarigarsMatching: number;
    uniqueCitiesWithDemand: number;
    topInDemandSkill: { name: string; urduName: string; count: number } | null;
    topOpportunitySkill: {
      name: string;
      urduName: string;
      ratio: number;
      status: string;
    } | null;
  };
  mostInDemandSkills: InDemandSkillDatum[];
  trendingSkills: TrendingSkillDatum[];
  categoryDistribution: CategoryDistributionDatum[];
  locationDemand: LocationDemandDatum[];
  monthlyTrends: MonthlyTrendDatum[];
  skillOpportunities: SkillOpportunityDatum[];
  filterOptions: {
    cities: string[];
    categories: string[];
  };
}

export function SkillDemandInsightsSection({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const { bi, isUr } = useI18n();
  const navigate = useNavigate();

  const [categoryGroup, setCategoryGroup] = useState('ALL');
  const [city, setCity] = useState('ALL');
  const [period, setPeriod] = useState<'30d' | '90d' | '6m' | 'all'>('90d');
  const [data, setData] = useState<DemandInsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get('/public/demand-insights', {
        params: {
          categoryGroup: categoryGroup !== 'ALL' ? categoryGroup : undefined,
          city: city !== 'ALL' ? city : undefined,
          period,
        },
      })
      .then((res) => {
        if (active) setData(res.data.data);
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [categoryGroup, city, period]);

  const handleResetFilters = () => {
    setCategoryGroup('ALL');
    setCity('ALL');
    setPeriod('90d');
  };

  const handleSelectTrade = (slug: string) => {
    const params = new URLSearchParams({ trade: slug });
    if (city !== 'ALL') params.set('city', city);
    navigate(user?.role === 'EMPLOYER' ? `/employer/search?${params.toString()}` : `/explore?${params.toString()}`);
  };

  const isKarigar = user?.role === 'WORKER';

  const periodOptions: Array<{ value: '30d' | '90d' | '6m' | 'all'; label: string }> = [
    { value: '30d', label: bi('Last 30 Days', 'گزشتہ ۳۰ دن') },
    { value: '90d', label: bi('Last 90 Days', 'گزشتہ ۹۰ دن') },
    { value: '6m', label: bi('Last 6 Months', 'گزشتہ ۶ ماہ') },
    { value: 'all', label: bi('All Time', 'مکمل ریکارڈ') },
  ];

  const categoryChoices = data?.filterOptions.categories?.length
    ? data.filterOptions.categories
    : SERVICE_GROUPS.map((g) => g.group);

  const cityChoices = data?.filterOptions.cities || [];

  const getGroupLabel = (groupName: string) => {
    const found = SERVICE_GROUPS.find((g) => g.group.toLowerCase() === groupName.toLowerCase());
    if (!found) return groupName;
    return isUr ? found.urduGroup : found.group;
  };

  const opportunityBadge = (status: SkillOpportunityDatum['status']) => {
    if (status === 'HIGH_OPPORTUNITY') {
      return {
        label: bi('High Opportunity', 'اعلیٰ موقع'),
        cls: 'bg-[#11221B] text-[#D8D0BE]',
      };
    }
    if (status === 'GROWING_NEED') {
      return {
        label: bi('Growing Demand', 'بڑھتی ہوئی طلب'),
        cls: 'bg-[#ECE6D7] text-[#176B4A]',
      };
    }
    return {
      label: bi('Balanced Supply', 'متوازن طلب و رسد'),
      cls: 'bg-[#F3EFE4] border border-[#E2DBCB] text-[#176B4A]',
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner + Role Guidance */}
      {!embedded && (
        <div className="rounded-3xl kc-dark-surface text-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#399B6B]/25 border border-[#C9973A]/40 px-3.5 py-1 text-xs font-bold text-[#D8D0BE]">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>{bi('Live Marketplace Telemetry · Real Database Records', 'لائیو اسکل ڈیمانڈ تجزیات · اصل ڈیٹابیس ریکارڈ')}</span>
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {bi('Skill Demand Insights', 'مہارتوں کی طلب اور رجحانات (Skill Demand Insights)')}
              </h1>
              <p className="mt-2 text-sm text-[#ECE6D7]/85 leading-relaxed">
                {isKarigar
                  ? bi(
                      'See which trade skills Hirers are requesting most across Pakistani cities and spot high-opportunity trades with fewer available Karigars.',
                      'دیکھیں کہ پاکستان کے کن شہروں میں کون سی مہارتوں کی طلب سب سے زیادہ ہے اور کن شعبوں میں کاریگروں کی کمی ہے۔'
                    )
                  : bi(
                      'Track real-time hiring demand, trending service categories, and available verified Karigar supply across cities in Pakistan.',
                      'پاکستان کے مختلف شہروں میں مہارتوں کی طلب، ابھرتے رجحانات اور دستیاب ہنرمندوں کا اصل ڈیٹا دیکھیں۔'
                    )}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              {isKarigar ? (
                <Link
                  to="/worker/trades"
                  className="inline-flex items-center gap-2 rounded-full bg-[#ECE6D7] px-5 py-2.5 text-xs font-bold text-[#11221B] hover:bg-[#D8D0BE] transition-colors"
                >
                  <span>{bi('Update My Trade & Badges', 'میرا ہنر اور بیجز اپ ڈیٹ کریں')}</span>
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              ) : (
                <Link
                  to={user?.role === 'EMPLOYER' ? '/employer/search' : '/explore'}
                  className="inline-flex items-center gap-2 rounded-full bg-[#ECE6D7] px-5 py-2.5 text-xs font-bold text-[#11221B] hover:bg-[#D8D0BE] transition-colors"
                >
                  <span>{bi('Find Available Karigars', 'دستیاب کاریگر تلاش کریں')}</span>
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Filter Controls */}
      <div className="rounded-3xl bg-white border border-[#E2DBCB] p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-4">
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#11221B] mb-1.5">
              <Layers className="h-3.5 w-3.5 text-[#176B4A]" />
              <span>{bi('Skill Category', 'مہارت کی کیٹیگری')}</span>
            </label>
            <select
              value={categoryGroup}
              onChange={(e) => setCategoryGroup(e.target.value)}
              className="w-full rounded-xl border border-[#E2DBCB] bg-[#F3EFE4] px-3 py-2 text-sm font-medium text-[#17251E] focus:border-[#176B4A] focus:bg-white focus:outline-none"
            >
              <option value="ALL">{bi('All Skill Categories', 'تمام سروس کیٹیگریز')}</option>
              {categoryChoices.map((g) => (
                <option key={g} value={g}>
                  {getGroupLabel(g)}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-4">
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#11221B] mb-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#176B4A]" />
              <span>{bi('Location (City)', 'شہر کا انتخاب')}</span>
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-[#E2DBCB] bg-[#F3EFE4] px-3 py-2 text-sm font-medium text-[#17251E] focus:border-[#176B4A] focus:bg-white focus:outline-none"
            >
              <option value="ALL">{bi('All Cities in Pakistan', 'پاکستان کے تمام شہر')}</option>
              {cityChoices.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-4">
            <label className="flex items-center justify-between text-xs font-bold text-[#11221B] mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#176B4A]" />
                <span>{bi('Time Period', 'مدت')}</span>
              </span>
              {(categoryGroup !== 'ALL' || city !== 'ALL' || period !== '90d') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#176B4A] hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{bi('Reset', 'ری سیٹ')}</span>
                </button>
              )}
            </label>
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-[#F3EFE4] p-1">
              {periodOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPeriod(opt.value)}
                  className={`rounded-lg py-1.5 px-1.5 text-[11px] font-bold transition-colors truncate ${
                    period === opt.value
                      ? 'bg-[#11221B] text-white shadow-xs'
                      : 'text-[#4D6357] hover:text-[#11221B]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : error || !data ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || bi('Unable to load demand insights.', 'ڈیمانڈ تجزیات لوڈ نہیں ہو سکے۔')}
        </div>
      ) : (
        <>
          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl kc-kpi-gradient text-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-[#ECE6D7]">
                <span>{bi('Total Skill Requests', 'کل سکل ڈیمانڈ درخواستیں')}</span>
                <Briefcase className="h-4 w-4 text-[#D8D0BE]" />
              </div>
              <p className="mt-3 font-mono text-3xl font-extrabold tabular-nums">
                {data.summary.totalDemandRequests.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-[#ECE6D7]/90 tabular-nums">
                {data.summary.completedBookings} {bi('completed bookings', 'مکمل شدہ کام')} ·{' '}
                {data.summary.uniqueCitiesWithDemand} {bi('cities active', 'فعال شہر')}
              </p>
            </div>

            <div className="rounded-3xl bg-white border border-[#E2DBCB] p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-[#4D6357]">
                <span>{bi('Available Karigars', 'دستیاب کاریگر')}</span>
                <Users className="h-4 w-4 text-[#176B4A]" />
              </div>
              <p className="mt-3 font-mono text-3xl font-extrabold text-[#11221B] tabular-nums">
                {data.summary.activeKarigarsMatching.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-[#4D6357]">
                {city === 'ALL'
                  ? bi('Public active Karigars matching filter', 'موجودہ فلٹر میں دستیاب کاریگر')
                  : bi(`Active Karigars in ${city}`, `${city} میں دستیاب کاریگر`)}
              </p>
            </div>

            <div className="rounded-3xl bg-white border border-[#E2DBCB] p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-[#4D6357]">
                <span>{bi('Most Requested Skill', 'سب سے زیادہ طلب والا ہنر')}</span>
                <Flame className="h-4 w-4 text-[#176B4A]" />
              </div>
              <p className="mt-3 text-lg sm:text-xl font-extrabold text-[#11221B] truncate">
                {data.summary.topInDemandSkill
                  ? isUr && data.summary.topInDemandSkill.urduName
                    ? data.summary.topInDemandSkill.urduName
                    : data.summary.topInDemandSkill.name
                  : bi('No Requests Yet', 'ابھی کوئی ریکارڈ نہیں')}
              </p>
              <p className="mt-2 text-xs font-semibold text-[#176B4A] tabular-nums">
                {data.summary.topInDemandSkill
                  ? `${data.summary.topInDemandSkill.count} ${bi('requests in period', 'درخواستیں اس مدت میں')}`
                  : bi('Try widening your filters', 'فلٹرز تبدیل کر کے دیکھیں')}
              </p>
            </div>

            <div className="rounded-3xl bg-[#F3EFE4] border border-[#D8D0BE] p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-[#176B4A]">
                <span>{bi('Top Skill Opportunity', 'بہترین ہنری موقع')}</span>
                <Compass className="h-4 w-4 text-[#176B4A]" />
              </div>
              <p className="mt-3 text-lg sm:text-xl font-extrabold text-[#11221B] truncate">
                {data.summary.topOpportunitySkill
                  ? isUr && data.summary.topOpportunitySkill.urduName
                    ? data.summary.topOpportunitySkill.urduName
                    : data.summary.topOpportunitySkill.name
                  : bi('Balanced', 'متوازن')}
              </p>
              <p className="mt-2 text-xs font-semibold text-[#176B4A] tabular-nums">
                {data.summary.topOpportunitySkill
                  ? `${data.summary.topOpportunitySkill.ratio}× ${bi('requests per Karigar', 'درخواستیں فی کاریگر')}`
                  : bi('No underserved demand detected', 'کوئی نمایاں کمی نہیں ملی')}
              </p>
            </div>
          </div>

          {/* Row 1: 1. Most In-Demand Skills (Bar Chart) + 2. Trending Skills */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 rounded-3xl bg-white border border-[#E2DBCB] p-5 sm:p-6 shadow-xs">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#11221B]">
                    {bi('1. Most In-Demand Skills', '۱۔ سب سے زیادہ طلب والی مہارتیں')}
                  </h2>
                  <p className="text-xs text-[#4D6357]">
                    {bi(
                      'Ranked by real job bookings & contact inquiries from Hirers',
                      'ہائررز کی حقیقی بکنگ اور رابطہ درخواستوں کی بنیاد پر درجہ بندی'
                    )}
                  </p>
                </div>
                <BarChart3 className="h-5 w-5 text-[#176B4A] shrink-0" />
              </div>

              <InDemandSkillsBarChart data={data.mostInDemandSkills} onSelectTrade={handleSelectTrade} />
            </div>

            <div className="lg:col-span-5 rounded-3xl bg-white border border-[#E2DBCB] p-5 sm:p-6 shadow-xs flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#11221B]">
                    {bi('2. Trending Skills', '۲۔ بڑھتی ہوئی طلب والی مہارتیں')}
                  </h2>
                  <p className="text-xs text-[#4D6357]">
                    {bi(
                      'Skills showing positive request momentum vs. the previous window',
                      'گزشتہ مدت کے مقابلے میں تیز رفتاری سے بڑھتی ہوئی مہارتیں'
                    )}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-[#176B4A] shrink-0" />
              </div>

              {data.trendingSkills.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center rounded-2xl bg-[#F3EFE4] border border-[#E2DBCB] p-6 text-center">
                  <Activity className="h-7 w-7 text-[#399B6B] mb-2" />
                  <p className="text-sm font-bold text-[#11221B]">
                    {bi('Steady Demand Velocity', 'مستحکم طلب کی رفتار')}
                  </p>
                  <p className="mt-1 text-xs text-[#4D6357] max-w-xs">
                    {bi(
                      'No skill showed an upward spike over the prior window for this exact filter. Try switching to Last 90 Days or All Cities.',
                      'اس فلٹر میں پچھلے وقفے کے مقابلے میں کوئی غیر معمولی اضافہ نہیں ہوا۔ تمام شہر یا ۹۰ دن منتخب کریں۔'
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 flex-1">
                  {data.trendingSkills.map((item) => (
                    <button
                      key={item.tradeId}
                      type="button"
                      onClick={() => handleSelectTrade(item.slug)}
                      className="w-full rounded-2xl bg-[#F3EFE4] border border-[#E2DBCB] p-3.5 text-start hover:bg-[#ECE6D7] transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#11221B] truncate">
                            {isUr && item.urduName ? item.urduName : item.name}
                          </span>
                          <span className="rounded-full bg-[#ECE6D7] px-2 py-0.5 font-mono text-[10px] font-extrabold text-[#176B4A] tabular-nums shrink-0">
                            +{item.growthPct}%
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#4D6357] tabular-nums">
                          {bi('Recent window:', 'حالیہ:')} <strong>{item.recentCount}</strong> ·{' '}
                          {bi('Prior:', 'سابقہ:')} {item.previousCount} (+{item.delta})
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#176B4A] shrink-0 rtl:rotate-180" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: 3. Category Distribution (Doughnut Chart) + 5. Monthly Demand Trends (Line Chart) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 rounded-3xl bg-white border border-[#E2DBCB] p-5 sm:p-6 shadow-xs">
              <div className="mb-4">
                <h2 className="text-base sm:text-lg font-extrabold text-[#11221B]">
                  {bi('3. Category Distribution', '۳۔ پیشہ ورانہ شعبوں میں طلب کی تقسیم')}
                </h2>
                <p className="text-xs text-[#4D6357]">
                  {bi(
                    'Click any sector slice or legend item to cross-filter insights',
                    'فلٹر کرنے کے لیے کسی بھی شعبے کے حصے پر کلک کریں'
                  )}
                </p>
              </div>
              <CategoryDoughnutChart
                data={data.categoryDistribution}
                activeCategory={categoryGroup}
                onSelectCategory={(grp) => setCategoryGroup(grp)}
              />
            </div>

            <div className="lg:col-span-7 rounded-3xl bg-white border border-[#E2DBCB] p-5 sm:p-6 shadow-xs">
              <div className="mb-4">
                <h2 className="text-base sm:text-lg font-extrabold text-[#11221B]">
                  {period === '30d'
                    ? bi('5. Weekly Demand Trends (30 Days)', '۵۔ ہفتہ وار طلب کا رجحان (۳۰ دن)')
                    : bi('5. Monthly Demand Trends', '۵۔ ماہانہ طلب کا رجحان')}
                </h2>
                <p className="text-xs text-[#4D6357]">
                  {bi(
                    'Comparing total skill requests against verified completed jobs over time',
                    'وقت کے ساتھ کل درخواستوں اور مکمل شدہ کاموں کا موازنہ'
                  )}
                </p>
              </div>
              <MonthlyDemandLineChart data={data.monthlyTrends} />
            </div>
          </div>

          {/* Row 3: 4. Location-Based Demand + 6. Skill Opportunities */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6 rounded-3xl bg-white border border-[#E2DBCB] p-5 sm:p-6 shadow-xs">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#11221B]">
                    {bi('4. Location-Based Demand', '۴۔ شہروں کے لحاظ سے مہارتوں کی طلب')}
                  </h2>
                  <p className="text-xs text-[#4D6357]">
                    {bi(
                      'City-by-city demand requests vs. registered public Karigars',
                      'ہر شہر میں طلب کی درخواستیں بمقابلہ دستیاب کاریگر'
                    )}
                  </p>
                </div>
                <MapPin className="h-5 w-5 text-[#176B4A] shrink-0" />
              </div>

              <LocationDemandChart data={data.locationDemand} onSelectCity={(c) => setCity(c)} />
            </div>

            <div className="lg:col-span-6 rounded-3xl bg-[#F3EFE4] border border-[#D8D0BE] p-5 sm:p-6 shadow-xs">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#11221B]">
                    {bi('6. Skill Opportunities (Demand vs. Supply)', '۶۔ ہنر کے بہترین مواقع (طلب بمقابلہ رسد)')}
                  </h2>
                  <p className="text-xs text-[#4D6357]">
                    {isKarigar
                      ? bi(
                          'Trades with high customer demand relative to currently registered Karigars',
                          'وہ پیشے جہاں دستیاب کاریگروں کے مقابلے میں صارفین کی طلب زیادہ ہے'
                        )
                      : bi(
                          'Spots tight-supply trades vs. categories with ready verified talent',
                          'وہ شعبے جہاں ہنرمندوں کی کمی یا فوری دستیابی موجود ہے'
                        )}
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-[#176B4A] shrink-0" />
              </div>

              {data.skillOpportunities.length === 0 ? (
                <div className="flex h-60 items-center justify-center rounded-2xl bg-white border border-[#E2DBCB] p-6 text-center text-sm text-[#4D6357]">
                  {bi(
                    'No active skill demand records match this filter combination.',
                    'اس فلٹر کے مطابق طلب بمقابلہ رسد کا کوئی ریکارڈ نہیں ملا۔'
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {data.skillOpportunities.map((opp) => {
                    const badge = opportunityBadge(opp.status);
                    const meterPct = Math.min(100, Math.max(15, Math.round((opp.demandPerKarigar / 8) * 100)));
                    return (
                      <div
                        key={opp.tradeId}
                        className="rounded-2xl bg-white border border-[#E2DBCB] p-4 shadow-2xs flex flex-col gap-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-[#11221B] truncate">
                              {isUr && opp.urduName ? opp.urduName : opp.name}
                            </p>
                            <p className="text-[11px] text-[#4D6357] tabular-nums">
                              {opp.requestsCount} {bi('requests', 'درخواستیں')} · {opp.availableKarigars}{' '}
                              {bi('Karigars', 'کاریگر')} ({opp.verifiedKarigars} {bi('verified', 'تصدیق شدہ')})
                            </p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0 ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-[#ECE6D7] overflow-hidden">
                            <div
                              style={{ width: `${meterPct}%` }}
                              className="h-full rounded-full bg-gradient-to-r from-[#176B4A] to-[#399B6B]"
                            />
                          </div>
                          <span className="font-mono text-xs font-extrabold text-[#176B4A] tabular-nums shrink-0">
                            {opp.demandPerKarigar}×
                          </span>
                        </div>

                        <div className="flex justify-end">
                          {isKarigar ? (
                            <Link
                              to="/worker/trades"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#176B4A] hover:underline"
                            >
                              <span>{bi('Build skills in this trade', 'اس ہنر میں پروفائل اپ ڈیٹ کریں')}</span>
                              <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectTrade(opp.slug)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#176B4A] hover:underline"
                            >
                              <span>{bi('Discover available Karigars', 'دستیاب کاریگر دیکھیں')}</span>
                              <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
