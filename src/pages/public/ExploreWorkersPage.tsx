import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Search, ShieldCheck, SlidersHorizontal, Trophy, X } from 'lucide-react';
import { PublicLayout } from '../../components/layouts/PublicLayout';
import { CityCombobox } from '../../components/ui/CityCombobox';
import { EmptyState, LoadingSkeleton, Pagination, formatLevelLabel } from '../../components/ui/Components';
import { PageTransition } from '../../components/ui/MotionPrimitives';
import { StarRatingInline, TierPill, TrustScoreBadge } from '../../components/ui/RatingDisplay';
import { PAKISTAN_PROVINCE_GROUPS } from '../../data/pakistanCities';
import { SERVICE_GROUPS } from '../../data/serviceCatalog';
import { api, getApiErrorMessage } from '../../services/api';
import { useI18n } from '../../i18n/translations';

export function ExploreWorkersPage() {
  const { bi, lang, isUr } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [trades, setTrades] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [group, setGroup] = useState(searchParams.get('group') || '');
  const [trade, setTrade] = useState(searchParams.get('trade') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [province, setProvince] = useState(searchParams.get('province') || '');
  const [competencyId, setCompetencyId] = useState(searchParams.get('competencyId') || '');
  const [level, setLevel] = useState(searchParams.get('level') || '');
  const [minExperience, setMinExperience] = useState(searchParams.get('minExperience') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [femaleOnly, setFemaleOnly] = useState(searchParams.get('femaleOnly') === 'true');
  const [sort, setSort] = useState(searchParams.get('sort') || 'verified_desc');
  const [page, setPage] = useState(Number(searchParams.get('page') || 1));

  useEffect(() => {
    api.get('/public/trades').then((res) => setTrades(res.data.data || [])).catch(() => {});
  }, []);

  const fetchWorkers = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/public/workers/search', {
        params: {
          q: q || undefined,
          group: group || undefined,
          trade: trade || undefined,
          city: city || undefined,
          province: province || undefined,
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
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers(page);
  }, [group, trade, city, province, competencyId, level, minExperience, minRating, femaleOnly, sort, page]);

  useEffect(() => {
    if (showLeaderboard) {
      api
        .get('/public/leaderboard', { params: { city: city || undefined } })
        .then((res) => setLeaderboard(res.data.data || []))
        .catch(() => setLeaderboard([]));
    }
  }, [showLeaderboard, city]);

  const filteredTrades = useMemo(
    () => (group ? trades.filter((t) => (t.group || '').toLowerCase() === group.toLowerCase()) : trades),
    [trades, group]
  );

  const selectedTradeObj = trades.find((t) => t.slug === trade || t.id === trade);
  const availableCompetencies = selectedTradeObj
    ? selectedTradeObj.competencies || []
    : filteredTrades.flatMap((t) => t.competencies || []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchWorkers(1);
  };

  const handleClear = () => {
    setQ('');
    setGroup('');
    setTrade('');
    setCity('');
    setProvince('');
    setCompetencyId('');
    setLevel('');
    setMinExperience('');
    setMinRating('');
    setFemaleOnly(false);
    setSort('verified_desc');
    setPage(1);
    setSearchParams({});
  };

  return (
    <PublicLayout>
      <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E6E0D2] pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#399B6B]">
              {bi('Nationwide Proven Directory', 'ملک گیر تصدیق شدہ ہنرمند ڈائریکٹری')}
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17251E]">
              {bi('Explore Skilled Workers Across Pakistan', 'پاکستان بھر میں ہنرمند افراد تلاش کریں')}
            </h1>
            <p className="mt-1 text-sm text-[#69726B]">
              {bi(
                'Filter by 48+ service categories, Pakistani city or province, Karigar Trust Score, customer rating, or female professionals.',
                '۴۸+ سروسز، پاکستانی شہر یا صوبے، ٹرسٹ اسکور، صارفین کی ریٹنگ یا خواتین پروفیشنلز کے لحاظ سے تلاش کریں۔'
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowLeaderboard((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D8D0BE] bg-[#ECE6D7]/60 px-4 py-2 text-xs font-bold text-[#176B4A] hover:bg-[#ECE6D7]"
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>{city ? bi(`Top Karigars in ${city}`, `${city} کے ٹاپ کاریگر`) : bi('City Leaderboard', 'ٹاپ کاریگر لیڈربورڈ')}</span>
            </button>
            <p className="text-sm font-semibold text-[#176B4A] tabular-nums whitespace-nowrap">
              {isUr ? `${pagination.total} ہنرمند ملے` : `${pagination.total} worker${pagination.total === 1 ? '' : 's'} found`}
            </p>
          </div>
        </div>

        {showLeaderboard && (
          <div className="mt-5 rounded-2xl border border-[#C9973A] bg-[#ECE6D7]/85 p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-extrabold text-[#17251E] flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#176B4A]" />
                {city ? bi(`Top Proven Karigars — ${city}`, `ٹاپ ثابت شدہ کاریگر — ${city}`) : bi('Top Proven Karigars Across Pakistan', 'پاکستان کے ٹاپ کاریگر')}
              </h2>
              <button type="button" onClick={() => setShowLeaderboard(false)} className="text-xs font-semibold text-[#4D6357] hover:text-[#17251E]">
                {bi('Hide', 'بند کریں')}
              </button>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-xs text-[#4D6357]">{bi('No ranked workers in this city yet.', 'اس شہر میں ابھی کوئی رینک شدہ ہنرمند موجود نہیں۔')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {leaderboard.slice(0, 6).map((lw, i) => (
                  <Link
                    key={lw.workerProfileId}
                    to={`/workers/${lw.publicId}`}
                    className="rounded-xl border border-[#D8D0BE] bg-[#F3EFE4] p-3 flex items-center justify-between gap-3 hover:border-[#176B4A]"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#17251E] truncate">
                        #{i + 1} {lw.fullName}
                      </p>
                      <p className="text-[11px] text-[#69726B] truncate">
                        {lw.tradeName} · {lw.city}
                      </p>
                    </div>
                    <TrustScoreBadge score={lw.trustScore} compact />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSearchSubmit} className="mt-6 rounded-2xl kc-glass-card p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2 relative">
              <Search className="absolute start-3.5 top-3 h-4 w-4 text-[#69726B]" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={bi('Search name, skill, or competency...', 'نام، ہنر یا مہارت تلاش کریں...')}
                className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] ps-9 pe-3 py-2.5 text-sm text-[#17251E] focus:border-[#399B6B] focus:bg-white focus:outline-none"
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
              className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2.5 text-sm text-[#17251E] focus:border-[#399B6B] focus:bg-white focus:outline-none"
            >
              <option value="">{bi('All Service Groups', 'تمام سروس شعبے')}</option>
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
              className="rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2.5 text-sm text-[#17251E] focus:border-[#399B6B] focus:bg-white focus:outline-none"
            >
              <option value="">{bi('All Categories', 'تمام کیٹیگریز')}</option>
              {filteredTrades.map((t) => (
                <option key={t.id} value={t.slug}>
                  {isUr && t.urduName ? t.urduName : t.name}
                </option>
              ))}
            </select>

            <CityCombobox
              value={city}
              onChange={(nextCity) => {
                setCity(nextCity);
                setPage(1);
              }}
              allowAll
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#176B4A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#13563B] transition-colors"
              >
                {bi('Search', 'تلاش کریں')}
              </button>
              <button
                type="button"
                onClick={handleClear}
                title={bi('Clear filters', 'فلٹر صاف کریں')}
                className="rounded-xl border border-[#E6E0D2] px-3 py-2.5 text-sm text-[#69726B] hover:bg-[#F7F4EC] hover:text-[#17251E]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 pt-3 border-t border-[#E6E0D2] text-xs">
            <span className="inline-flex items-center gap-1 text-[#69726B] font-medium">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {bi('Refine:', 'مزید فلٹر:')}
            </span>

            <select
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-[#E6E0D2] bg-[#F7F4EC] px-2.5 py-1.5 text-xs text-[#17251E]"
            >
              <option value="">{bi('All Provinces', 'تمام صوبے')}</option>
              {PAKISTAN_PROVINCE_GROUPS.map((p) => (
                <option key={p.province} value={p.province}>
                  {isUr ? p.urduName : p.province}
                </option>
              ))}
            </select>

            <select
              value={competencyId}
              onChange={(e) => {
                setCompetencyId(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-[#E6E0D2] bg-[#F7F4EC] px-2.5 py-1.5 text-xs text-[#17251E] max-w-[200px]"
            >
              <option value="">{bi('All Competencies', 'تمام مہارتیں')}</option>
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
              className="rounded-lg border border-[#E6E0D2] bg-[#F7F4EC] px-2.5 py-1.5 text-xs text-[#17251E]"
            >
              <option value="">{bi('Any Badge Level', 'کوئی بھی بیج درجہ')}</option>
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
              className="rounded-lg border border-[#E6E0D2] bg-[#F7F4EC] px-2.5 py-1.5 text-xs text-[#17251E]"
            >
              <option value="">{bi('Any Rating', 'کوئی بھی ریٹنگ')}</option>
              <option value="4">{bi('4.0★ & up', '4.0★ یا زیادہ')}</option>
              <option value="4.5">{bi('4.5★ & up', '4.5★ یا زیادہ')}</option>
            </select>

            <select
              value={minExperience}
              onChange={(e) => {
                setMinExperience(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-[#E6E0D2] bg-[#F7F4EC] px-2.5 py-1.5 text-xs text-[#17251E]"
            >
              <option value="">{bi('Any Experience', 'کوئی بھی تجربہ')}</option>
              <option value="1">{bi('1+ yrs', '۱+ سال')}</option>
              <option value="3">{bi('3+ yrs', '۳+ سال')}</option>
              <option value="5">{bi('5+ yrs', '۵+ سال')}</option>
            </select>

            <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8D0BE] bg-[#ECE6D7]/40 px-2.5 py-1.5 text-xs font-semibold text-[#176B4A] cursor-pointer">
              <input
                type="checkbox"
                checked={femaleOnly}
                onChange={(e) => {
                  setFemaleOnly(e.target.checked);
                  setPage(1);
                }}
                className="accent-[#176B4A]"
              />
              <span>{bi('Women professionals only', 'صرف خواتین پروفیشنلز')}</span>
            </label>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="ms-auto rounded-lg border border-[#E6E0D2] bg-[#F7F4EC] px-2.5 py-1.5 text-xs text-[#17251E]"
            >
              <option value="verified_desc">{bi('Sort: Most Verified', 'ترتیب: زیادہ تصدیق شدہ')}</option>
              <option value="top_rated">{bi('Sort: Top Rated', 'ترتیب: بہترین ریٹنگ')}</option>
              <option value="most_jobs">{bi('Sort: Most Completed Jobs', 'ترتیب: زیادہ مکمل کام')}</option>
              <option value="trust_desc">{bi('Sort: Highest Trust Score', 'ترتیب: سب سے زیادہ ٹرسٹ اسکور')}</option>
              <option value="experience_desc">{bi('Sort: Highest Experience', 'ترتیب: زیادہ تجربہ')}</option>
              <option value="name_asc">{bi('Sort: Name A–Z', 'ترتیب: نام کے مطابق')}</option>
            </select>
          </div>
        </form>

        <div className="mt-6">
          {loading ? (
            <LoadingSkeleton rows={4} />
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : workers.length === 0 ? (
            <EmptyState
              title={bi('No matching skilled workers found', 'کوئی مطابق ہنرمند نہیں ملا')}
              description={bi(
                'Try clearing your category, rating, or city filters to view more proven Karigars.',
                'مزید تصدیق شدہ ہنرمند دیکھنے کے لیے فلٹرز صاف کریں۔'
              )}
              action={
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-full bg-[#176B4A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#13563B]"
                >
                  {bi('Clear All Filters', 'تمام فلٹر صاف کریں')}
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
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#E6E0D2] bg-[#ECE6D7] flex items-center justify-center text-base font-bold text-[#176B4A]">
                        {w.avatarUrl ? (
                          <img src={w.avatarUrl} alt={w.fullName} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                        ) : (
                          w.fullName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-[#17251E] truncate">{w.fullName}</h3>
                          <TrustScoreBadge score={w.trustScore ?? 0} compact />
                        </div>
                        <p className="text-xs font-medium text-[#69726B] mt-0.5 truncate">
                          {isUr && w.tradeUrduName ? w.tradeUrduName : w.tradeName} · {w.yearsExperience}{' '}
                          {bi('yrs exp', 'سال تجربہ')}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-[#69726B]">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#399B6B]" />
                          <span>{w.city}</span>
                          {w.isFemaleProfessional && (
                            <span className="ms-1.5 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                              {bi('Female Pro', 'خاتون پروفیشنل')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <TierPill tier={w.tier} underReview={w.tierUnderReview} tierStatus={w.tierStatus} compact />
                      {w.ratingSummary && (
                        <StarRatingInline rating={w.ratingSummary.bayesianRating} count={w.ratingSummary.totalReviews} />
                      )}
                    </div>

                    <p className="mt-2.5 text-sm text-[#69726B] line-clamp-2">
                      {w.bio || bi('Practical tradesperson building verified competency portfolio.', 'تصدیق شدہ مہارتوں کا پورٹ فولیو بنانے والے عملی ہنرمند۔')}
                    </p>

                    <div className="mt-4 rounded-xl kc-info-box p-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#176B4A]">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 shrink-0 text-[#176B4A]" />
                          <span className="tabular-nums">
                            {isUr
                              ? `${w.verifiedCount} تصدیق شدہ مہارتیں`
                              : `${w.verifiedCount} Verified Competenc${w.verifiedCount === 1 ? 'y' : 'ies'}`}
                          </span>
                        </span>
                        <span className="text-[#4D6357] tabular-nums">
                          {w.completedJobsCount || 0} {bi('jobs', 'کام')}
                        </span>
                      </div>
                      {w.verifiedBadges?.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-[#17251E]">
                          {w.verifiedBadges.slice(0, 2).map((b: any) => (
                            <li key={b.id} className="truncate">
                              • {b.competencyTitle} ({formatLevelLabel(b.level, lang)})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#D8D0BE]">
                    <Link
                      to={`/workers/${w.publicId}`}
                      className="block w-full rounded-full bg-[#176B4A] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#13563B] transition-colors"
                    >
                      {bi('View portfolio', 'پورٹ فولیو دیکھیں')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
          </div>
        </div>
      </PageTransition>
    </PublicLayout>
  );
}
