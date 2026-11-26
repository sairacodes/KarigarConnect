import { ALL_CITIES_FLAT } from '../../data/pakistanCities';
import { getServiceBySlugOrId } from '../../data/serviceCatalog';
import { getEvidencePreviewUrl, saveEvidenceFile, validateEvidenceFiles } from './indexedDbFiles';
import {
  appendAuditLog,
  appendNotification,
  checkAndQueueEligibleTierApplication,
  deleteRecordsWhere,
  findRecord,
  insertRecord,
  newId,
  writeDb,
} from './localDb';
import {
  TIER_ORDER,
  computeTrustScoreBreakdown,
  computeWorkerRatingSummary,
  ensureWorkerPassportId,
  evaluateWorkerTierProgress,
  getTierRules,
} from './trustAndTiers';
import {
  InternalDatabaseSchema,
  JobPhotoRef,
  JobRecord,
  KarigarTier,
  TierRuleConfig,
  UserRecord,
  UserRole,
} from './types';

export interface ApiDispatchContext {
  db: InternalDatabaseSchema;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  query: Record<string, string>;
  body: any;
  authUser: UserRecord | null;
  activeToken: string | null;
  ok: <T>(data?: T, message?: string) => { data: any };
  fail: (status: number, message: string) => never;
  requireAuthUser: (...roles: UserRole[]) => UserRecord;
}

function computePriceStatus(
  db: InternalDatabaseSchema,
  tradeId: string,
  quotedPkr: number | null
): JobRecord['priceStatus'] {
  if (!quotedPkr || quotedPkr <= 0) return 'NO_GUIDE';
  const trade = db.trades.find((t) => t.id === tradeId);
  const guide = trade?.priceGuide?.length
    ? trade.priceGuide
    : getServiceBySlugOrId(trade?.slug || tradeId)?.defaultPriceGuide || [];
  if (!guide.length) return 'NO_GUIDE';
  const minAll = Math.min(...guide.map((g) => g.minPkr));
  const maxAll = Math.max(...guide.map((g) => g.maxPkr));
  if (quotedPkr < minAll) return 'BELOW_GUIDE';
  if (quotedPkr > maxAll) return 'ABOVE_GUIDE';
  return 'WITHIN_GUIDE';
}

async function resolvePhotoRefs(refs: JobPhotoRef[]) {
  return Promise.all(
    (refs || []).map(async (p) => ({
      ...p,
      signedUrl: await getEvidencePreviewUrl(p.fileKey, p.seedAssetPath),
    }))
  );
}

async function extractUploadedPhotos(formData: FormData, fieldName: string, prefix: string): Promise<JobPhotoRef[]> {
  const files = formData.getAll(fieldName).filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return [];
  const err = validateEvidenceFiles(files);
  if (err) {
    throw new Error(err);
  }
  const refs: JobPhotoRef[] = [];
  for (const file of files.slice(0, 5)) {
    const id = newId(prefix);
    const fileKey = `jobfile_${id}`;
    await saveEvidenceFile(fileKey, file, {
      mimeType: file.type,
      originalName: file.name,
    });
    refs.push({
      id,
      fileKey,
      originalName: file.name,
      mimeType: file.type,
    });
  }
  return refs;
}

export async function dispatchV2ApiRoute(ctx: ApiDispatchContext): Promise<{ data: any } | null> {
  const { db, method, path, query, body, ok, requireAuthUser } = ctx;
  const fail: (status: number, message: string) => never = ctx.fail;

  // ==================== PUBLIC V2 STATS, LEADERBOARD, VERIFY ====================
  if (method === 'GET' && path === '/public/stats') {
    const nowMs = Date.now();
    const activeWorkers = db.workerProfiles.filter((wp) => {
      const u = db.users.find((usr) => usr.id === wp.userId);
      return wp.isPublic && u?.status === 'ACTIVE';
    });
    const verifiedBadges = db.badges.filter(
      (b) => b.status === 'ACTIVE' && new Date(b.expiresAt).getTime() > nowMs
    );
    const activeTrades = db.trades.filter((t) => t.isActive);
    const activeCompetencies = db.competencies.filter((c) => c.isActive);
    const approvedAssessors = db.assessorProfiles.filter((a) => {
      const u = db.users.find((usr) => usr.id === a.userId);
      return a.approvalStatus === 'APPROVED' && u?.status === 'ACTIVE';
    });
    const completedJobs = (db.jobs || []).filter((j) => j.status === 'COMPLETED');
    const visibleReviews = (db.reviews || []).filter((r) => !r.isHiddenByAdmin);
    const avgRating =
      visibleReviews.length > 0
        ? Math.round(
            (visibleReviews.reduce((acc, r) => acc + r.overallRating, 0) / visibleReviews.length) * 10
          ) / 10
        : 0;
    const workerCities = new Set(
      activeWorkers
        .map((wp) => db.users.find((u) => u.id === wp.userId)?.city)
        .filter(Boolean)
    );

    return ok({
      verifiedWorkersCount: activeWorkers.length,
      totalCompletedJobs: completedJobs.length,
      totalVerifiedBadges: verifiedBadges.length,
      totalCompetencies: activeCompetencies.length,
      approvedAssessorsCount: approvedAssessors.length,
      citiesWithWorkers: workerCities.size,
      totalPakistanCitiesSupported: ALL_CITIES_FLAT.length,
      activeCategoriesCount: activeTrades.length,
      averageRating: avgRating,
      totalReviews: visibleReviews.length,
    });
  }

  if (method === 'GET' && path === '/public/leaderboard') {
    const cityFilter = (query.city || '').trim().toLowerCase();
    const nowMs = Date.now();
    const rows = db.workerProfiles
      .map((wp) => {
        const u = findRecord(db, 'users', (usr) => usr.id === wp.userId);
        if (!u || !wp.isPublic || u.status !== 'ACTIVE') return null;
        if (cityFilter && !u.city.toLowerCase().includes(cityFilter)) return null;
        const trade = wp.selectedTradeId ? findRecord(db, 'trades', (t) => t.id === wp.selectedTradeId) : undefined;
        const trust = computeTrustScoreBreakdown(db, wp.id);
        const rating = computeWorkerRatingSummary(db, wp.id);
        const activeBadges = db.badges
          .filter((b) => b.workerProfileId === wp.id && b.status === 'ACTIVE' && new Date(b.expiresAt).getTime() > nowMs)
          .map((b) => {
            const comp = findRecord(db, 'competencies', (c) => c.id === b.competencyId);
            return {
              id: b.id,
              competencyTitle: comp?.title || 'Competency',
              competencyUrduTitle: comp?.urduTitle || '',
              level: b.level,
            };
          });
        return {
          workerProfileId: wp.id,
          publicId: wp.publicId,
          passportId: ensureWorkerPassportId(wp),
          fullName: u.fullName,
          city: u.city,
          tradeName: trade?.name || 'Skill Trade',
          tradeUrduName: trade?.urduName || '',
          avatarUrl: wp.avatarUrl,
          yearsExperience: wp.yearsExperience,
          isFemaleProfessional: Boolean(wp.isFemaleProfessional),
          tier: wp.tier || 'NONE',
          tierStatus: wp.tierStatus || 'NONE',
          trustScore: trust.total,
          bayesianRating: rating.bayesianRating,
          rawRating: rating.rawAverage,
          totalReviews: rating.totalReviews,
          completedJobsCount: trust.metrics.completedJobs,
          verifiedCount: activeBadges.length,
          verifiedBadges: activeBadges,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .sort(
        (a, b) =>
          b.verifiedCount - a.verifiedCount ||
          b.trustScore - a.trustScore ||
          b.bayesianRating - a.bayesianRating ||
          b.completedJobsCount - a.completedJobsCount
      )
      .slice(0, 12);

    return ok(rows);
  }

  if (method === 'GET' && path === '/public/demand-insights') {
    const categoryGroupFilter = (query.categoryGroup || '').trim();
    const cityFilter = (query.city || '').trim();
    const periodParam = (query.period || '90d').trim().toLowerCase();
    const period: '30d' | '90d' | '6m' | 'all' =
      periodParam === '30d' || periodParam === '6m' || periodParam === 'all' ? periodParam : '90d';

    const DAY_MS = 86_400_000;
    const nowMs = Date.now();
    const cutoffMs =
      period === '30d'
        ? nowMs - 30 * DAY_MS
        : period === '90d'
          ? nowMs - 90 * DAY_MS
          : period === '6m'
            ? nowMs - 180 * DAY_MS
            : 0;

    const recentWindowMs = period === '30d' ? 15 * DAY_MS : 30 * DAY_MS;
    const recentStartMs = nowMs - recentWindowMs;
    const priorStartMs = nowMs - 2 * recentWindowMs;

    const activeTrades = db.trades.filter((t) => t.isActive);
    const tradeById = new Map(activeTrades.map((t) => [t.id, t]));
    const userById = new Map(db.users.map((u) => [u.id, u]));

    const activeWorkers = db.workerProfiles
      .map((wp) => {
        const u = userById.get(wp.userId);
        if (!u || !wp.isPublic || u.status !== 'ACTIVE') return null;
        return { wp, user: u };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    const badgeWorkerIds = new Set(
      db.badges
        .filter((b) => b.status === 'ACTIVE' && new Date(b.expiresAt).getTime() > nowMs)
        .map((b) => b.workerProfileId)
    );

    const matchesCategory = (tradeId: string | null | undefined) => {
      if (!categoryGroupFilter || categoryGroupFilter === 'ALL') return true;
      if (!tradeId) return false;
      const tr = tradeById.get(tradeId);
      return (tr?.group || '').toLowerCase() === categoryGroupFilter.toLowerCase();
    };

    const matchesCity = (cityName: string | null | undefined) => {
      if (!cityFilter || cityFilter === 'ALL') return true;
      return (cityName || '').trim().toLowerCase() === cityFilter.trim().toLowerCase();
    };

    interface DemandEvent {
      tradeId: string;
      city: string;
      timestampMs: number;
      isCompleted: boolean;
      pricePkr: number | null;
    }

    const allEvents: DemandEvent[] = [];

    for (const j of db.jobs || []) {
      const ts = new Date(j.requestedAt).getTime();
      if (!Number.isFinite(ts)) continue;
      allEvents.push({
        tradeId: j.tradeId,
        city: j.city || 'Unspecified',
        timestampMs: ts,
        isCompleted: j.status === 'COMPLETED',
        pricePkr: j.finalPkr ?? j.quotedPkr ?? null,
      });
    }

    for (const cr of db.contactRequests || []) {
      const wp = db.workerProfiles.find((w) => w.id === cr.workerProfileId);
      const wu = wp ? userById.get(wp.userId) : undefined;
      if (!wp?.selectedTradeId) continue;
      const ts = new Date(cr.createdAt).getTime();
      if (!Number.isFinite(ts)) continue;
      allEvents.push({
        tradeId: wp.selectedTradeId,
        city: wu?.city || 'Unspecified',
        timestampMs: ts,
        isCompleted: false,
        pricePkr: null,
      });
    }

    const eventsByPeriodAndCat = allEvents.filter(
      (ev) => ev.timestampMs >= cutoffMs && matchesCategory(ev.tradeId)
    );
    const filteredEvents = eventsByPeriodAndCat.filter((ev) => matchesCity(ev.city));

    // Active Karigar supply matching category + city filters
    const matchingWorkers = activeWorkers.filter(
      ({ wp, user }) => matchesCategory(wp.selectedTradeId) && matchesCity(user.city)
    );

    // 1 & 2 & 6. Per-trade demand, trend delta, and supply-opportunity calculations
    const tradeStatsMap = new Map<
      string,
      {
        tradeId: string;
        slug: string;
        name: string;
        urduName: string;
        group: string;
        urduGroup: string;
        requestsCount: number;
        completedCount: number;
        recentCount: number;
        previousCount: number;
        priceSum: number;
        priceCount: number;
        availableKarigars: number;
        verifiedKarigars: number;
      }
    >();

    for (const ev of filteredEvents) {
      const tr = tradeById.get(ev.tradeId);
      if (!tr) continue;
      let entry = tradeStatsMap.get(tr.id);
      if (!entry) {
        entry = {
          tradeId: tr.id,
          slug: tr.slug,
          name: tr.name,
          urduName: tr.urduName,
          group: tr.group || 'General Services',
          urduGroup: tr.urduGroup || 'عمومی سروسز',
          requestsCount: 0,
          completedCount: 0,
          recentCount: 0,
          previousCount: 0,
          priceSum: 0,
          priceCount: 0,
          availableKarigars: 0,
          verifiedKarigars: 0,
        };
        tradeStatsMap.set(tr.id, entry);
      }
      entry.requestsCount += 1;
      if (ev.isCompleted) entry.completedCount += 1;
      if (ev.pricePkr && ev.pricePkr > 0) {
        entry.priceSum += ev.pricePkr;
        entry.priceCount += 1;
      }
    }

    // Momentum comparison uses category + city filtered allEvents across recent vs prior window
    const cityAndCatEvents = allEvents.filter((ev) => matchesCategory(ev.tradeId) && matchesCity(ev.city));
    for (const ev of cityAndCatEvents) {
      const entry = tradeStatsMap.get(ev.tradeId);
      if (!entry) continue;
      if (ev.timestampMs >= recentStartMs) {
        entry.recentCount += 1;
      } else if (ev.timestampMs >= priorStartMs && ev.timestampMs < recentStartMs) {
        entry.previousCount += 1;
      }
    }

    // Attach real Karigar supply counts per trade (respecting city filter)
    for (const { wp } of matchingWorkers) {
      if (!wp.selectedTradeId) continue;
      const tr = tradeById.get(wp.selectedTradeId);
      if (!tr) continue;
      let entry = tradeStatsMap.get(tr.id);
      if (!entry) {
        entry = {
          tradeId: tr.id,
          slug: tr.slug,
          name: tr.name,
          urduName: tr.urduName,
          group: tr.group || 'General Services',
          urduGroup: tr.urduGroup || 'عمومی سروسز',
          requestsCount: 0,
          completedCount: 0,
          recentCount: 0,
          previousCount: 0,
          priceSum: 0,
          priceCount: 0,
          availableKarigars: 0,
          verifiedKarigars: 0,
        };
        tradeStatsMap.set(tr.id, entry);
      }
      entry.availableKarigars += 1;
      if (badgeWorkerIds.has(wp.id)) {
        entry.verifiedKarigars += 1;
      }
    }

    const tradeRows = Array.from(tradeStatsMap.values());

    // 1. Most In-Demand Skills
    const mostInDemandSkills = tradeRows
      .filter((r) => r.requestsCount > 0)
      .sort((a, b) => b.requestsCount - a.requestsCount || b.completedCount - a.completedCount)
      .slice(0, 8)
      .map((r) => ({
        tradeId: r.tradeId,
        slug: r.slug,
        name: r.name,
        urduName: r.urduName,
        group: r.group,
        requestsCount: r.requestsCount,
        completedCount: r.completedCount,
        availableKarigars: r.availableKarigars,
        avgPkr: r.priceCount > 0 ? Math.round(r.priceSum / r.priceCount) : null,
      }));

    // 2. Trending Skills (experiencing increasing demand vs previous window)
    const trendingSkills = tradeRows
      .filter((r) => r.requestsCount > 0 && r.recentCount > r.previousCount)
      .map((r) => {
        const delta = r.recentCount - r.previousCount;
        const growthPct =
          r.previousCount > 0
            ? Math.round((delta / r.previousCount) * 100)
            : r.recentCount * 100;
        return {
          tradeId: r.tradeId,
          slug: r.slug,
          name: r.name,
          urduName: r.urduName,
          group: r.group,
          recentCount: r.recentCount,
          previousCount: r.previousCount,
          delta,
          growthPct,
          totalRequests: r.requestsCount,
        };
      })
      .sort((a, b) => b.delta - a.delta || b.growthPct - a.growthPct)
      .slice(0, 6);

    // 3. Category Distribution (Doughnut chart)
    const catMap = new Map<string, { group: string; urduGroup: string; count: number }>();
    for (const ev of filteredEvents) {
      const tr = tradeById.get(ev.tradeId);
      if (!tr) continue;
      const g = tr.group || 'General Services';
      const existing = catMap.get(g) || {
        group: g,
        urduGroup: tr.urduGroup || g,
        count: 0,
      };
      existing.count += 1;
      catMap.set(g, existing);
    }
    const totalCatDemand = filteredEvents.length;
    const categoryDistribution = Array.from(catMap.values())
      .sort((a, b) => b.count - a.count)
      .map((c) => ({
        group: c.group,
        urduGroup: c.urduGroup,
        count: c.count,
        percentage: totalCatDemand > 0 ? Math.round((c.count / totalCatDemand) * 100) : 0,
      }));

    // 4. Location-Based Demand (across cities, filtered by period & categoryGroup)
    const cityStatsMap = new Map<
      string,
      {
        city: string;
        requestsCount: number;
        completedCount: number;
        availableKarigars: number;
        skillCounts: Record<string, number>;
      }
    >();

    for (const ev of eventsByPeriodAndCat) {
      const cName = ev.city || 'Unspecified';
      let cEntry = cityStatsMap.get(cName);
      if (!cEntry) {
        cEntry = {
          city: cName,
          requestsCount: 0,
          completedCount: 0,
          availableKarigars: 0,
          skillCounts: {},
        };
        cityStatsMap.set(cName, cEntry);
      }
      cEntry.requestsCount += 1;
      if (ev.isCompleted) cEntry.completedCount += 1;
      const tr = tradeById.get(ev.tradeId);
      if (tr) {
        cEntry.skillCounts[tr.name] = (cEntry.skillCounts[tr.name] || 0) + 1;
      }
    }

    for (const { wp, user } of activeWorkers) {
      if (!matchesCategory(wp.selectedTradeId)) continue;
      const cName = user.city || 'Unspecified';
      let cEntry = cityStatsMap.get(cName);
      if (!cEntry) {
        cEntry = {
          city: cName,
          requestsCount: 0,
          completedCount: 0,
          availableKarigars: 0,
          skillCounts: {},
        };
        cityStatsMap.set(cName, cEntry);
      }
      cEntry.availableKarigars += 1;
    }

    const locationDemand = Array.from(cityStatsMap.values())
      .filter((c) => c.requestsCount > 0 || c.availableKarigars > 0)
      .map((c) => {
        const topSkillEntry = Object.entries(c.skillCounts).sort((a, b) => b[1] - a[1])[0];
        return {
          city: c.city,
          requestsCount: c.requestsCount,
          completedCount: c.completedCount,
          availableKarigars: c.availableKarigars,
          topSkill: topSkillEntry ? topSkillEntry[0] : null,
          isSelectedCity: Boolean(cityFilter && cityFilter !== 'ALL' && c.city.toLowerCase() === cityFilter.toLowerCase()),
        };
      })
      .sort((a, b) => b.requestsCount - a.requestsCount || b.availableKarigars - a.availableKarigars)
      .slice(0, 8);

    // 5. Monthly Demand Trends (time-series line chart)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const urduMonths = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];
    const nowDate = new Date();
    const bucketCount = period === '30d' ? 4 : period === '90d' ? 4 : 6;

    const monthlyTrends: Array<{
      key: string;
      label: string;
      urduLabel: string;
      requestsCount: number;
      completedCount: number;
    }> = [];

    if (period === '30d') {
      // 4 weekly buckets over the last 30 days so short-window trends have crisp resolution
      for (let w = bucketCount - 1; w >= 0; w--) {
        const endMs = nowMs - w * 7 * DAY_MS;
        const startMs = endMs - 7 * DAY_MS;
        const inWeek = filteredEvents.filter((ev) => ev.timestampMs > startMs && ev.timestampMs <= endMs);
        const weekLabel = w === 0 ? 'This wk' : `${w}w ago`;
        const urduWeekLabel = w === 0 ? 'اس ہفتے' : `${w} ہفتے قبل`;
        monthlyTrends.push({
          key: `w-${w}`,
          label: weekLabel,
          urduLabel: urduWeekLabel,
          requestsCount: inWeek.length,
          completedCount: inWeek.filter((e) => e.isCompleted).length,
        });
      }
    } else {
      for (let m = bucketCount - 1; m >= 0; m--) {
        const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - m, 1);
        const ymKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const inMonth = filteredEvents.filter((ev) => {
          const ed = new Date(ev.timestampMs);
          return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
        });
        monthlyTrends.push({
          key: ymKey,
          label: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
          urduLabel: urduMonths[d.getMonth()],
          requestsCount: inMonth.length,
          completedCount: inMonth.filter((e) => e.isCompleted).length,
        });
      }
    }

    // 6. Skill Opportunities (high demand relative to available Karigars)
    const skillOpportunities = tradeRows
      .filter((r) => r.requestsCount > 0)
      .map((r) => {
        const demandPerKarigar =
          r.availableKarigars > 0
            ? Number((r.requestsCount / r.availableKarigars).toFixed(1))
            : r.requestsCount;
        const status: 'HIGH_OPPORTUNITY' | 'GROWING_NEED' | 'BALANCED' =
          r.availableKarigars === 0 || demandPerKarigar >= 3
            ? 'HIGH_OPPORTUNITY'
            : demandPerKarigar >= 1.5
              ? 'GROWING_NEED'
              : 'BALANCED';
        return {
          tradeId: r.tradeId,
          slug: r.slug,
          name: r.name,
          urduName: r.urduName,
          group: r.group,
          requestsCount: r.requestsCount,
          availableKarigars: r.availableKarigars,
          verifiedKarigars: r.verifiedKarigars,
          demandPerKarigar,
          status,
        };
      })
      .sort((a, b) => b.demandPerKarigar - a.demandPerKarigar || b.requestsCount - a.requestsCount)
      .slice(0, 6);

    // Filter dropdown options strictly sourced from database records
    const availableCities = Array.from(
      new Set([
        ...allEvents.map((e) => e.city).filter((c) => c && c !== 'Unspecified'),
        ...activeWorkers.map(({ user }) => user.city).filter(Boolean),
      ])
    ).sort();

    const availableCategories = Array.from(
      new Set(activeTrades.map((t) => t.group).filter((g): g is string => Boolean(g)))
    );

    const topSkill = mostInDemandSkills[0] || null;
    const topOpportunity = skillOpportunities[0] || null;

    return ok({
      filters: {
        categoryGroup: categoryGroupFilter || 'ALL',
        city: cityFilter || 'ALL',
        period,
      },
      summary: {
        totalDemandRequests: filteredEvents.length,
        completedBookings: filteredEvents.filter((e) => e.isCompleted).length,
        activeKarigarsMatching: matchingWorkers.length,
        uniqueCitiesWithDemand: new Set(filteredEvents.map((e) => e.city).filter(Boolean)).size,
        topInDemandSkill: topSkill
          ? { name: topSkill.name, urduName: topSkill.urduName, count: topSkill.requestsCount }
          : null,
        topOpportunitySkill: topOpportunity
          ? {
              name: topOpportunity.name,
              urduName: topOpportunity.urduName,
              ratio: topOpportunity.demandPerKarigar,
              status: topOpportunity.status,
            }
          : null,
      },
      mostInDemandSkills,
      trendingSkills,
      categoryDistribution,
      locationDemand,
      monthlyTrends,
      skillOpportunities,
      filterOptions: {
        cities: availableCities,
        categories: availableCategories,
      },
    });
  }

  if (method === 'GET' && path.startsWith('/public/verify/')) {
    const rawCode = decodeURIComponent(path.slice('/public/verify/'.length)).trim();
    const codeLower = rawCode.toLowerCase();
    if (!codeLower) fail(400, 'Enter a Badge ID, Passport ID, or Worker handle.');

    const nowMs = Date.now();
    // 1. Check Badge ID
    const badge = db.badges.find((b) => b.id.toLowerCase() === codeLower);
    if (badge) {
      const wp = findRecord(db, 'workerProfiles', (w) => w.id === badge.workerProfileId);
      const wu = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
      const comp = findRecord(db, 'competencies', (c) => c.id === badge.competencyId);
      const trade = findRecord(db, 'trades', (t) => t.id === badge.tradeId);
      const ap = findRecord(db, 'assessorProfiles', (a) => a.id === badge.assessorProfileId);
      const asrUser = ap ? findRecord(db, 'users', (u) => u.id === ap.userId) : undefined;
      const isExpired = badge.status === 'EXPIRED' || new Date(badge.expiresAt).getTime() <= nowMs;
      const effectiveStatus = badge.status === 'REVOKED' ? 'REVOKED' : isExpired ? 'EXPIRED' : 'VALID';

      return ok({
        lookupType: 'BADGE',
        code: badge.id,
        status: effectiveStatus,
        workerName: wu?.fullName || 'Worker',
        workerPublicId: wp?.publicId || '',
        passportId: wp ? ensureWorkerPassportId(wp) : '',
        workerCity: wu?.city || '',
        tradeName: trade?.name || '',
        tradeUrduName: trade?.urduName || '',
        competencyTitle: comp?.title || 'Competency',
        competencyUrduTitle: comp?.urduTitle || '',
        level: badge.level,
        assessorName: asrUser?.fullName || 'Authorized Assessor',
        issuedAt: badge.issuedAt,
        expiresAt: badge.expiresAt,
        tier: wp?.tier || 'NONE',
        trustScore: wp ? computeTrustScoreBreakdown(db, wp.id).total : 0,
      });
    }

    // 2. Check Passport ID or publicId
    const wp = db.workerProfiles.find(
      (w) =>
        ensureWorkerPassportId(w).toLowerCase() === codeLower ||
        w.publicId.toLowerCase() === codeLower
    );
    if (!wp) {
      fail(404, 'No matching Competency Badge or Karigar Passport found.');
    }
    const wu = findRecord(db, 'users', (u) => u.id === wp.userId);
    if (!wu || wu.status !== 'ACTIVE') {
      return ok({
        lookupType: 'PASSPORT',
        code: ensureWorkerPassportId(wp),
        status: 'REVOKED',
        workerName: wu?.fullName || 'Suspended Account',
        workerPublicId: wp.publicId,
        passportId: ensureWorkerPassportId(wp),
        workerCity: wu?.city || '',
        tradeName: '',
        badges: [],
      });
    }

    const trade = wp.selectedTradeId ? findRecord(db, 'trades', (t) => t.id === wp.selectedTradeId) : undefined;
    const workerBadges = db.badges
      .filter((b) => b.workerProfileId === wp.id)
      .map((b) => {
        const comp = findRecord(db, 'competencies', (c) => c.id === b.competencyId);
        const ap = findRecord(db, 'assessorProfiles', (a) => a.id === b.assessorProfileId);
        const asrUser = ap ? findRecord(db, 'users', (u) => u.id === ap.userId) : undefined;
        const expired = b.status === 'EXPIRED' || new Date(b.expiresAt).getTime() <= nowMs;
        return {
          id: b.id,
          competencyTitle: comp?.title || 'Competency',
          level: b.level,
          assessorName: asrUser?.fullName || 'Authorized Assessor',
          issuedAt: b.issuedAt,
          expiresAt: b.expiresAt,
          status: b.status === 'REVOKED' ? 'REVOKED' : expired ? 'EXPIRED' : 'VALID',
        };
      });
    const trust = computeTrustScoreBreakdown(db, wp.id);
    const rating = computeWorkerRatingSummary(db, wp.id);

    return ok({
      lookupType: 'PASSPORT',
      code: ensureWorkerPassportId(wp),
      status: wp.tierStatus === 'EXPIRED' ? 'EXPIRED' : 'VALID',
      workerName: wu.fullName,
      workerPublicId: wp.publicId,
      passportId: ensureWorkerPassportId(wp),
      workerCity: wu.city,
      tradeName: trade?.name || '',
      tradeUrduName: trade?.urduName || '',
      tier: wp.tier || 'NONE',
      tierStatus: wp.tierStatus || 'NONE',
      trustScore: trust.total,
      bayesianRating: rating.bayesianRating,
      totalReviews: rating.totalReviews,
      completedJobsCount: trust.metrics.completedJobs,
      badges: workerBadges,
    });
  }

  // ==================== JOB LIFECYCLE ROUTES ====================
  if (method === 'POST' && path === '/jobs') {
    const user = requireAuthUser('EMPLOYER');
    const emp = findRecord(db, 'employerProfiles', (e) => e.userId === user.id);
    if (!emp) fail(404, 'Customer profile not found.');

    let workerProfileId = '';
    let tradeId = '';
    let title = '';
    let description = '';
    let city = '';
    let area = '';
    let preferredDate = '';
    let preferredTimeSlot = '';
    let problemPhotos: JobPhotoRef[] = [];

    if (body instanceof FormData) {
      workerProfileId = String(body.get('workerProfileId') || '').trim();
      tradeId = String(body.get('tradeId') || '').trim();
      title = String(body.get('title') || '').trim();
      description = String(body.get('description') || '').trim();
      city = String(body.get('city') || '').trim();
      area = String(body.get('area') || '').trim();
      preferredDate = String(body.get('preferredDate') || '').trim();
      preferredTimeSlot = String(body.get('preferredTimeSlot') || '').trim();
      try {
        problemPhotos = await extractUploadedPhotos(body, 'photos', 'jprob');
      } catch (err: any) {
        fail(400, err?.message || 'Invalid problem photo upload.');
      }
    } else {
      workerProfileId = String(body?.workerProfileId || '').trim();
      tradeId = String(body?.tradeId || '').trim();
      title = String(body?.title || '').trim();
      description = String(body?.description || '').trim();
      city = String(body?.city || '').trim();
      area = String(body?.area || '').trim();
      preferredDate = String(body?.preferredDate || '').trim();
      preferredTimeSlot = String(body?.preferredTimeSlot || '').trim();
    }

    const wp = findRecord(db, 'workerProfiles', (w) => w.id === workerProfileId);
    const wu = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
    if (!wp || !wu || !wp.isPublic || wu.status !== 'ACTIVE') {
      fail(404, 'Selected worker is unavailable.');
    }

    const effectiveTradeId = tradeId || wp.selectedTradeId || '';
    const trade = findRecord(db, 'trades', (t) => t.id === effectiveTradeId);
    if (!trade) fail(400, 'Select a valid service category.');
    if (title.length < 3 || description.length < 10) {
      fail(400, 'Provide a clear job title and problem description (10+ characters).');
    }
    if (city.length < 2 || area.length < 2) {
      fail(400, 'City and neighbourhood/area are required.');
    }

    const now = new Date().toISOString();
    const id = newId('job');
    insertRecord(db, 'jobs', {
      id,
      customerUserId: user.id,
      employerProfileId: emp.id,
      workerProfileId: wp.id,
      tradeId: trade.id,
      title,
      description,
      city,
      area,
      preferredDate: preferredDate || now.slice(0, 10),
      preferredTimeSlot: preferredTimeSlot || 'Flexible',
      scheduledDateTime: null,
      problemPhotos,
      beforePhotos: [],
      afterPhotos: [],
      quotedPkr: null,
      finalPkr: null,
      priceStatus: 'NO_GUIDE',
      workerNotes: '',
      completionNotes: '',
      customerConfirmedProof: false,
      customerConfirmedAt: null,
      status: 'REQUESTED',
      cancelledByRole: null,
      cancelReason: '',
      requestedAt: now,
      acceptedAt: null,
      startedAt: null,
      completedAt: null,
      updatedAt: now,
    });

    appendNotification(db, {
      userId: wu.id,
      type: 'JOB_REQUESTED',
      title: `New Job Request: ${title}`,
      message: `${user.fullName} requested ${trade.name} in ${area}, ${city}. Review details & submit your quote.`,
      link: '/worker/jobs',
    });

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'JOB_REQUESTED',
      entityType: 'Job',
      entityId: id,
      description: `${user.fullName} requested job "${title}" with ${wu.fullName}.`,
    });
    writeDb(db);
    return ok({ id }, 'Job request sent! Phone and email stay private until the worker accepts.');
  }

  if (method === 'GET' && path === '/jobs/mine') {
    const user = requireAuthUser('WORKER', 'EMPLOYER');
    const wpOwn = user.role === 'WORKER' ? findRecord(db, 'workerProfiles', (w) => w.userId === user.id) : undefined;
    const filtered = (db.jobs || [])
      .filter((j) => (user.role === 'WORKER' ? j.workerProfileId === wpOwn?.id : j.customerUserId === user.id))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const rows = await Promise.all(
      filtered.map(async (j) => {
        const wp = findRecord(db, 'workerProfiles', (w) => w.id === j.workerProfileId);
        const wu = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
        const cu = findRecord(db, 'users', (u) => u.id === j.customerUserId);
        const ep = findRecord(db, 'employerProfiles', (e) => e.id === j.employerProfileId);
        const trade = findRecord(db, 'trades', (t) => t.id === j.tradeId);
        const review = (db.reviews || []).find((r) => r.jobId === j.id);
        const dispute = (db.disputes || []).find((d) => d.jobId === j.id);
        const priceGuide = trade?.priceGuide?.length
          ? trade.priceGuide
          : getServiceBySlugOrId(trade?.slug || j.tradeId)?.defaultPriceGuide || [];

        const contactUnlocked =
          j.status === 'ACCEPTED' ||
          j.status === 'SCHEDULED' ||
          j.status === 'IN_PROGRESS' ||
          j.status === 'COMPLETED' ||
          j.status === 'DISPUTED';

        const within7Days =
          j.status === 'COMPLETED' &&
          j.completedAt &&
          Date.now() - new Date(j.completedAt).getTime() <= 7 * 86400000;

        return {
          ...j,
          tradeName: trade?.name || 'Service',
          tradeUrduName: trade?.urduName || '',
          priceGuide,
          workerName: wu?.fullName || 'Karigar',
          workerPublicId: wp?.publicId || '',
          workerAvatarUrl: wp?.avatarUrl || '',
          workerTier: wp?.tier || 'NONE',
          customerName: cu?.fullName || 'Customer',
          customerCompanyName: ep?.companyName || '',
          contactUnlocked,
          workerContact: contactUnlocked && wu ? { phone: wu.phone, email: wu.email } : null,
          customerContact: contactUnlocked && cu ? { phone: cu.phone, email: cu.email } : null,
          problemPhotos: await resolvePhotoRefs(j.problemPhotos),
          beforePhotos: await resolvePhotoRefs(j.beforePhotos),
          afterPhotos: await resolvePhotoRefs(j.afterPhotos),
          review: review
            ? {
                ...review,
                canEdit: Date.now() <= new Date(review.editableUntil).getTime(),
              }
            : null,
          dispute: dispute || null,
          canOpenGuaranteeDispute: Boolean(within7Days && !dispute && user.role === 'EMPLOYER'),
        };
      })
    );

    return ok(rows);
  }

  if (method === 'PATCH' && path.startsWith('/jobs/') && path.endsWith('/accept')) {
    const user = requireAuthUser('WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    const jobId = path.slice('/jobs/'.length, -'/accept'.length);
    const job = findRecord(db, 'jobs', (j) => j.id === jobId && j.workerProfileId === wp?.id);
    if (!job) fail(404, 'Job request not found.');
    if (job.status !== 'REQUESTED') fail(400, 'Only requested jobs can be accepted.');

    const quotedPkr = Number(body?.quotedPkr || 0);
    if (!Number.isFinite(quotedPkr) || quotedPkr < 100) {
      fail(400, 'Enter a fair estimated quote in PKR (minimum 100 PKR).');
    }
    const scheduledDateTime = String(body?.scheduledDateTime || '').trim() || null;
    const workerNotes = String(body?.workerNotes || '').trim().slice(0, 600);
    const now = new Date().toISOString();

    job.quotedPkr = Math.round(quotedPkr);
    job.priceStatus = computePriceStatus(db, job.tradeId, job.quotedPkr);
    job.workerNotes = workerNotes;
    job.acceptedAt = now;
    if (scheduledDateTime) {
      job.scheduledDateTime = scheduledDateTime;
      job.status = 'SCHEDULED';
    } else {
      job.status = 'ACCEPTED';
    }
    job.updatedAt = now;

    appendNotification(db, {
      userId: job.customerUserId,
      type: 'JOB_ACCEPTED',
      title: `Job Accepted: ${job.title}`,
      message: `${user.fullName} accepted your job with a quote of PKR ${job.quotedPkr.toLocaleString()}. Contact details are now unlocked.`,
      link: '/employer/jobs',
    });

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'JOB_ACCEPTED',
      entityType: 'Job',
      entityId: job.id,
      description: `${user.fullName} accepted "${job.title}" with PKR ${job.quotedPkr}.`,
    });
    writeDb(db);
    return ok({ status: job.status, priceStatus: job.priceStatus }, 'Job accepted and customer notified.');
  }

  if (method === 'PATCH' && path.startsWith('/jobs/') && path.endsWith('/schedule')) {
    const user = requireAuthUser('WORKER', 'EMPLOYER');
    const wp = user.role === 'WORKER' ? findRecord(db, 'workerProfiles', (w) => w.userId === user.id) : undefined;
    const jobId = path.slice('/jobs/'.length, -'/schedule'.length);
    const job = findRecord(
      db,
      'jobs',
      (j) => j.id === jobId && (user.role === 'WORKER' ? j.workerProfileId === wp?.id : j.customerUserId === user.id)
    );
    if (!job) fail(404, 'Job not found.');
    if (!['ACCEPTED', 'SCHEDULED'].includes(job.status)) {
      fail(400, 'Job can only be scheduled after acceptance.');
    }

    const scheduledDateTime = String(body?.scheduledDateTime || '').trim();
    if (!scheduledDateTime) fail(400, 'Provide a scheduled date and time.');

    job.scheduledDateTime = scheduledDateTime;
    job.status = 'SCHEDULED';
    job.updatedAt = new Date().toISOString();

    const targetUserId =
      user.role === 'WORKER'
        ? job.customerUserId
        : findRecord(db, 'workerProfiles', (w) => w.id === job.workerProfileId)?.userId;
    if (targetUserId) {
      appendNotification(db, {
        userId: targetUserId,
        type: 'JOB_SCHEDULED',
        title: `Job Scheduled: ${job.title}`,
        message: `Visit scheduled for ${scheduledDateTime}.`,
        link: user.role === 'WORKER' ? '/employer/jobs' : '/worker/jobs',
      });
    }
    writeDb(db);
    return ok(undefined, 'Job visit scheduled.');
  }

  if (method === 'PATCH' && path.startsWith('/jobs/') && path.endsWith('/start')) {
    const user = requireAuthUser('WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    const jobId = path.slice('/jobs/'.length, -'/start'.length);
    const job = findRecord(db, 'jobs', (j) => j.id === jobId && j.workerProfileId === wp?.id);
    if (!job) fail(404, 'Job not found.');
    if (!['ACCEPTED', 'SCHEDULED'].includes(job.status)) {
      fail(400, 'Job must be accepted or scheduled before starting.');
    }

    const now = new Date().toISOString();
    job.status = 'IN_PROGRESS';
    job.startedAt = now;
    job.updatedAt = now;

    appendNotification(db, {
      userId: job.customerUserId,
      type: 'JOB_STARTED',
      title: `Work Started: ${job.title}`,
      message: `${user.fullName} marked the job as In Progress.`,
      link: '/employer/jobs',
    });
    writeDb(db);
    return ok(undefined, 'Job marked as In Progress.');
  }

  if (method === 'POST' && path.startsWith('/jobs/') && path.endsWith('/complete')) {
    const user = requireAuthUser('WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    const jobId = path.slice('/jobs/'.length, -'/complete'.length);
    const job = findRecord(db, 'jobs', (j) => j.id === jobId && j.workerProfileId === wp?.id);
    if (!job || !wp) fail(404, 'Job not found.');
    if (!['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'].includes(job.status)) {
      fail(400, 'Only active jobs can be completed.');
    }

    let finalPkr = job.quotedPkr || 0;
    let completionNotes = '';
    let beforePhotos: JobPhotoRef[] = [...job.beforePhotos];
    let afterPhotos: JobPhotoRef[] = [...job.afterPhotos];

    if (body instanceof FormData) {
      finalPkr = Number(body.get('finalPkr') || job.quotedPkr || 0);
      completionNotes = String(body.get('completionNotes') || '').trim().slice(0, 600);
      try {
        const addedBefore = await extractUploadedPhotos(body, 'beforePhotos', 'jbef');
        const addedAfter = await extractUploadedPhotos(body, 'afterPhotos', 'jaft');
        beforePhotos = [...beforePhotos, ...addedBefore];
        afterPhotos = [...afterPhotos, ...addedAfter];
      } catch (err: any) {
        fail(400, err?.message || 'Invalid work proof photo upload.');
      }
    } else {
      finalPkr = Number(body?.finalPkr || job.quotedPkr || 0);
      completionNotes = String(body?.completionNotes || '').trim().slice(0, 600);
    }

    if (!Number.isFinite(finalPkr) || finalPkr < 100) {
      fail(400, 'Enter the final agreed amount in PKR.');
    }

    const now = new Date().toISOString();
    job.beforePhotos = beforePhotos;
    job.afterPhotos = afterPhotos;
    job.finalPkr = Math.round(finalPkr);
    job.priceStatus = computePriceStatus(db, job.tradeId, job.finalPkr);
    job.completionNotes = completionNotes || 'Work completed cleanly and verified with customer.';
    job.status = 'COMPLETED';
    job.completedAt = now;
    job.updatedAt = now;

    // Auto-record Worker Growth Hub earnings log if not already logged
    db.earningsLogs = db.earningsLogs || [];
    if (!db.earningsLogs.some((e) => e.jobId === job.id)) {
      insertRecord(db, 'earningsLogs', {
        id: newId('earn'),
        workerProfileId: wp.id,
        jobId: job.id,
        title: job.title,
        amountPkr: job.finalPkr,
        date: now.slice(0, 10),
        notes: `${job.area}, ${job.city}`,
        createdAt: now,
      });
    }

    checkAndQueueEligibleTierApplication(db, wp.id);

    appendNotification(db, {
      userId: job.customerUserId,
      type: 'JOB_COMPLETED',
      title: `Job Completed — Confirm & Rate ${user.fullName}`,
      message: `Please confirm work completion/photos and rate ${user.fullName} to help others hire proven talent.`,
      link: '/employer/jobs',
    });

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'JOB_COMPLETED',
      entityType: 'Job',
      entityId: job.id,
      description: `${user.fullName} completed job "${job.title}" (PKR ${job.finalPkr}).`,
    });
    writeDb(db);
    return ok(undefined, 'Job completed! Customer has been notified to confirm proof and rate your work.');
  }

  if (method === 'PATCH' && path.startsWith('/jobs/') && path.endsWith('/confirm')) {
    const user = requireAuthUser('EMPLOYER');
    const jobId = path.slice('/jobs/'.length, -'/confirm'.length);
    const job = findRecord(db, 'jobs', (j) => j.id === jobId && j.customerUserId === user.id);
    if (!job) fail(404, 'Job not found.');
    if (job.status !== 'COMPLETED') fail(400, 'Job must be completed first.');

    const now = new Date().toISOString();
    job.customerConfirmedProof = true;
    job.customerConfirmedAt = now;
    job.updatedAt = now;

    const wp = findRecord(db, 'workerProfiles', (w) => w.id === job.workerProfileId);
    if (wp) {
      appendNotification(db, {
        userId: wp.userId,
        type: 'PROOF_CONFIRMED',
        title: `Work Proof Confirmed: ${job.title}`,
        message: `${user.fullName} confirmed your completion and work photos on your Verified Work Proof gallery.`,
        link: `/workers/${wp.publicId}`,
      });
    }

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'JOB_PROOF_CONFIRMED',
      entityType: 'Job',
      entityId: job.id,
      description: `${user.fullName} confirmed completion proof for job ${job.id}.`,
    });
    writeDb(db);
    return ok(undefined, 'Work completion and proof confirmed.');
  }

  if (method === 'PATCH' && path.startsWith('/jobs/') && path.endsWith('/cancel')) {
    const user = requireAuthUser('WORKER', 'EMPLOYER');
    const wp = user.role === 'WORKER' ? findRecord(db, 'workerProfiles', (w) => w.userId === user.id) : undefined;
    const jobId = path.slice('/jobs/'.length, -'/cancel'.length);
    const job = findRecord(
      db,
      'jobs',
      (j) => j.id === jobId && (user.role === 'WORKER' ? j.workerProfileId === wp?.id : j.customerUserId === user.id)
    );
    if (!job) fail(404, 'Job not found.');
    if (!['REQUESTED', 'ACCEPTED', 'SCHEDULED'].includes(job.status)) {
      fail(400, 'Completed or in-progress jobs cannot be cancelled directly.');
    }

    const reason = String(body?.reason || '').trim().slice(0, 400);
    job.status = 'CANCELLED';
    job.cancelledByRole = user.role;
    job.cancelReason = reason || 'Cancelled by user';
    job.updatedAt = new Date().toISOString();

    const notifyTarget =
      user.role === 'WORKER'
        ? job.customerUserId
        : findRecord(db, 'workerProfiles', (w) => w.id === job.workerProfileId)?.userId;
    if (notifyTarget) {
      appendNotification(db, {
        userId: notifyTarget,
        type: 'JOB_CANCELLED',
        title: `Job Cancelled: ${job.title}`,
        message: `${user.fullName} cancelled this job${reason ? `: ${reason}` : '.'}`,
        link: user.role === 'WORKER' ? '/employer/jobs' : '/worker/jobs',
      });
    }
    writeDb(db);
    return ok(undefined, 'Job cancelled.');
  }

  if (method === 'POST' && path.startsWith('/jobs/') && path.endsWith('/sos')) {
    const user = requireAuthUser('WORKER', 'EMPLOYER');
    const jobId = path.slice('/jobs/'.length, -'/sos'.length);
    const wp = user.role === 'WORKER' ? findRecord(db, 'workerProfiles', (w) => w.userId === user.id) : undefined;
    const job = findRecord(
      db,
      'jobs',
      (j) => j.id === jobId && (user.role === 'WORKER' ? j.workerProfileId === wp?.id : j.customerUserId === user.id)
    );
    if (!job) fail(404, 'Job not found.');

    const details = String(body?.details || '').trim();
    if (details.length < 5) fail(400, 'Describe the urgent issue or safety concern (5+ characters).');

    const now = new Date().toISOString();
    const id = newId('sos');
    insertRecord(db, 'reports', {
      id,
      reporterUserId: user.id,
      targetType: 'JOB_SOS',
      targetId: job.id,
      reason: 'URGENT SAFETY / SOS ALERT',
      details: `[Job: ${job.title} | ${job.area}, ${job.city}] ${details}`,
      status: 'OPEN',
      adminNotes: '',
      resolvedByUserId: null,
      createdAt: now,
      resolvedAt: null,
      updatedAt: now,
    });

    for (const adm of db.users.filter((u) => u.role === 'ADMIN' && u.status === 'ACTIVE')) {
      appendNotification(db, {
        userId: adm.id,
        type: 'JOB_SOS_ALERT',
        title: `URGENT SOS Alert: ${job.title}`,
        message: `${user.fullName} triggered an urgent safety report in ${job.city}: ${details}`,
        link: '/admin/reports',
      });
    }

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'JOB_SOS_REPORTED',
      entityType: 'Report',
      entityId: id,
      description: `Urgent SOS safety report triggered on job ${job.id} by ${user.fullName}.`,
    });
    writeDb(db);
    return ok({ id }, 'Urgent safety alert sent to platform administrators.');
  }

  // ==================== RATING & REVIEW ROUTES ====================
  if (method === 'POST' && path === '/reviews') {
    const user = requireAuthUser('EMPLOYER');

    let jobId = '';
    let overallRating = 0;
    let qualityRating = 0;
    let punctualityRating = 0;
    let behaviourRating = 0;
    let valueRating = 0;
    let tags: string[] = [];
    let comment = '';
    let photos: JobPhotoRef[] = [];

    if (body instanceof FormData) {
      jobId = String(body.get('jobId') || '').trim();
      overallRating = Number(body.get('overallRating') || 0);
      qualityRating = Number(body.get('qualityRating') || overallRating);
      punctualityRating = Number(body.get('punctualityRating') || overallRating);
      behaviourRating = Number(body.get('behaviourRating') || overallRating);
      valueRating = Number(body.get('valueRating') || overallRating);
      const rawTags = String(body.get('tags') || '[]');
      try {
        tags = JSON.parse(rawTags);
      } catch {
        tags = [];
      }
      comment = String(body.get('comment') || '').trim().slice(0, 1000);
      try {
        photos = await extractUploadedPhotos(body, 'photos', 'rpho');
      } catch (err: any) {
        fail(400, err?.message || 'Invalid review photo upload.');
      }
    } else {
      jobId = String(body?.jobId || '').trim();
      overallRating = Number(body?.overallRating || 0);
      qualityRating = Number(body?.qualityRating || overallRating);
      punctualityRating = Number(body?.punctualityRating || overallRating);
      behaviourRating = Number(body?.behaviourRating || overallRating);
      valueRating = Number(body?.valueRating || overallRating);
      tags = Array.isArray(body?.tags) ? body.tags.map((t: any) => String(t)) : [];
      comment = String(body?.comment || '').trim().slice(0, 1000);
    }

    const job = findRecord(db, 'jobs', (j) => j.id === jobId && j.customerUserId === user.id);
    if (!job) fail(404, 'Completed job not found for your account.');
    if (job.status !== 'COMPLETED' && job.status !== 'DISPUTED') {
      fail(400, 'You can only rate a worker after the job is completed.');
    }
    if ((db.reviews || []).some((r) => r.jobId === job.id)) {
      fail(409, 'You have already submitted a review for this job.');
    }
    if (overallRating < 1 || overallRating > 5) {
      fail(400, 'Select an overall rating between 1 and 5 stars.');
    }

    const now = new Date().toISOString();
    const editableUntil = new Date(Date.now() + 48 * 3600000).toISOString();
    const id = newId('rev');

    insertRecord(db, 'reviews', {
      id,
      jobId: job.id,
      customerUserId: user.id,
      workerProfileId: job.workerProfileId,
      tradeId: job.tradeId,
      overallRating,
      qualityRating: Math.max(1, Math.min(5, qualityRating)),
      punctualityRating: Math.max(1, Math.min(5, punctualityRating)),
      behaviourRating: Math.max(1, Math.min(5, behaviourRating)),
      valueRating: Math.max(1, Math.min(5, valueRating)),
      tags: tags.slice(0, 6),
      comment,
      photos,
      workerReply: '',
      workerRepliedAt: null,
      isHiddenByAdmin: false,
      hiddenReason: '',
      editableUntil,
      createdAt: now,
      updatedAt: now,
    });

    // Also mark customerConfirmedProof if not yet confirmed
    if (!job.customerConfirmedProof) {
      job.customerConfirmedProof = true;
      job.customerConfirmedAt = now;
    }

    checkAndQueueEligibleTierApplication(db, job.workerProfileId);

    const wp = findRecord(db, 'workerProfiles', (w) => w.id === job.workerProfileId);
    if (wp) {
      appendNotification(db, {
        userId: wp.userId,
        type: 'REVIEW_RECEIVED',
        title: `New ${overallRating}★ Verified Review`,
        message: `${user.fullName} rated your work on "${job.title}". You can post one public reply from your dashboard.`,
        link: '/worker/dashboard',
      });
    }

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'REVIEW_SUBMITTED',
      entityType: 'Review',
      entityId: id,
      description: `${user.fullName} left a ${overallRating}★ verified review on job ${job.id}.`,
    });
    writeDb(db);
    return ok({ id }, 'Verified review published! Thank you for helping customers choose proven workers.');
  }

  if (method === 'PUT' && path.startsWith('/reviews/') && !path.endsWith('/reply')) {
    const user = requireAuthUser('EMPLOYER');
    const reviewId = path.slice('/reviews/'.length);
    const review = findRecord(db, 'reviews', (r) => r.id === reviewId && r.customerUserId === user.id);
    if (!review) fail(404, 'Review not found.');
    if (Date.now() > new Date(review.editableUntil).getTime()) {
      fail(403, 'The 48-hour edit window for this review has closed.');
    }

    const overallRating = Number(body?.overallRating || review.overallRating);
    if (overallRating < 1 || overallRating > 5) fail(400, 'Rating must be between 1 and 5.');

    review.overallRating = overallRating;
    review.qualityRating = Number(body?.qualityRating || review.qualityRating);
    review.punctualityRating = Number(body?.punctualityRating || review.punctualityRating);
    review.behaviourRating = Number(body?.behaviourRating || review.behaviourRating);
    review.valueRating = Number(body?.valueRating || review.valueRating);
    if (Array.isArray(body?.tags)) review.tags = body.tags.map((t: any) => String(t)).slice(0, 6);
    if (typeof body?.comment === 'string') review.comment = body.comment.trim().slice(0, 1000);
    review.updatedAt = new Date().toISOString();

    writeDb(db);
    return ok(undefined, 'Review updated within 48-hour window.');
  }

  if (method === 'POST' && path.startsWith('/reviews/') && path.endsWith('/reply')) {
    const user = requireAuthUser('WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    const reviewId = path.slice('/reviews/'.length, -'/reply'.length);
    const review = findRecord(db, 'reviews', (r) => r.id === reviewId && r.workerProfileId === wp?.id);
    if (!review) fail(404, 'Review not found.');
    if (review.workerReply) fail(409, 'You have already posted a public reply to this review.');

    const reply = String(body?.reply || '').trim();
    if (reply.length < 3) fail(400, 'Reply must be at least 3 characters.');

    const now = new Date().toISOString();
    review.workerReply = reply.slice(0, 500);
    review.workerRepliedAt = now;
    review.updatedAt = now;

    appendNotification(db, {
      userId: review.customerUserId,
      type: 'REVIEW_REPLIED',
      title: `${user.fullName} replied to your review`,
      message: review.workerReply,
      link: `/workers/${wp?.publicId || ''}`,
    });
    writeDb(db);
    return ok(undefined, 'Public reply posted.');
  }

  if (method === 'PATCH' && path.startsWith('/admin/reviews/') && path.endsWith('/visibility')) {
    const admin = requireAuthUser('ADMIN');
    const reviewId = path.slice('/admin/reviews/'.length, -'/visibility'.length);
    const review = findRecord(db, 'reviews', (r) => r.id === reviewId);
    if (!review) fail(404, 'Review not found.');

    const hide = Boolean(body?.hide);
    const reason = String(body?.reason || '').trim();
    if (hide && reason.length < 3) fail(400, 'Provide a moderation reason to hide a review.');

    review.isHiddenByAdmin = hide;
    review.hiddenReason = hide ? reason : '';
    review.updatedAt = new Date().toISOString();

    appendAuditLog(db, {
      actorUserId: admin.id,
      action: hide ? 'REVIEW_HIDDEN' : 'REVIEW_RESTORED',
      entityType: 'Review',
      entityId: review.id,
      description: `Admin ${hide ? 'hid' : 'restored'} review ${review.id}${reason ? `: ${reason}` : ''}`,
    });
    writeDb(db);
    return ok(undefined, hide ? 'Review hidden from public portfolio.' : 'Review restored.');
  }

  // ==================== KARIGAR GUARANTEE 7-DAY DISPUTES ====================
  if (method === 'POST' && path === '/disputes') {
    const user = requireAuthUser('EMPLOYER');
    const jobId = String(body?.jobId || '').trim();
    const reason = String(body?.reason || '').trim();
    const details = String(body?.details || '').trim();

    const job = findRecord(db, 'jobs', (j) => j.id === jobId && j.customerUserId === user.id);
    if (!job) fail(404, 'Job not found.');
    if (job.status !== 'COMPLETED' || !job.completedAt) {
      fail(400, 'Rework disputes can only be filed for completed jobs.');
    }
    if (Date.now() - new Date(job.completedAt).getTime() > 7 * 86400000) {
      fail(400, 'The 7-day Karigar Guarantee window for this job has ended.');
    }
    if ((db.disputes || []).some((d) => d.jobId === job.id)) {
      fail(409, 'A dispute is already open for this job.');
    }
    if (reason.length < 3 || details.length < 10) {
      fail(400, 'Provide a clear reason and rework details (10+ characters).');
    }

    const now = new Date().toISOString();
    const id = newId('dsp');
    insertRecord(db, 'disputes', {
      id,
      jobId: job.id,
      customerUserId: user.id,
      workerProfileId: job.workerProfileId,
      reason,
      details,
      workerResponse: '',
      workerRespondedAt: null,
      status: 'OPEN',
      adminResolutionNotes: '',
      resolvedByUserId: null,
      createdAt: now,
      resolvedAt: null,
      updatedAt: now,
    });

    job.status = 'DISPUTED';
    job.updatedAt = now;

    const wp = findRecord(db, 'workerProfiles', (w) => w.id === job.workerProfileId);
    if (wp) {
      appendNotification(db, {
        userId: wp.userId,
        type: 'DISPUTE_OPENED',
        title: `7-Day Karigar Guarantee Request: ${job.title}`,
        message: `${user.fullName} requested rework/review: ${reason}. Respond promptly from My Jobs.`,
        link: '/worker/jobs',
      });
    }
    for (const adm of db.users.filter((u) => u.role === 'ADMIN' && u.status === 'ACTIVE')) {
      appendNotification(db, {
        userId: adm.id,
        type: 'DISPUTE_OPENED',
        title: `Guarantee Dispute: ${job.title}`,
        message: `${user.fullName} opened a 7-day rework dispute.`,
        link: '/admin/disputes',
      });
    }

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'GUARANTEE_DISPUTE_OPENED',
      entityType: 'Dispute',
      entityId: id,
      description: `Customer opened 7-day Karigar Guarantee dispute on job "${job.title}": ${reason}.`,
    });
    writeDb(db);
    return ok({ id }, '7-day Karigar Guarantee request submitted.');
  }

  if (method === 'PATCH' && path.startsWith('/disputes/') && path.endsWith('/respond')) {
    const user = requireAuthUser('WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    const disputeId = path.slice('/disputes/'.length, -'/respond'.length);
    const dispute = findRecord(db, 'disputes', (d) => d.id === disputeId && d.workerProfileId === wp?.id);
    if (!dispute) fail(404, 'Dispute not found.');

    const responseText = String(body?.workerResponse || '').trim();
    if (responseText.length < 5) fail(400, 'Enter your response (5+ characters).');

    const now = new Date().toISOString();
    dispute.workerResponse = responseText;
    dispute.workerRespondedAt = now;
    if (dispute.status === 'OPEN') dispute.status = 'WORKER_RESPONDED';
    dispute.updatedAt = now;

    appendNotification(db, {
      userId: dispute.customerUserId,
      type: 'DISPUTE_RESPONDED',
      title: 'Worker Responded to Rework Request',
      message: `${user.fullName}: ${responseText}`,
      link: '/employer/jobs',
    });
    writeDb(db);
    return ok(undefined, 'Response sent to customer and administrator.');
  }

  if (method === 'GET' && path === '/admin/disputes') {
    requireAuthUser('ADMIN');
    const rows = (db.disputes || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((d) => {
        const job = findRecord(db, 'jobs', (j) => j.id === d.jobId);
        const cu = findRecord(db, 'users', (u) => u.id === d.customerUserId);
        const wp = findRecord(db, 'workerProfiles', (w) => w.id === d.workerProfileId);
        const wu = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
        return {
          ...d,
          jobTitle: job?.title || 'Job',
          jobCity: job?.city || '',
          customerName: cu?.fullName || 'Customer',
          workerName: wu?.fullName || 'Worker',
          workerPublicId: wp?.publicId || '',
        };
      });
    return ok(rows);
  }

  if (method === 'PATCH' && path.startsWith('/admin/disputes/') && path.endsWith('/resolve')) {
    const admin = requireAuthUser('ADMIN');
    const disputeId = path.slice('/admin/disputes/'.length, -'/resolve'.length);
    const dispute = findRecord(db, 'disputes', (d) => d.id === disputeId);
    if (!dispute) fail(404, 'Dispute not found.');

    const resolution = String(body?.status || '').toUpperCase();
    if (resolution !== 'RESOLVED_UPHELD' && resolution !== 'RESOLVED_DISMISSED') {
      fail(400, 'Resolution status must be RESOLVED_UPHELD or RESOLVED_DISMISSED.');
    }

    const notes = String(body?.adminResolutionNotes || '').trim();
    const now = new Date().toISOString();
    dispute.status = resolution;
    dispute.adminResolutionNotes = notes;
    dispute.resolvedByUserId = admin.id;
    dispute.resolvedAt = now;
    dispute.updatedAt = now;

    const job = findRecord(db, 'jobs', (j) => j.id === dispute.jobId);
    if (job && resolution === 'RESOLVED_DISMISSED') {
      job.status = 'COMPLETED';
      job.updatedAt = now;
    }

    const wp = findRecord(db, 'workerProfiles', (w) => w.id === dispute.workerProfileId);
    if (wp) {
      if (resolution === 'RESOLVED_UPHELD' && wp.tier && wp.tier !== 'NONE') {
        wp.tierUnderReview = true;
        wp.tierStatus = 'UNDER_REVIEW';
      }
      appendNotification(db, {
        userId: wp.userId,
        type: 'DISPUTE_RESOLVED',
        title: `Guarantee Dispute Resolved (${resolution === 'RESOLVED_UPHELD' ? 'Upheld' : 'Dismissed'})`,
        message: notes || 'Administrator reviewed the 7-day guarantee request.',
        link: '/worker/jobs',
      });
    }
    appendNotification(db, {
      userId: dispute.customerUserId,
      type: 'DISPUTE_RESOLVED',
      title: `Guarantee Dispute Resolved`,
      message: notes || 'Administrator reviewed your 7-day rework request.',
      link: '/employer/jobs',
    });

    appendAuditLog(db, {
      actorUserId: admin.id,
      action: `DISPUTE_${resolution}`,
      entityType: 'Dispute',
      entityId: dispute.id,
      description: `Admin resolved dispute ${dispute.id} as ${resolution}.`,
    });
    writeDb(db);
    return ok(undefined, 'Dispute resolved and recorded in audit log.');
  }

  // ==================== WORKER GROWTH HUB & EARNINGS ====================
  if (method === 'GET' && path === '/workers/me/growth') {
    const user = requireAuthUser('WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    if (!wp) fail(404, 'Worker profile not found.');

    const logs = (db.earningsLogs || [])
      .filter((e) => e.workerProfileId === wp.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    const totalEarningsPkr = logs.reduce((acc, l) => acc + l.amountPkr, 0);
    const thisMonthPrefix = new Date().toISOString().slice(0, 7);
    const thisMonthPkr = logs
      .filter((l) => l.date.startsWith(thisMonthPrefix))
      .reduce((acc, l) => acc + l.amountPkr, 0);

    const trust = computeTrustScoreBreakdown(db, wp.id);
    const tierProgress = evaluateWorkerTierProgress(db, wp.id);

    // Recommended unverified competencies in worker's trade
    const nowMs = Date.now();
    const verifiedCompIds = new Set(
      db.badges
        .filter((b) => b.workerProfileId === wp.id && b.status === 'ACTIVE' && new Date(b.expiresAt).getTime() > nowMs)
        .map((b) => b.competencyId)
    );
    const recommendedSkills = wp.selectedTradeId
      ? db.competencies
          .filter((c) => c.tradeId === wp.selectedTradeId && c.isActive && !verifiedCompIds.has(c.id))
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .slice(0, 4)
      : [];

    // City rank among public workers in same city
    const cityPeers = db.workerProfiles
      .filter((p) => {
        const pu = findRecord(db, 'users', (u) => u.id === p.userId);
        return pu && p.isPublic && pu.status === 'ACTIVE' && pu.city.toLowerCase() === user.city.toLowerCase();
      })
      .map((p) => ({
        id: p.id,
        score: computeTrustScoreBreakdown(db, p.id).total,
      }))
      .sort((a, b) => b.score - a.score);
    const cityRankIndex = cityPeers.findIndex((p) => p.id === wp.id);

    return ok({
      passportId: ensureWorkerPassportId(wp),
      publicId: wp.publicId,
      totalEarningsPkr,
      thisMonthPkr,
      totalJobsLogged: logs.length,
      logs,
      trustScoreBreakdown: trust,
      tierProgress,
      recommendedSkills,
      cityRank: cityRankIndex >= 0 ? cityRankIndex + 1 : null,
      cityPeersTotal: cityPeers.length,
    });
  }

  if (method === 'POST' && path === '/workers/me/earnings') {
    const user = requireAuthUser('WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    if (!wp) fail(404, 'Worker profile not found.');

    const title = String(body?.title || '').trim();
    const amountPkr = Number(body?.amountPkr || 0);
    const date = String(body?.date || new Date().toISOString().slice(0, 10)).trim();
    const notes = String(body?.notes || '').trim().slice(0, 300);
    if (title.length < 2 || !Number.isFinite(amountPkr) || amountPkr <= 0) {
      fail(400, 'Enter a valid job title and PKR amount.');
    }

    const id = newId('earn');
    insertRecord(db, 'earningsLogs', {
      id,
      workerProfileId: wp.id,
      jobId: null,
      title,
      amountPkr: Math.round(amountPkr),
      date,
      notes,
      createdAt: new Date().toISOString(),
    });
    writeDb(db);
    return ok({ id }, 'Earnings entry logged.');
  }

  if (method === 'DELETE' && path.startsWith('/workers/me/earnings/')) {
    const user = requireAuthUser('WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    if (!wp) fail(404, 'Worker profile not found.');
    const id = path.slice('/workers/me/earnings/'.length);
    const deleted = deleteRecordsWhere(
      db,
      'earningsLogs',
      (e) => e.id === id && e.workerProfileId === wp.id && !e.jobId
    );
    if (deleted === 0) fail(404, 'Manual earnings entry not found (job-linked logs cannot be deleted).');
    writeDb(db);
    return ok(undefined, 'Earnings entry removed.');
  }

  // ==================== ADMIN TIER RULES & APPROVAL QUEUE ====================
  if (method === 'GET' && path === '/admin/tier-rules') {
    requireAuthUser('ADMIN');
    return ok(getTierRules(db));
  }

  if (method === 'PUT' && path === '/admin/tier-rules') {
    const admin = requireAuthUser('ADMIN');
    const incoming = body as TierRuleConfig;
    const current = getTierRules(db);
    const updated: TierRuleConfig = { ...current };

    for (const tierName of TIER_ORDER) {
      const rule = incoming?.[tierName];
      if (!rule) continue;
      updated[tierName] = {
        tier: tierName,
        minVerifiedCompetencies: Math.max(1, Math.round(Number(rule.minVerifiedCompetencies || current[tierName].minVerifiedCompetencies))),
        minRating: Math.max(1, Math.min(5, Number(rule.minRating || current[tierName].minRating))),
        minCompletedJobs: Math.max(0, Math.round(Number(rule.minCompletedJobs ?? current[tierName].minCompletedJobs))),
        minActiveMonths: Math.max(0, Math.round(Number(rule.minActiveMonths ?? current[tierName].minActiveMonths))),
        validityMonths: Math.max(1, Math.round(Number(rule.validityMonths || 12))),
      };
    }

    db.settings.tierRules = updated;
    appendAuditLog(db, {
      actorUserId: admin.id,
      action: 'TIER_RULES_UPDATED',
      entityType: 'Settings',
      entityId: 'tierRules',
      description: 'Admin updated Karigar Tier qualification thresholds.',
    });
    writeDb(db);
    return ok(updated, 'Karigar Tier rules saved.');
  }

  if (method === 'GET' && path === '/admin/tier-queue') {
    requireAuthUser('ADMIN');
    const rank = (s: string) => (s === 'PENDING' ? 0 : 1);
    const apps = (db.tierApplications || [])
      .slice()
      .sort((a, b) => rank(a.status) - rank(b.status) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((app) => {
        const wp = findRecord(db, 'workerProfiles', (w) => w.id === app.workerProfileId);
        const wu = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
        const trade = wp?.selectedTradeId ? findRecord(db, 'trades', (t) => t.id === wp.selectedTradeId) : undefined;
        const progress = wp ? evaluateWorkerTierProgress(db, wp.id) : null;
        const trust = wp ? computeTrustScoreBreakdown(db, wp.id) : null;
        return {
          ...app,
          workerName: wu?.fullName || 'Worker',
          workerCity: wu?.city || '',
          workerPublicId: wp?.publicId || '',
          currentTier: wp?.tier || 'NONE',
          tradeName: trade?.name || '',
          metrics: progress?.metrics || null,
          trustScore: trust?.total ?? app.trustScoreSnapshot,
        };
      });
    return ok(apps);
  }

  if (method === 'PATCH' && path.startsWith('/admin/tier-queue/')) {
    const admin = requireAuthUser('ADMIN');
    const appId = path.slice('/admin/tier-queue/'.length);
    const app = findRecord(db, 'tierApplications', (a) => a.id === appId);
    if (!app) fail(404, 'Tier application not found.');

    const rawDecision = String(body?.status || '').toUpperCase();
    if (rawDecision !== 'APPROVED' && rawDecision !== 'REJECTED') {
      fail(400, 'Decision must be APPROVED or REJECTED.');
    }
    const decision: 'APPROVED' | 'REJECTED' = rawDecision;
    const adminNotes = String(body?.adminNotes || '').trim();
    const wp = findRecord(db, 'workerProfiles', (w) => w.id === app.workerProfileId);
    const wu = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
    if (!wp) fail(404, 'Worker profile not found.');

    const now = new Date().toISOString();
    app.status = decision;
    app.adminNotes = adminNotes;
    app.reviewedByUserId = admin.id;
    app.reviewedAt = now;

    const rules = getTierRules(db);
    if (decision === 'APPROVED') {
      const validityMonths = rules[app.requestedTier]?.validityMonths || 12;
      const expiresAt = new Date(Date.now() + validityMonths * 30 * 86400000).toISOString();
      wp.tier = app.requestedTier as KarigarTier;
      wp.tierStatus = 'ACTIVE';
      wp.tierIssuedAt = now;
      wp.tierExpiresAt = expiresAt;
      wp.tierUnderReview = false;
      wp.tierRejectionReason = '';
      wp.updatedAt = now;

      appendNotification(db, {
        userId: wp.userId,
        type: 'TIER_APPROVED',
        title: `Congratulations! ${app.requestedTier} Karigar Tier Approved`,
        message: `Your profile now displays the ${app.requestedTier} Karigar Tier badge (valid for ${validityMonths} months).`,
        link: '/worker/dashboard',
      });
    } else {
      wp.tierRejectionReason = adminNotes;
      wp.updatedAt = now;
      appendNotification(db, {
        userId: wp.userId,
        type: 'TIER_REJECTED',
        title: `Tier Review Update (${app.requestedTier})`,
        message: adminNotes || `Your ${app.requestedTier} tier application requires further review.`,
        link: '/worker/dashboard',
      });
    }

    appendAuditLog(db, {
      actorUserId: admin.id,
      action: `TIER_${decision}`,
      entityType: 'TierApplication',
      entityId: app.id,
      description: `Admin ${decision.toLowerCase()} ${app.requestedTier} tier for ${wu?.fullName || wp.id}.`,
    });
    writeDb(db);
    return ok(undefined, `Tier application ${decision.toLowerCase()}.`);
  }

  return null;
}
