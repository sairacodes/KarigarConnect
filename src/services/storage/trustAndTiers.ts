import {
  InternalDatabaseSchema,
  KarigarTier,
  TierRuleConfig,
  TierRuleItem,
} from './types';

export const DEFAULT_TIER_RULES: TierRuleConfig = {
  BRONZE: {
    tier: 'BRONZE',
    minVerifiedCompetencies: 1,
    minRating: 3.5,
    minCompletedJobs: 5,
    minActiveMonths: 1,
    validityMonths: 12,
  },
  SILVER: {
    tier: 'SILVER',
    minVerifiedCompetencies: 2,
    minRating: 4.0,
    minCompletedJobs: 15,
    minActiveMonths: 3,
    validityMonths: 12,
  },
  GOLD: {
    tier: 'GOLD',
    minVerifiedCompetencies: 3,
    minRating: 4.4,
    minCompletedJobs: 40,
    minActiveMonths: 6,
    validityMonths: 12,
  },
  PLATINUM: {
    tier: 'PLATINUM',
    minVerifiedCompetencies: 4,
    minRating: 4.7,
    minCompletedJobs: 80,
    minActiveMonths: 12,
    validityMonths: 12,
  },
};

export const TIER_ORDER: Exclude<KarigarTier, 'NONE'>[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

export function getTierRules(db: InternalDatabaseSchema): TierRuleConfig {
  return db.settings?.tierRules || DEFAULT_TIER_RULES;
}

export interface WorkerRatingSummary {
  totalReviews: number;
  rawAverage: number;
  bayesianRating: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  subAverages: {
    quality: number;
    punctuality: number;
    behaviour: number;
    value: number;
  };
}

export function computeWorkerRatingSummary(
  db: InternalDatabaseSchema,
  workerProfileId: string
): WorkerRatingSummary {
  const visibleReviews = (db.reviews || []).filter(
    (r) => r.workerProfileId === workerProfileId && !r.isHiddenByAdmin
  );

  const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (visibleReviews.length === 0) {
    return {
      totalReviews: 0,
      rawAverage: 0,
      bayesianRating: 0,
      distribution: dist,
      subAverages: { quality: 0, punctuality: 0, behaviour: 0, value: 0 },
    };
  }

  let sumOverall = 0;
  let sumQ = 0;
  let sumP = 0;
  let sumB = 0;
  let sumV = 0;

  for (const r of visibleReviews) {
    const rounded = Math.max(1, Math.min(5, Math.round(r.overallRating))) as 1 | 2 | 3 | 4 | 5;
    dist[rounded] += 1;
    sumOverall += r.overallRating;
    sumQ += r.qualityRating || r.overallRating;
    sumP += r.punctualityRating || r.overallRating;
    sumB += r.behaviourRating || r.overallRating;
    sumV += r.valueRating || r.overallRating;
  }

  const n = visibleReviews.length;
  const rawAverage = Math.round((sumOverall / n) * 100) / 100;

  // Bayesian weighted rating: (n*R + m*C) / (n + m), prior C=4.1, smoothing m=3
  const C = 4.1;
  const m = 3;
  const bayesianRating = Math.round(((n * rawAverage + m * C) / (n + m)) * 100) / 100;

  return {
    totalReviews: n,
    rawAverage,
    bayesianRating,
    distribution: dist,
    subAverages: {
      quality: Math.round((sumQ / n) * 10) / 10,
      punctuality: Math.round((sumP / n) * 10) / 10,
      behaviour: Math.round((sumB / n) * 10) / 10,
      value: Math.round((sumV / n) * 10) / 10,
    },
  };
}

export interface TrustScoreBreakdown {
  total: number; // 0 - 100
  competenciesPoints: number; // max 40
  ratingPoints: number; // max 30
  jobsAndRepeatPoints: number; // max 15
  reliabilityPoints: number; // max 10
  safetyPoints: number; // max 5
  metrics: {
    verifiedCompetencies: number;
    tradeCompetenciesCount: number;
    completedJobs: number;
    repeatCustomers: number;
    workerCancellations: number;
    totalJobsEngaged: number;
    upheldReportsOrDisputes: number;
    safetyCriteriaPassed: number;
  };
}

export function computeTrustScoreBreakdown(
  db: InternalDatabaseSchema,
  workerProfileId: string
): TrustScoreBreakdown {
  const wp = db.workerProfiles.find((w) => w.id === workerProfileId);
  const nowMs = Date.now();
  const activeBadges = db.badges.filter(
    (b) => b.workerProfileId === workerProfileId && b.status === 'ACTIVE' && new Date(b.expiresAt).getTime() > nowMs
  );

  const tradeCompsCount = wp?.selectedTradeId
    ? db.competencies.filter((c) => c.tradeId === wp.selectedTradeId && c.isActive).length
    : 4;
  const targetComps = Math.max(4, Math.min(6, tradeCompsCount));

  // 1. Verified competencies (40 pts): scale cleanly with verified count & advanced level bonus
  const baseCompRatio = Math.min(1, activeBadges.length / targetComps);
  const advancedBonus = activeBadges.filter((b) => b.level === 'ADVANCED').length * 1.5;
  const competenciesPoints = Math.min(40, Math.round(baseCompRatio * 36 + Math.min(4, advancedBonus)));

  // 2. Customer rating (30 pts): uses Bayesian rating if >= 1 review, else 0
  const ratingSummary = computeWorkerRatingSummary(db, workerProfileId);
  const ratingPoints =
    ratingSummary.totalReviews > 0
      ? Math.min(30, Math.round((ratingSummary.bayesianRating / 5) * 30))
      : 0;

  // 3. Completed jobs & repeat customers (15 pts)
  const jobs = (db.jobs || []).filter((j) => j.workerProfileId === workerProfileId);
  const completedJobs = jobs.filter((j) => j.status === 'COMPLETED');
  const customerCounts = new Map<string, number>();
  for (const j of completedJobs) {
    customerCounts.set(j.customerUserId, (customerCounts.get(j.customerUserId) || 0) + 1);
  }
  const repeatCustomers = Array.from(customerCounts.values()).filter((c) => c >= 2).length;
  const jobVolumePts = Math.min(10, Math.round((completedJobs.length / 25) * 10));
  const repeatPts = Math.min(5, repeatCustomers * 2.5);
  const jobsAndRepeatPoints = Math.min(15, Math.round(jobVolumePts + repeatPts));

  // 4. Response & low-cancellation rate (10 pts)
  const engagedJobs = jobs.filter((j) => j.status !== 'REQUESTED');
  const workerCancellations = jobs.filter(
    (j) => j.status === 'CANCELLED' && j.cancelledByRole === 'WORKER'
  ).length;
  let reliabilityPoints = 0;
  if (engagedJobs.length > 0) {
    const completionRatio = Math.max(0, 1 - workerCancellations / Math.max(1, engagedJobs.length));
    reliabilityPoints = Math.round(completionRatio * 10);
  } else if (activeBadges.length > 0) {
    reliabilityPoints = 6; // baseline before first platform job
  }

  // 5. Safety record (5 pts)
  const upheldDisputes = (db.disputes || []).filter(
    (d) => d.workerProfileId === workerProfileId && d.status === 'RESOLVED_UPHELD'
  ).length;
  const upheldReports = db.reports.filter(
    (r) =>
      r.status === 'RESOLVED' &&
      ((r.targetType === 'WORKER_PROFILE' && r.targetId === workerProfileId) ||
        (r.targetType === 'JOB_SOS' &&
          jobs.some((j) => j.id === r.targetId)))
  ).length;
  const penalties = upheldDisputes + upheldReports;
  const safetyPoints = penalties === 0 ? (activeBadges.length > 0 || completedJobs.length > 0 ? 5 : 3) : Math.max(0, 5 - penalties * 2);

  const total = Math.max(
    0,
    Math.min(
      100,
      competenciesPoints + ratingPoints + jobsAndRepeatPoints + reliabilityPoints + safetyPoints
    )
  );

  return {
    total,
    competenciesPoints,
    ratingPoints,
    jobsAndRepeatPoints,
    reliabilityPoints,
    safetyPoints,
    metrics: {
      verifiedCompetencies: activeBadges.length,
      tradeCompetenciesCount: tradeCompsCount,
      completedJobs: completedJobs.length,
      repeatCustomers,
      workerCancellations,
      totalJobsEngaged: engagedJobs.length,
      upheldReportsOrDisputes: penalties,
      safetyCriteriaPassed: activeBadges.length,
    },
  };
}

export interface TierProgressSummary {
  currentTier: KarigarTier;
  tierStatus: string;
  tierUnderReview: boolean;
  eligibleTier: KarigarTier;
  nextTier: Exclude<KarigarTier, 'NONE'> | null;
  nextRule: TierRuleItem | null;
  progressPercent: number;
  metrics: {
    verifiedCompetencies: number;
    rating: number;
    completedJobs: number;
    activeMonths: number;
    unresolvedReports: number;
  };
  pendingApplicationTier: Exclude<KarigarTier, 'NONE'> | null;
}

export function evaluateWorkerTierProgress(
  db: InternalDatabaseSchema,
  workerProfileId: string
): TierProgressSummary {
  const wp = db.workerProfiles.find((w) => w.id === workerProfileId);
  const rules = getTierRules(db);
  const nowMs = Date.now();
  const activeBadges = db.badges.filter(
    (b) => b.workerProfileId === workerProfileId && b.status === 'ACTIVE' && new Date(b.expiresAt).getTime() > nowMs
  ).length;
  const ratingSummary = computeWorkerRatingSummary(db, workerProfileId);
  const effectiveRating = ratingSummary.totalReviews > 0 ? ratingSummary.rawAverage : 0;
  const completedJobs = (db.jobs || []).filter(
    (j) => j.workerProfileId === workerProfileId && j.status === 'COMPLETED'
  ).length;

  const createdMs = wp ? new Date(wp.createdAt).getTime() : nowMs;
  const activeMonths = Math.max(0, Math.floor((nowMs - createdMs) / (30 * 86400000)));

  const unresolvedReports = db.reports.filter(
    (r) =>
      r.targetType === 'WORKER_PROFILE' &&
      r.targetId === workerProfileId &&
      (r.status === 'OPEN' || r.status === 'UNDER_REVIEW' || r.status === 'RESOLVED')
  ).length;

  let eligibleTier: KarigarTier = 'NONE';
  for (const tierName of TIER_ORDER) {
    const r = rules[tierName];
    if (
      activeBadges >= r.minVerifiedCompetencies &&
      effectiveRating >= r.minRating &&
      completedJobs >= r.minCompletedJobs &&
      activeMonths >= r.minActiveMonths &&
      unresolvedReports === 0
    ) {
      eligibleTier = tierName;
    }
  }

  const currentTier: KarigarTier = wp?.tier || 'NONE';
  const currentIdx = currentTier === 'NONE' ? -1 : TIER_ORDER.indexOf(currentTier);
  const nextTier = currentIdx < TIER_ORDER.length - 1 ? TIER_ORDER[currentIdx + 1] : null;
  const nextRule = nextTier ? rules[nextTier] : null;

  let progressPercent = 100;
  if (nextRule) {
    const p1 = Math.min(1, activeBadges / Math.max(1, nextRule.minVerifiedCompetencies));
    const p2 = Math.min(1, effectiveRating / Math.max(1, nextRule.minRating));
    const p3 = Math.min(1, completedJobs / Math.max(1, nextRule.minCompletedJobs));
    const p4 = Math.min(1, activeMonths / Math.max(1, nextRule.minActiveMonths));
    progressPercent = Math.round(((p1 + p2 + p3 + p4) / 4) * 100);
  }

  const pendingApp = (db.tierApplications || []).find(
    (a) => a.workerProfileId === workerProfileId && a.status === 'PENDING'
  );

  return {
    currentTier,
    tierStatus: wp?.tierStatus || 'NONE',
    tierUnderReview: Boolean(wp?.tierUnderReview),
    eligibleTier,
    nextTier,
    nextRule,
    progressPercent,
    metrics: {
      verifiedCompetencies: activeBadges,
      rating: effectiveRating,
      completedJobs,
      activeMonths,
      unresolvedReports,
    },
    pendingApplicationTier: pendingApp?.requestedTier || null,
  };
}

export function ensureWorkerPassportId(wp: { id: string; publicId: string; passportId?: string }): string {
  if (wp.passportId) return wp.passportId;
  const suffix = wp.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  return `KC-PASS-${suffix}`;
}
