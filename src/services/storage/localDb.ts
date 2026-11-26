import { buildAllCatalogTradesAndRubrics, buildV2SeedAdditions } from './seedData';
import {
  DEFAULT_TIER_RULES,
  TIER_ORDER,
  computeTrustScoreBreakdown,
  computeWorkerRatingSummary,
  ensureWorkerPassportId,
  evaluateWorkerTierProgress,
  getTierRules,
} from './trustAndTiers';
import {
  AuditLogRecord,
  InternalDatabaseSchema,
  KarigarTier,
  NotificationRecord,
  VerificationLevel,
} from './types';

const DB_STORAGE_KEY = 'kc_db_v1';
const CURRENT_DB_VERSION = 2;

let initPromise: Promise<InternalDatabaseSchema> | null = null;

export function newId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function readRawDb(): InternalDatabaseSchema | null {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InternalDatabaseSchema;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.trades)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeDb(db: InternalDatabaseSchema): void {
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
}

function mergeById<T extends { id: string }>(target: T[], incoming: T[]): void {
  const seen = new Set(target.map((x) => x.id));
  for (const item of incoming) {
    if (!seen.has(item.id)) {
      target.push(item);
      seen.add(item.id);
    }
  }
}

async function migrateDatabaseToV2(db: InternalDatabaseSchema): Promise<boolean> {
  let changed = false;
  const now = new Date().toISOString();

  // Fix legacy /src/assets/images/ asset paths
  for (const wp of db.workerProfiles || []) {
    if (wp.avatarUrl && wp.avatarUrl.startsWith('/src/assets/images/')) {
      wp.avatarUrl = wp.avatarUrl.replace('/src/assets/images/', '/images/');
      changed = true;
    }
    if (!wp.passportId) {
      wp.passportId = ensureWorkerPassportId(wp);
      changed = true;
    }
    if (wp.tier === undefined) {
      wp.tier = 'NONE';
      wp.tierStatus = 'NONE';
      wp.tierIssuedAt = null;
      wp.tierExpiresAt = null;
      wp.tierUnderReview = false;
      changed = true;
    }
    if (wp.isFemaleProfessional === undefined) {
      wp.isFemaleProfessional = wp.id === 'worker_nadia' || wp.id === 'worker_zainab';
      changed = true;
    }
  }

  for (const ev of db.evidence || []) {
    if (ev.seedAssetPath && ev.seedAssetPath.startsWith('/src/assets/images/')) {
      ev.seedAssetPath = ev.seedAssetPath.replace('/src/assets/images/', '/images/');
      changed = true;
    }
  }

  // Ensure settings & arrays exist
  if (!db.settings) {
    db.settings = { lang: 'en', tierRules: DEFAULT_TIER_RULES };
    changed = true;
  }
  if (!db.settings.tierRules) {
    db.settings.tierRules = DEFAULT_TIER_RULES;
    changed = true;
  }
  if (!Array.isArray(db.jobs)) {
    db.jobs = [];
    changed = true;
  }
  if (!Array.isArray(db.reviews)) {
    db.reviews = [];
    changed = true;
  }
  if (!Array.isArray(db.disputes)) {
    db.disputes = [];
    changed = true;
  }
  if (!Array.isArray(db.tierApplications)) {
    db.tierApplications = [];
    changed = true;
  }
  if (!Array.isArray(db.earningsLogs)) {
    db.earningsLogs = [];
    changed = true;
  }

  if ((db.version || 1) < CURRENT_DB_VERSION) {
    // 1. Upsert all 8-group ~50 catalog trades, competencies, criteria & fair price guides
    const catalog = buildAllCatalogTradesAndRubrics(now);
    const catalogTradeMap = new Map(catalog.trades.map((t) => [t.id, t]));
    for (const existingTrade of db.trades) {
      const ref = catalogTradeMap.get(existingTrade.id);
      if (ref) {
        if (!existingTrade.group) existingTrade.group = ref.group;
        if (!existingTrade.urduGroup) existingTrade.urduGroup = ref.urduGroup;
        if (!existingTrade.priceGuide || existingTrade.priceGuide.length === 0) {
          existingTrade.priceGuide = ref.priceGuide;
        }
        if (ref.id === 'trade_mechanic') {
          existingTrade.name = ref.name;
        }
      }
    }
    mergeById(db.trades, catalog.trades);
    mergeById(db.competencies, catalog.competencies);
    mergeById(db.rubricCriteria, catalog.rubricCriteria);

    // 2. Back-date legacy demo accounts so Bilal qualifies for GOLD, Nadia SILVER, Usman BRONZE without duplicating
    const daysAgoIso = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
    const daysFromNowIso = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

    const bilal = db.workerProfiles.find((w) => w.id === 'worker_bilal');
    if (bilal) {
      if (Date.now() - new Date(bilal.createdAt).getTime() < 180 * 86400000) {
        bilal.createdAt = daysAgoIso(210);
      }
      bilal.tier = 'GOLD';
      bilal.tierStatus = 'ACTIVE';
      bilal.tierIssuedAt = daysAgoIso(10);
      bilal.tierExpiresAt = daysFromNowIso(355);
      bilal.tierUnderReview = false;
      bilal.passportId = 'KC-PASS-BILAL1';
    }
    const nadia = db.workerProfiles.find((w) => w.id === 'worker_nadia');
    if (nadia) {
      if (Date.now() - new Date(nadia.createdAt).getTime() < 100 * 86400000) {
        nadia.createdAt = daysAgoIso(125);
      }
      nadia.tier = 'SILVER';
      nadia.tierStatus = 'ACTIVE';
      nadia.tierIssuedAt = daysAgoIso(12);
      nadia.tierExpiresAt = daysFromNowIso(353);
      nadia.tierUnderReview = false;
      nadia.isFemaleProfessional = true;
      nadia.passportId = 'KC-PASS-NADIA2';
    }
    const usman = db.workerProfiles.find((w) => w.id === 'worker_usman');
    if (usman) {
      if (Date.now() - new Date(usman.createdAt).getTime() < 35 * 86400000) {
        usman.createdAt = daysAgoIso(50);
      }
      usman.tier = 'BRONZE';
      usman.tierStatus = 'ACTIVE';
      usman.tierIssuedAt = daysAgoIso(6);
      usman.tierExpiresAt = daysFromNowIso(359);
      usman.tierUnderReview = false;
      usman.passportId = 'KC-PASS-USMAN3';
    }

    // 3. Expand Tariq assessor's approved trades so seeded multi-trade assessors work seamlessly
    const tariqAsr = db.assessorProfiles.find((a) => a.id === 'assessor_tariq');
    if (tariqAsr && !tariqAsr.approvedTradeIds.includes('trade_plumber')) {
      tariqAsr.approvedTradeIds = Array.from(
        new Set([
          ...tariqAsr.approvedTradeIds,
          'trade_plumber',
          'trade_carpenter',
          'trade_ac_technician',
          'trade_beauty_parlour',
          'trade_appliance',
          'trade_mechanic',
        ])
      );
    }

    // 4. Merge v2 seed additions idempotently by deterministic ID
    const v2 = await buildV2SeedAdditions();
    mergeById(db.users, v2.extraUsers);
    mergeById(db.employerProfiles, v2.extraEmployers);
    mergeById(db.workerProfiles, v2.extraWorkers);
    mergeById(db.assessmentRequests, v2.extraRequests);
    mergeById(db.assessmentItems, v2.extraItems);
    mergeById(db.badges, v2.extraBadges);
    mergeById(db.jobs, v2.jobs);
    mergeById(db.reviews, v2.reviews);
    mergeById(db.earningsLogs, v2.earningsLogs);
    mergeById(db.tierApplications, v2.tierApplications);
    mergeById(db.auditLogs, v2.extraAuditLogs);
    mergeById(db.notifications, v2.extraNotifications);

    db.version = CURRENT_DB_VERSION;
    changed = true;
  }

  return changed;
}

export async function ensureDbInitialized(): Promise<InternalDatabaseSchema> {
  const existing = readRawDb();
  if (existing && existing.trades.length > 0 && existing.users.length > 0) {
    const migrated = await migrateDatabaseToV2(existing);
    if (migrated) {
      writeDb(existing);
    }
    return existing;
  }
  if (!initPromise) {
    initPromise = (async () => {
      const { buildInitialSeedDatabase } = await import('./seedData');
      const fresh = await buildInitialSeedDatabase();
      const check = readRawDb();
      if (check && check.trades.length > 0) {
        const migrated = await migrateDatabaseToV2(check);
        if (migrated) writeDb(check);
        return check;
      }
      writeDb(fresh);
      return fresh;
    })().finally(() => {
      initPromise = null;
    });
  }
  return initPromise;
}

export function expireOutdatedBadges(db: InternalDatabaseSchema): boolean {
  const nowMs = Date.now();
  let changed = false;
  const nowIso = new Date(nowMs).toISOString();
  for (const badge of db.badges) {
    if (badge.status === 'ACTIVE' && new Date(badge.expiresAt).getTime() <= nowMs) {
      badge.status = 'EXPIRED';
      badge.updatedAt = nowIso;
      changed = true;
    }
  }

  // Also check 12-month Karigar Tier expiries and rating health threshold drops
  const rules = getTierRules(db);
  for (const wp of db.workerProfiles) {
    if (wp.tier && wp.tier !== 'NONE' && wp.tierStatus === 'ACTIVE') {
      if (wp.tierExpiresAt && new Date(wp.tierExpiresAt).getTime() <= nowMs) {
        wp.tierStatus = 'EXPIRED';
        wp.updatedAt = nowIso;
        changed = true;
        appendNotification(db, {
          userId: wp.userId,
          type: 'TIER_EXPIRED',
          title: `Karigar Tier Expired (${wp.tier})`,
          message: `Your 12-month ${wp.tier} tier validity has ended. Maintain your competencies and customer rating to renew.`,
          link: '/worker/dashboard',
        });
      } else {
        const tierRule = rules[wp.tier as Exclude<KarigarTier, 'NONE'>];
        const rating = computeWorkerRatingSummary(db, wp.id);
        if (rating.totalReviews >= 3 && tierRule && rating.rawAverage < tierRule.minRating) {
          if (!wp.tierUnderReview) {
            wp.tierUnderReview = true;
            wp.tierStatus = 'UNDER_REVIEW';
            wp.updatedAt = nowIso;
            changed = true;
            appendNotification(db, {
              userId: wp.userId,
              type: 'TIER_UNDER_REVIEW',
              title: `${wp.tier} Tier Placed Under Review`,
              message: `Your recent customer rating (${rating.rawAverage}) fell below the ${tierRule.minRating} minimum for ${wp.tier}. Complete quality jobs to restore status.`,
              link: '/worker/dashboard',
            });
          }
        } else if (wp.tierUnderReview && rating.totalReviews >= 3 && tierRule && rating.rawAverage >= tierRule.minRating) {
          wp.tierUnderReview = false;
          wp.tierStatus = 'ACTIVE';
          wp.updatedAt = nowIso;
          changed = true;
        }
      }
    }
  }

  return changed;
}

export function checkAndQueueEligibleTierApplication(
  db: InternalDatabaseSchema,
  workerProfileId: string
): void {
  const wp = db.workerProfiles.find((w) => w.id === workerProfileId);
  if (!wp) return;

  const progress = evaluateWorkerTierProgress(db, workerProfileId);
  const currentIdx = progress.currentTier === 'NONE' ? -1 : TIER_ORDER.indexOf(progress.currentTier);
  const eligibleIdx = progress.eligibleTier === 'NONE' ? -1 : TIER_ORDER.indexOf(progress.eligibleTier);

  if (eligibleIdx > currentIdx && progress.eligibleTier !== 'NONE') {
    const requestedTier = progress.eligibleTier as Exclude<KarigarTier, 'NONE'>;
    db.tierApplications = db.tierApplications || [];
    const alreadyPending = db.tierApplications.some(
      (a) => a.workerProfileId === workerProfileId && a.requestedTier === requestedTier && a.status === 'PENDING'
    );
    if (!alreadyPending) {
      const trust = computeTrustScoreBreakdown(db, workerProfileId);
      const workerUser = db.users.find((u) => u.id === wp.userId);
      db.tierApplications.push({
        id: newId('tapp'),
        workerProfileId,
        requestedTier,
        status: 'PENDING',
        trustScoreSnapshot: trust.total,
        adminNotes: '',
        reviewedByUserId: null,
        createdAt: new Date().toISOString(),
        reviewedAt: null,
      });

      const admins = db.users.filter((u) => u.role === 'ADMIN' && u.status === 'ACTIVE');
      for (const adm of admins) {
        appendNotification(db, {
          userId: adm.id,
          type: 'TIER_APPLICATION',
          title: `Tier Eligibility Reached: ${workerUser?.fullName || 'Worker'} (${requestedTier})`,
          message: `${workerUser?.fullName || 'Worker'} met all criteria for ${requestedTier} tier and awaits approval.`,
          link: '/admin/tiers',
        });
      }
    }
  }
}

/**
 * Reusable centralized CRUD helpers for all collections in InternalDatabaseSchema.
 */
type CollectionKey = {
  [K in keyof InternalDatabaseSchema]-?: NonNullable<InternalDatabaseSchema[K]> extends Array<infer _> ? K : never;
}[keyof InternalDatabaseSchema];

type CollectionItem<K extends CollectionKey> = NonNullable<InternalDatabaseSchema[K]> extends Array<infer Item>
  ? Item
  : never;

function getCollectionArray<K extends CollectionKey>(
  db: InternalDatabaseSchema,
  collection: K
): CollectionItem<K>[] {
  const key = collection as string;
  const record = db as unknown as Record<string, CollectionItem<K>[] | undefined>;
  const val = record[key];
  if (!Array.isArray(val)) {
    record[key] = [];
  }
  return record[key] as CollectionItem<K>[];
}

export function listRecords<K extends CollectionKey>(
  db: InternalDatabaseSchema,
  collection: K,
  predicate?: (item: CollectionItem<K>) => boolean
): CollectionItem<K>[] {
  const items = getCollectionArray(db, collection);
  if (!predicate) return [...items];
  return items.filter(predicate);
}

export function findRecord<K extends CollectionKey>(
  db: InternalDatabaseSchema,
  collection: K,
  predicate: (item: CollectionItem<K>) => boolean
): CollectionItem<K> | undefined {
  return getCollectionArray(db, collection).find(predicate);
}

export function insertRecord<K extends CollectionKey>(
  db: InternalDatabaseSchema,
  collection: K,
  record: CollectionItem<K>
): CollectionItem<K> {
  getCollectionArray(db, collection).push(record);
  return record;
}

export function updateRecordById<K extends CollectionKey>(
  db: InternalDatabaseSchema,
  collection: K,
  id: string,
  updater: (current: CollectionItem<K>) => CollectionItem<K>
): CollectionItem<K> | null {
  const arr = getCollectionArray(db, collection) as (CollectionItem<K> & { id: string })[];
  const idx = arr.findIndex((item) => item.id === id);
  if (idx === -1) return null;
  const updated = updater(arr[idx]) as CollectionItem<K> & { id: string };
  arr[idx] = updated;
  return updated;
}

export function deleteRecordsWhere<K extends CollectionKey>(
  db: InternalDatabaseSchema,
  collection: K,
  predicate: (item: CollectionItem<K>) => boolean
): number {
  const arr = getCollectionArray(db, collection);
  const before = arr.length;
  const remaining = arr.filter((item) => !predicate(item));
  (db as unknown as Record<string, unknown>)[collection as string] = remaining;
  return before - remaining.length;
}

export function appendAuditLog(
  db: InternalDatabaseSchema,
  params: {
    actorUserId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    description: string;
  }
): AuditLogRecord {
  const record: AuditLogRecord = {
    id: newId('audit'),
    actorUserId: params.actorUserId ?? null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    description: params.description,
    createdAt: new Date().toISOString(),
  };
  db.auditLogs.push(record);
  return record;
}

export function appendNotification(
  db: InternalDatabaseSchema,
  params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  }
): NotificationRecord {
  const record: NotificationRecord = {
    id: newId('notif'),
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link || '',
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.push(record);
  return record;
}

export interface RubricEvaluationResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  level: VerificationLevel | null;
  safetyCriticalFailed: boolean;
  eligibleForVerification: boolean;
}

export function evaluateRubricScores(
  criteria: Array<{ id: string; isSafetyCritical: boolean; maxScore: number }>,
  scores: Array<{ criterionId: string; score: number; comment?: string }>
): RubricEvaluationResult {
  if (criteria.length === 0) {
    throw new Error('Competency has no rubric criteria configured.');
  }

  const scoreMap = new Map<string, number>();
  for (const s of scores) {
    scoreMap.set(s.criterionId, s.score);
  }

  let totalScore = 0;
  let maxScore = 0;
  let safetyCriticalFailed = false;

  for (const crit of criteria) {
    const submitted = scoreMap.get(crit.id);
    if (submitted === undefined || !Number.isInteger(submitted) || submitted < 0 || submitted > crit.maxScore) {
      throw new Error('Invalid or missing score for rubric criterion.');
    }
    if (crit.isSafetyCritical && submitted === 0) {
      safetyCriticalFailed = true;
    }
    totalScore += submitted;
    maxScore += crit.maxScore;
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0;

  let level: VerificationLevel | null = null;
  if (!safetyCriticalFailed) {
    if (percentage >= 85) level = 'ADVANCED';
    else if (percentage >= 70) level = 'COMPETENT';
    else if (percentage >= 50) level = 'BASIC';
  }

  return {
    totalScore,
    maxScore,
    percentage,
    level,
    safetyCriticalFailed,
    eligibleForVerification: !safetyCriticalFailed && percentage >= 50,
  };
}
