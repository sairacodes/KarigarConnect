import { ALL_CITIES_FLAT } from '../../data/pakistanCities';
import { getServiceBySlugOrId } from '../../data/serviceCatalog';
import { dispatchV2ApiRoute } from './apiEngineV2';
import {
  clearStoredSession,
  createSession,
  getStoredSession,
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from './cryptoAuth';
import {
  deleteEvidenceFile,
  getEvidencePreviewUrl,
  saveEvidenceFile,
  validateEvidenceFiles,
} from './indexedDbFiles';
import {
  appendAuditLog,
  appendNotification,
  checkAndQueueEligibleTierApplication,
  deleteRecordsWhere,
  ensureDbInitialized,
  evaluateRubricScores,
  expireOutdatedBadges,
  findRecord,
  insertRecord,
  listRecords,
  newId,
  writeDb,
} from './localDb';
import {
  computeTrustScoreBreakdown,
  computeWorkerRatingSummary,
  ensureWorkerPassportId,
  evaluateWorkerTierProgress,
} from './trustAndTiers';
import {
  AssessorApprovalStatus,
  InternalDatabaseSchema,
  ReportTargetType,
  UserRecord,
  UserRole,
} from './types';

export class LocalApiError extends Error {
  status: number;
  response: {
    status: number;
    data: {
      success: false;
      message: string;
    };
  };

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.response = {
      status,
      data: {
        success: false,
        message,
      },
    };
  }
}

function fail(status: number, message: string): never {
  throw new LocalApiError(status, message);
}

function ok<T>(data?: T, message?: string) {
  return {
    data: {
      success: true,
      ...(data !== undefined ? { data } : {}),
      ...(message ? { message } : {}),
    },
  };
}

function toSlug(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'item'
  );
}

function buildWorkerPublicSlug(fullName: string, db: InternalDatabaseSchema): string {
  const base = toSlug(fullName).slice(0, 24) || 'worker';
  for (let i = 0; i < 6; i++) {
    const suffix = Math.random().toString(36).slice(2, 6);
    const candidate = `${base}-${suffix}`;
    if (!db.workerProfiles.some((w) => w.publicId === candidate)) {
      return candidate;
    }
  }
  return `${base}-${Date.now().toString(36)}`;
}

function getActiveAuthUser(db: InternalDatabaseSchema, activeToken: string | null): UserRecord | null {
  const session = getStoredSession();
  if (!session) return null;
  if (activeToken && session.token !== activeToken) return null;
  const user = findRecord(db, 'users', (u) => u.id === session.userId);
  if (!user || user.status === 'SUSPENDED') {
    return null;
  }
  return user;
}

function requireAuthUser(db: InternalDatabaseSchema, activeToken: string | null, ...roles: UserRole[]): UserRecord {
  const session = getStoredSession();
  if (!session || (activeToken && session.token !== activeToken)) {
    fail(401, 'Authentication required.');
  }
  const user = findRecord(db, 'users', (u) => u.id === session.userId);
  if (!user) {
    fail(401, 'Account not found.');
  }
  if (user.status === 'SUSPENDED') {
    fail(403, 'Your account has been suspended. Contact support.');
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    fail(403, 'You do not have permission to access this resource.');
  }
  return user;
}

function getSafeUserSummary(db: InternalDatabaseSchema, user: UserRecord) {
  let profileMeta: Record<string, unknown> = {};
  if (user.role === 'WORKER') {
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    if (wp) {
      profileMeta = {
        workerProfileId: wp.id,
        publicId: wp.publicId,
        selectedTradeId: wp.selectedTradeId,
        avatarUrl: wp.avatarUrl,
        isPublic: wp.isPublic,
      };
    }
  } else if (user.role === 'EMPLOYER') {
    const ep = findRecord(db, 'employerProfiles', (e) => e.userId === user.id);
    if (ep) {
      profileMeta = {
        employerProfileId: ep.id,
        companyName: ep.companyName,
      };
    }
  } else if (user.role === 'ASSESSOR') {
    const ap = findRecord(db, 'assessorProfiles', (a) => a.userId === user.id);
    if (ap) {
      profileMeta = {
        assessorProfileId: ap.id,
        approvalStatus: ap.approvalStatus,
        approvedTradeIds: ap.approvedTradeIds,
      };
    }
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    city: user.city,
    status: user.status,
    createdAt: user.createdAt,
    ...profileMeta,
  };
}

function calculateWorkerCompletion(user: UserRecord, wp: InternalDatabaseSchema['workerProfiles'][number]): number {
  let score = 0;
  if (user.fullName) score += 15;
  if (user.city) score += 10;
  if (user.phone) score += 10;
  if (wp.selectedTradeId) score += 20;
  if (wp.yearsExperience > 0) score += 10;
  if (wp.bio && wp.bio.trim().length >= 20) score += 15;
  if (wp.skills.length > 0) score += 10;
  if (wp.avatarUrl) score += 10;
  return Math.min(100, score);
}

function searchWorkers(
  db: InternalDatabaseSchema,
  query: Record<string, string | number | undefined>,
  authUser: UserRecord | null
) {
  const q = typeof query.q === 'string' ? query.q.trim().toLowerCase() : '';
  const group = typeof query.group === 'string' ? query.group.trim().toLowerCase() : '';
  const trade = typeof query.trade === 'string' ? query.trade.trim() : '';
  const city = typeof query.city === 'string' ? query.city.trim().toLowerCase() : '';
  const province = typeof query.province === 'string' ? query.province.trim().toLowerCase() : '';
  const competencyId = typeof query.competencyId === 'string' ? query.competencyId.trim() : '';
  const level = typeof query.level === 'string' ? query.level.trim().toUpperCase() : '';
  const minExperience = Number(query.minExperience || 0);
  const minRating = Number(query.minRating || 0);
  const femaleOnly = query.femaleOnly === 'true' || query.femaleOnly === '1';
  const sort = typeof query.sort === 'string' ? query.sort : 'verified_desc';
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(36, Math.max(1, Number(query.limit || 9)));

  const nowMs = Date.now();
  const activeBadges = db.badges.filter((b) => b.status === 'ACTIVE' && new Date(b.expiresAt).getTime() > nowMs);
  const provinceCityMap = new Map(ALL_CITIES_FLAT.map((c) => [c.name.toLowerCase(), c.province.toLowerCase()]));

  let enriched = db.workerProfiles
    .map((wp) => {
      const user = findRecord(db, 'users', (u) => u.id === wp.userId);
      if (!user || !wp.isPublic || user.status !== 'ACTIVE') return null;
      const tradeObj = wp.selectedTradeId ? findRecord(db, 'trades', (t) => t.id === wp.selectedTradeId) : undefined;
      const catalogRef = getServiceBySlugOrId(tradeObj?.slug || wp.selectedTradeId);
      const badges = activeBadges
        .filter((b) => b.workerProfileId === wp.id)
        .map((b) => {
          const comp = findRecord(db, 'competencies', (c) => c.id === b.competencyId);
          return {
            id: b.id,
            competencyId: b.competencyId,
            competencyTitle: comp?.title || 'Competency',
            level: b.level,
            issuedAt: b.issuedAt,
            expiresAt: b.expiresAt,
          };
        });

      const rating = computeWorkerRatingSummary(db, wp.id);
      const trust = computeTrustScoreBreakdown(db, wp.id);

      return {
        id: wp.id,
        publicId: wp.publicId,
        passportId: ensureWorkerPassportId(wp),
        fullName: user.fullName,
        city: user.city,
        province: provinceCityMap.get(user.city.toLowerCase()) || '',
        tradeId: wp.selectedTradeId,
        tradeName: tradeObj?.name || 'Trade Not Selected',
        tradeUrduName: tradeObj?.urduName || catalogRef?.urduName || '',
        tradeGroup: tradeObj?.group || catalogRef?.group || '',
        tradeSlug: tradeObj?.slug || '',
        yearsExperience: wp.yearsExperience,
        bio: wp.bio,
        skills: wp.skills,
        avatarUrl: wp.avatarUrl,
        isFemaleProfessional: Boolean(wp.isFemaleProfessional),
        tier: wp.tier || 'NONE',
        tierStatus: wp.tierStatus || 'NONE',
        tierUnderReview: Boolean(wp.tierUnderReview),
        trustScore: trust.total,
        completedJobsCount: trust.metrics.completedJobs,
        ratingSummary: rating,
        verifiedCount: badges.length,
        verifiedBadges: badges,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (q) {
    enriched = enriched.filter(
      (w) =>
        w.fullName.toLowerCase().includes(q) ||
        w.tradeName.toLowerCase().includes(q) ||
        w.tradeGroup.toLowerCase().includes(q) ||
        w.city.toLowerCase().includes(q) ||
        w.bio.toLowerCase().includes(q) ||
        w.skills.some((s) => s.toLowerCase().includes(q)) ||
        w.verifiedBadges.some((b) => b.competencyTitle.toLowerCase().includes(q))
    );
  }
  if (group) {
    enriched = enriched.filter((w) => w.tradeGroup.toLowerCase() === group);
  }
  if (trade) {
    enriched = enriched.filter(
      (w) => w.tradeId === trade || w.tradeSlug === trade || w.tradeName.toLowerCase() === trade.toLowerCase()
    );
  }
  if (city) {
    enriched = enriched.filter((w) => w.city.toLowerCase().includes(city));
  }
  if (province) {
    enriched = enriched.filter((w) => w.province === province);
  }
  if (minExperience > 0) {
    enriched = enriched.filter((w) => w.yearsExperience >= minExperience);
  }
  if (minRating > 0) {
    enriched = enriched.filter((w) => w.ratingSummary.totalReviews > 0 && w.ratingSummary.rawAverage >= minRating);
  }
  if (femaleOnly) {
    enriched = enriched.filter((w) => w.isFemaleProfessional);
  }
  if (competencyId) {
    enriched = enriched.filter((w) => w.verifiedBadges.some((b) => b.competencyId === competencyId));
  }
  if (level && ['BASIC', 'COMPETENT', 'ADVANCED'].includes(level)) {
    enriched = enriched.filter((w) =>
      w.verifiedBadges.some((b) => (!competencyId || b.competencyId === competencyId) && b.level === level)
    );
  }

  enriched.sort((a, b) => {
    if (sort === 'top_rated') {
      return b.ratingSummary.bayesianRating - a.ratingSummary.bayesianRating || b.trustScore - a.trustScore;
    }
    if (sort === 'most_jobs') {
      return b.completedJobsCount - a.completedJobsCount || b.ratingSummary.bayesianRating - a.ratingSummary.bayesianRating;
    }
    if (sort === 'trust_desc') {
      return b.trustScore - a.trustScore || b.verifiedCount - a.verifiedCount;
    }
    if (sort === 'experience_desc') return b.yearsExperience - a.yearsExperience;
    if (sort === 'name_asc') return a.fullName.localeCompare(b.fullName);
    return b.verifiedCount - a.verifiedCount || b.trustScore - a.trustScore || b.yearsExperience - a.yearsExperience;
  });

  const total = enriched.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const offset = (page - 1) * limit;
  const items = enriched.slice(offset, offset + limit);

  let shortlistedIds: string[] = [];
  if (authUser?.role === 'EMPLOYER') {
    const emp = findRecord(db, 'employerProfiles', (e) => e.userId === authUser.id);
    if (emp) {
      shortlistedIds = db.shortlists.filter((s) => s.employerProfileId === emp.id).map((s) => s.workerProfileId);
    }
  }

  return {
    items: items.map((item) => ({
      ...item,
      isShortlisted: shortlistedIds.includes(item.id),
    })),
    pagination: { page, limit, total, totalPages },
  };
}

export async function dispatchLocalApiRequest(params: {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: any;
  queryParams?: Record<string, any>;
  activeToken: string | null;
}): Promise<{ data: any }> {
  const db = await ensureDbInitialized();
  if (expireOutdatedBadges(db)) {
    writeDb(db);
  }

  const [rawPath, rawQs] = params.url.split('?');
  const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const query: Record<string, string> = {};
  if (rawQs) {
    new URLSearchParams(rawQs).forEach((v, k) => {
      query[k] = v;
    });
  }
  if (params.queryParams) {
    for (const [k, v] of Object.entries(params.queryParams)) {
      if (v !== undefined && v !== null && String(v) !== '') {
        query[k] = String(v);
      }
    }
  }

  const method = params.method;
  const body = params.body;
  const authUser = getActiveAuthUser(db, params.activeToken);

  const v2Handled = await dispatchV2ApiRoute({
    db,
    method,
    path,
    query,
    body,
    authUser,
    activeToken: params.activeToken,
    ok,
    fail,
    requireAuthUser: (...roles: UserRole[]) => requireAuthUser(db, params.activeToken, ...roles),
  });
  if (v2Handled) {
    return v2Handled;
  }

  // ==================== AUTH ROUTES ====================
  if (method === 'POST' && path === '/auth/register') {
    const fullName = String(body?.fullName || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const phone = String(body?.phone || '').trim();
    const city = String(body?.city || '').trim();
    const role = String(body?.role || '').toUpperCase();
    const password = String(body?.password || '');
    const confirmPassword = String(body?.confirmPassword ?? password);
    const acceptedTerms = body?.acceptedTerms;

    if (fullName.length < 2) fail(400, 'Full name must be at least 2 characters.');
    if (!email || !email.includes('@')) fail(400, 'Enter a valid email address.');
    if (phone.length < 7) fail(400, 'Enter a valid phone number.');
    if (city.length < 2) fail(400, 'City is required.');
    if (!['WORKER', 'EMPLOYER', 'ASSESSOR'].includes(role)) {
      fail(400, 'Select Worker, Customer / Employer, or Assessor account role. Admin registration is not permitted.');
    }
    const pwErr = validatePasswordStrength(password);
    if (pwErr) fail(400, pwErr);
    if (password !== confirmPassword) fail(400, 'Passwords do not match.');
    if (acceptedTerms !== true) fail(400, 'You must accept the Terms and Privacy Policy.');

    if (findRecord(db, 'users', (u) => u.email === email)) {
      fail(409, 'An account with this email already exists.');
    }

    const { hash, salt } = await hashPassword(password);
    const now = new Date().toISOString();
    const userId = newId('usr');
    const typedRole = role as UserRole;

    const newUser: UserRecord = {
      id: userId,
      fullName,
      email,
      phone,
      passwordHash: hash,
      passwordSalt: salt,
      role: typedRole,
      city,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    insertRecord(db, 'users', newUser);

    if (typedRole === 'WORKER') {
      const wpId = newId('wrk');
      const selectedTradeId = typeof body?.selectedTradeId === 'string' && body.selectedTradeId ? body.selectedTradeId : null;
      insertRecord(db, 'workerProfiles', {
        id: wpId,
        userId,
        publicId: buildWorkerPublicSlug(fullName, db),
        passportId: ensureWorkerPassportId({ id: wpId, publicId: '' }),
        selectedTradeId,
        yearsExperience: 0,
        bio: '',
        skills: [],
        certificates: [],
        showCertificates: true,
        avatarUrl: '',
        isPublic: true,
        isFemaleProfessional: Boolean(body?.isFemaleProfessional),
        tier: 'NONE',
        tierStatus: 'NONE',
        tierIssuedAt: null,
        tierExpiresAt: null,
        tierUnderReview: false,
        createdAt: now,
        updatedAt: now,
      });
    } else if (typedRole === 'EMPLOYER') {
      const accountType = body?.accountType === 'BUSINESS' ? 'BUSINESS' : 'INDIVIDUAL';
      insertRecord(db, 'employerProfiles', {
        id: newId('emp'),
        userId,
        accountType,
        companyName: String(body?.companyName || '').trim(),
        industry: accountType === 'INDIVIDUAL' ? 'Homeowner / Individual Customer' : '',
        city,
        website: '',
        description: '',
        createdAt: now,
        updatedAt: now,
      });
    } else if (typedRole === 'ASSESSOR') {
      insertRecord(db, 'assessorProfiles', {
        id: newId('asr'),
        userId,
        approvalStatus: 'NOT_APPLIED',
        approvedTradeIds: [],
        appliedTradeIds: [],
        yearsExperience: 0,
        qualifications: '',
        bio: '',
        rejectionReason: '',
        appliedAt: null,
        reviewedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    appendAuditLog(db, {
      actorUserId: userId,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: userId,
      description: `New ${typedRole} registered: ${fullName} (${city}).`,
    });
    writeDb(db);

    const session = createSession(userId);
    return ok({
      accessToken: session.token,
      user: getSafeUserSummary(db, newUser),
    });
  }

  if (method === 'POST' && path === '/auth/login') {
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    if (!email || !password) fail(400, 'Enter email and password.');

    const user = findRecord(db, 'users', (u) => u.email === email);
    if (!user) fail(401, 'Invalid email or password.');

    const valid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!valid) fail(401, 'Invalid email or password.');

    if (user.status === 'SUSPENDED') {
      fail(403, 'This account has been suspended by an administrator.');
    }

    if (Array.isArray(body?.allowedRoles) && body.allowedRoles.length > 0 && !body.allowedRoles.includes(user.role)) {
      if (user.role === 'WORKER') {
        fail(403, 'This account is registered as a Karigar. Please use the Karigar login page.');
      }
      if (user.role === 'EMPLOYER') {
        fail(403, 'This account is registered as a Hirer. Please use the Hirer login page.');
      }
      fail(403, 'This account belongs to the Assessor / Admin portal.');
    }

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      description: `${user.fullName} (${user.role}) signed in.`,
    });
    writeDb(db);

    const session = createSession(user.id);
    return ok({
      accessToken: session.token,
      user: getSafeUserSummary(db, user),
    });
  }

  if (method === 'POST' && path === '/auth/refresh') {
    const session = getStoredSession();
    if (!session) fail(401, 'No active session.');
    const user = findRecord(db, 'users', (u) => u.id === session.userId);
    if (!user || user.status === 'SUSPENDED') {
      clearStoredSession();
      fail(401, 'Session invalid.');
    }
    return ok({
      accessToken: session.token,
      user: getSafeUserSummary(db, user),
    });
  }

  if (method === 'POST' && path === '/auth/logout') {
    clearStoredSession();
    return ok(undefined, 'Logged out successfully.');
  }

  if (method === 'GET' && path === '/auth/me') {
    const user = requireAuthUser(db, params.activeToken);
    return ok(getSafeUserSummary(db, user));
  }

  if (method === 'POST' && path === '/auth/forgot-password') {
    const email = String(body?.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) fail(400, 'Enter a valid email address.');
    return ok(
      undefined,
      'Password recovery request recorded locally. Because KARIGAR CONNECT runs self-contained in this browser without an external email server, contact your administrator or use the seeded demo credentials.'
    );
  }

  // ==================== PUBLIC ROUTES ====================
  if (method === 'GET' && path === '/public/trades') {
    const trades = db.trades
      .filter((t) => t.isActive)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => {
        const ref = getServiceBySlugOrId(t.slug || t.id);
        return {
          id: t.id,
          slug: t.slug,
          name: t.name,
          urduName: t.urduName,
          group: t.group || ref?.group || 'Home Repair & Maintenance',
          urduGroup: t.urduGroup || ref?.urduGroup || 'گھر کی مرمت اور دیکھ بھال',
          description: t.description,
          icon: t.icon,
          priceGuide: t.priceGuide?.length ? t.priceGuide : ref?.defaultPriceGuide || [],
          competencies: db.competencies
            .filter((c) => c.tradeId === t.id && c.isActive)
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((c) => ({
              id: c.id,
              tradeId: c.tradeId,
              slug: c.slug,
              title: c.title,
              urduTitle: c.urduTitle,
              description: c.description,
              orderIndex: c.orderIndex,
              criteria: db.rubricCriteria
                .filter((r) => r.competencyId === c.id)
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((r) => ({
                  id: r.id,
                  title: r.title,
                  description: r.description,
                  isSafetyCritical: r.isSafetyCritical,
                  maxScore: r.maxScore,
                })),
            })),
        };
      });
    return ok(trades);
  }

  if (method === 'GET' && path === '/public/workers/search') {
    return ok(searchWorkers(db, query, authUser));
  }

  if (method === 'GET' && path.startsWith('/workers/') && !path.startsWith('/workers/me')) {
    const publicId = decodeURIComponent(path.slice('/workers/'.length));
    const wp = findRecord(db, 'workerProfiles', (w) => w.publicId === publicId);
    const workerUser = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
    if (!wp || !workerUser || workerUser.status !== 'ACTIVE') {
      fail(404, 'Worker portfolio not found.');
    }

    const isOwner = authUser?.id === wp.userId;
    const isAdmin = authUser?.role === 'ADMIN';
    if (!wp.isPublic && !isOwner && !isAdmin) {
      fail(403, 'This worker profile is currently set to private.');
    }

    let contactPermissionStatus: 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' = 'NONE';
    let isShortlisted = false;
    let hasAcceptedJob = false;
    if (authUser?.role === 'EMPLOYER') {
      const emp = findRecord(db, 'employerProfiles', (e) => e.userId === authUser.id);
      if (emp) {
        const latestCr = db.contactRequests
          .filter((cr) => cr.employerProfileId === emp.id && cr.workerProfileId === wp.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        if (latestCr) contactPermissionStatus = latestCr.status;
        isShortlisted = db.shortlists.some((s) => s.employerProfileId === emp.id && s.workerProfileId === wp.id);
      }
      hasAcceptedJob = (db.jobs || []).some(
        (j) =>
          j.customerUserId === authUser.id &&
          j.workerProfileId === wp.id &&
          ['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED'].includes(j.status)
      );
    }

    const canViewContact = isOwner || isAdmin || contactPermissionStatus === 'ACCEPTED' || hasAcceptedJob;
    const trade = wp.selectedTradeId ? findRecord(db, 'trades', (t) => t.id === wp.selectedTradeId) : undefined;
    const catalogRef = getServiceBySlugOrId(trade?.slug || wp.selectedTradeId);
    const competencies = wp.selectedTradeId
      ? db.competencies
          .filter((c) => c.tradeId === wp.selectedTradeId && c.isActive)
          .sort((a, b) => a.orderIndex - b.orderIndex)
      : [];

    const nowMs = Date.now();
    const activeBadges = db.badges
      .filter((b) => b.workerProfileId === wp.id && b.status === 'ACTIVE' && new Date(b.expiresAt).getTime() > nowMs)
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

    const badgeByComp = new Map(activeBadges.map((b) => [b.competencyId, b]));
    const ratingSummary = computeWorkerRatingSummary(db, wp.id);
    const trustScoreBreakdown = computeTrustScoreBreakdown(db, wp.id);

    const visibleReviews = await Promise.all(
      (db.reviews || [])
        .filter((r) => r.workerProfileId === wp.id && !r.isHiddenByAdmin)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(async (r) => {
          const cu = findRecord(db, 'users', (u) => u.id === r.customerUserId);
          const job = findRecord(db, 'jobs', (j) => j.id === r.jobId);
          const photos = await Promise.all(
            (r.photos || []).map(async (p) => ({
              ...p,
              signedUrl: await getEvidencePreviewUrl(p.fileKey, p.seedAssetPath),
            }))
          );
          return {
            id: r.id,
            jobId: r.jobId,
            jobTitle: job?.title || 'Verified Job',
            jobCity: job?.city || '',
            customerName: cu?.fullName || 'Verified Customer',
            overallRating: r.overallRating,
            qualityRating: r.qualityRating,
            punctualityRating: r.punctualityRating,
            behaviourRating: r.behaviourRating,
            valueRating: r.valueRating,
            tags: r.tags,
            comment: r.comment,
            photos,
            workerReply: r.workerReply,
            workerRepliedAt: r.workerRepliedAt,
            createdAt: r.createdAt,
          };
        })
    );

    const confirmedWorkProof = await Promise.all(
      (db.jobs || [])
        .filter(
          (j) =>
            j.workerProfileId === wp.id &&
            j.status === 'COMPLETED' &&
            j.customerConfirmedProof &&
            (j.beforePhotos.length > 0 || j.afterPhotos.length > 0)
        )
        .sort((a, b) => new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime())
        .slice(0, 8)
        .map(async (j) => {
          const cu = findRecord(db, 'users', (u) => u.id === j.customerUserId);
          return {
            jobId: j.id,
            title: j.title,
            city: j.city,
            area: j.area,
            completedAt: j.completedAt,
            confirmedAt: j.customerConfirmedAt,
            confirmedByName: cu?.fullName || 'Customer',
            beforePhotos: await Promise.all(
              j.beforePhotos.map(async (p) => ({ ...p, signedUrl: await getEvidencePreviewUrl(p.fileKey, p.seedAssetPath) }))
            ),
            afterPhotos: await Promise.all(
              j.afterPhotos.map(async (p) => ({ ...p, signedUrl: await getEvidencePreviewUrl(p.fileKey, p.seedAssetPath) }))
            ),
          };
        })
    );

    return ok({
      id: wp.id,
      publicId: wp.publicId,
      passportId: ensureWorkerPassportId(wp),
      fullName: workerUser.fullName,
      city: workerUser.city,
      tradeId: wp.selectedTradeId,
      tradeName: trade?.name || 'Trade Not Selected',
      tradeUrduName: trade?.urduName || catalogRef?.urduName || '',
      tradeGroup: trade?.group || catalogRef?.group || '',
      priceGuide: trade?.priceGuide?.length ? trade.priceGuide : catalogRef?.defaultPriceGuide || [],
      yearsExperience: wp.yearsExperience,
      bio: wp.bio,
      skills: wp.skills,
      certificates: wp.showCertificates ? wp.certificates : [],
      avatarUrl: wp.avatarUrl,
      isPublic: wp.isPublic,
      isFemaleProfessional: Boolean(wp.isFemaleProfessional),
      tier: wp.tier || 'NONE',
      tierStatus: wp.tierStatus || 'NONE',
      tierIssuedAt: wp.tierIssuedAt || null,
      tierExpiresAt: wp.tierExpiresAt || null,
      tierUnderReview: Boolean(wp.tierUnderReview),
      trustScoreBreakdown,
      ratingSummary,
      completedJobsCount: trustScoreBreakdown.metrics.completedJobs,
      reviews: visibleReviews,
      confirmedWorkProof,
      contactPermissionStatus,
      isShortlisted,
      contactDetails: canViewContact ? { phone: workerUser.phone, email: workerUser.email } : null,
      competencies: competencies.map((c) => {
        const badge = badgeByComp.get(c.id);
        return {
          id: c.id,
          title: c.title,
          urduTitle: c.urduTitle,
          description: c.description,
          verified: Boolean(badge),
          level: badge?.level || null,
          issuedAt: badge?.issuedAt || null,
          expiresAt: badge?.expiresAt || null,
        };
      }),
      verifiedBadges: activeBadges.map((b) => {
        const comp = findRecord(db, 'competencies', (c) => c.id === b.competencyId);
        const bTrade = findRecord(db, 'trades', (t) => t.id === b.tradeId);
        const ap = findRecord(db, 'assessorProfiles', (a) => a.id === b.assessorProfileId);
        const asrUser = ap ? findRecord(db, 'users', (u) => u.id === ap.userId) : undefined;
        return {
          id: b.id,
          workerName: workerUser.fullName,
          tradeName: bTrade?.name || trade?.name || '',
          competencyId: b.competencyId,
          competencyTitle: comp?.title || 'Competency',
          level: b.level,
          assessorName: asrUser?.fullName || 'Authorized Assessor',
          issuedAt: b.issuedAt,
          expiresAt: b.expiresAt,
        };
      }),
    });
  }

  // ==================== WORKER ROUTES ====================
  if (method === 'GET' && path === '/workers/me') {
    const user = requireAuthUser(db, params.activeToken, 'WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    if (!wp) fail(404, 'Worker profile not found.');

    const trade = wp.selectedTradeId ? findRecord(db, 'trades', (t) => t.id === wp.selectedTradeId) : undefined;
    const totalCompetencies = wp.selectedTradeId
      ? db.competencies.filter((c) => c.tradeId === wp.selectedTradeId && c.isActive).length
      : 0;
    const nowMs = Date.now();
    const activeBadges = db.badges.filter(
      (b) => b.workerProfileId === wp.id && b.status === 'ACTIVE' && new Date(b.expiresAt).getTime() > nowMs
    );
    const reqIds = new Set(db.assessmentRequests.filter((r) => r.workerProfileId === wp.id).map((r) => r.id));
    const pendingAssessments = db.assessmentItems.filter((i) => reqIds.has(i.requestId) && i.status === 'PENDING').length;
    const evidenceUploaded = db.evidence.filter((e) => e.workerProfileId === wp.id).length;
    const expiringBadges = activeBadges.filter(
      (b) => new Date(b.expiresAt).getTime() <= nowMs + 30 * 86400000
    ).length;

    const recentActivity = db.auditLogs
      .filter((a) => a.actorUserId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map((a) => ({
        id: a.id,
        action: a.action,
        description: a.description,
        createdAt: a.createdAt,
      }));

    const trustScoreBreakdown = computeTrustScoreBreakdown(db, wp.id);
    const tierProgress = evaluateWorkerTierProgress(db, wp.id);
    const ratingSummary = computeWorkerRatingSummary(db, wp.id);
    const workerJobs = (db.jobs || []).filter((j) => j.workerProfileId === wp.id);
    const pendingJobRequestsCount = workerJobs.filter((j) => j.status === 'REQUESTED').length;
    const activeJobsCount = workerJobs.filter((j) => ['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'DISPUTED'].includes(j.status)).length;
    const completedJobsCount = workerJobs.filter((j) => j.status === 'COMPLETED').length;

    const recentReviews = (db.reviews || [])
      .filter((r) => r.workerProfileId === wp.id && !r.isHiddenByAdmin)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((r) => {
        const cu = findRecord(db, 'users', (u) => u.id === r.customerUserId);
        const job = findRecord(db, 'jobs', (j) => j.id === r.jobId);
        return {
          id: r.id,
          jobTitle: job?.title || 'Job',
          customerName: cu?.fullName || 'Customer',
          overallRating: r.overallRating,
          tags: r.tags,
          comment: r.comment,
          workerReply: r.workerReply,
          createdAt: r.createdAt,
        };
      });

    return ok({
      id: wp.id,
      userId: wp.userId,
      publicId: wp.publicId,
      passportId: ensureWorkerPassportId(wp),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      city: user.city,
      selectedTradeId: wp.selectedTradeId,
      tradeName: trade?.name || '',
      tradeUrduName: trade?.urduName || '',
      yearsExperience: wp.yearsExperience,
      bio: wp.bio,
      skills: wp.skills,
      certificates: wp.certificates,
      showCertificates: wp.showCertificates,
      avatarUrl: wp.avatarUrl,
      isPublic: wp.isPublic,
      isFemaleProfessional: Boolean(wp.isFemaleProfessional),
      tier: wp.tier || 'NONE',
      tierStatus: wp.tierStatus || 'NONE',
      tierIssuedAt: wp.tierIssuedAt || null,
      tierExpiresAt: wp.tierExpiresAt || null,
      tierUnderReview: Boolean(wp.tierUnderReview),
      trustScoreBreakdown,
      tierProgress,
      ratingSummary,
      recentReviews,
      profileCompletion: calculateWorkerCompletion(user, wp),
      stats: {
        totalCompetencies,
        verifiedCompetencies: activeBadges.length,
        pendingAssessments,
        evidenceUploaded,
        expiringBadges,
        pendingJobRequestsCount,
        activeJobsCount,
        completedJobsCount,
      },
      recentActivity,
    });
  }

  if (method === 'PUT' && path === '/workers/me') {
    const user = requireAuthUser(db, params.activeToken, 'WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    if (!wp) fail(404, 'Worker profile not found.');

    const fullName = String(body?.fullName || '').trim();
    const city = String(body?.city || '').trim();
    const phone = String(body?.phone || '').trim();
    if (fullName.length < 2 || city.length < 2 || phone.length < 7) {
      fail(400, 'Valid full name, city, and phone are required.');
    }

    const selectedTradeId = body?.selectedTradeId ?? null;
    if (selectedTradeId) {
      const tradeExists = findRecord(db, 'trades', (t) => t.id === selectedTradeId && t.isActive);
      if (!tradeExists) fail(400, 'Selected trade does not exist or is inactive.');
    }

    const yearsExperience = Math.max(0, Math.min(60, Math.round(Number(body?.yearsExperience || 0))));
    const now = new Date().toISOString();
    user.fullName = fullName;
    user.city = city;
    user.phone = phone;
    user.updatedAt = now;

    wp.selectedTradeId = selectedTradeId;
    wp.yearsExperience = yearsExperience;
    wp.bio = String(body?.bio || '').trim().slice(0, 1000);
    wp.skills = Array.isArray(body?.skills) ? body.skills.map((s: any) => String(s).trim()).filter(Boolean).slice(0, 20) : [];
    wp.certificates = Array.isArray(body?.certificates) ? body.certificates.slice(0, 10) : [];
    wp.showCertificates = Boolean(body?.showCertificates ?? true);
    wp.isPublic = Boolean(body?.isPublic ?? true);
    if (body?.isFemaleProfessional !== undefined) {
      wp.isFemaleProfessional = Boolean(body.isFemaleProfessional);
    }
    if (typeof body?.avatarUrl === 'string') {
      const trimmedAvatar = body.avatarUrl.trim();
      wp.avatarUrl = trimmedAvatar.startsWith('/src/assets/images/')
        ? trimmedAvatar.replace('/src/assets/images/', '/images/')
        : trimmedAvatar;
    }
    wp.updatedAt = now;

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'WORKER_PROFILE_UPDATED',
      entityType: 'WorkerProfile',
      entityId: wp.id,
      description: `${fullName} updated worker profile and privacy preferences.`,
    });
    writeDb(db);
    return ok(undefined, 'Profile updated successfully.');
  }

  if (method === 'GET' && path === '/workers/me/competencies') {
    const user = requireAuthUser(db, params.activeToken, 'WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    if (!wp) fail(404, 'Worker profile not found.');

    if (!wp.selectedTradeId) {
      return ok({ trade: null, competencies: [] });
    }

    const trade = findRecord(db, 'trades', (t) => t.id === wp.selectedTradeId);
    const competencies = db.competencies
      .filter((c) => c.tradeId === wp.selectedTradeId && c.isActive)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const workerReqIds = new Set(db.assessmentRequests.filter((r) => r.workerProfileId === wp.id).map((r) => r.id));
    const latestItems = db.assessmentItems
      .filter((i) => workerReqIds.has(i.requestId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const badges = db.badges
      .filter((b) => b.workerProfileId === wp.id)
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

    const matrix = competencies.map((comp) => {
      const evCount = db.evidence.filter((e) => e.workerProfileId === wp.id && e.competencyId === comp.id).length;
      const latestItem = latestItems.find((i) => i.competencyId === comp.id);
      const activeBadge = badges.find((b) => b.competencyId === comp.id && b.status === 'ACTIVE');
      const expiredBadge = !activeBadge ? badges.find((b) => b.competencyId === comp.id && b.status === 'EXPIRED') : undefined;

      let matrixStatus: 'NOT_STARTED' | 'EVIDENCE_ADDED' | 'UNDER_REVIEW' | 'VERIFIED' | 'NEEDS_MORE_EVIDENCE' | 'EXPIRED' =
        'NOT_STARTED';
      if (activeBadge) matrixStatus = 'VERIFIED';
      else if (expiredBadge) matrixStatus = 'EXPIRED';
      else if (latestItem?.status === 'PENDING') matrixStatus = 'UNDER_REVIEW';
      else if (latestItem?.status === 'NEEDS_MORE_EVIDENCE' || latestItem?.status === 'NOT_VERIFIED')
        matrixStatus = 'NEEDS_MORE_EVIDENCE';
      else if (evCount > 0) matrixStatus = 'EVIDENCE_ADDED';

      const latestAssessor = latestItem?.assessorProfileId
        ? findRecord(db, 'assessorProfiles', (a) => a.id === latestItem.assessorProfileId)
        : undefined;
      const latestAssessorUser = latestAssessor ? findRecord(db, 'users', (u) => u.id === latestAssessor.userId) : undefined;

      const shownBadge = activeBadge || expiredBadge;
      const badgeAssessor = shownBadge ? findRecord(db, 'assessorProfiles', (a) => a.id === shownBadge.assessorProfileId) : undefined;
      const badgeAssessorUser = badgeAssessor ? findRecord(db, 'users', (u) => u.id === badgeAssessor.userId) : undefined;

      return {
        id: comp.id,
        slug: comp.slug,
        title: comp.title,
        urduTitle: comp.urduTitle,
        description: comp.description,
        matrixStatus,
        evidenceCount: evCount,
        latestAssessment: latestItem
          ? {
              id: latestItem.id,
              status: latestItem.status,
              totalScore: latestItem.totalScore,
              maxScore: latestItem.maxScore,
              percentage: latestItem.percentage,
              level: latestItem.level,
              feedback: latestItem.feedback,
              assessorName: latestAssessorUser?.fullName || null,
              assessedAt: latestItem.assessedAt,
            }
          : null,
        badge: shownBadge
          ? {
              id: shownBadge.id,
              level: shownBadge.level,
              status: shownBadge.status,
              issuedAt: shownBadge.issuedAt,
              expiresAt: shownBadge.expiresAt,
              assessorName: badgeAssessorUser?.fullName || 'Authorized Assessor',
            }
          : null,
      };
    });

    return ok({
      trade: trade ? { id: trade.id, name: trade.name, urduName: trade.urduName, description: trade.description } : null,
      competencies: matrix,
    });
  }

  if (method === 'GET' && path === '/workers/me/evidence') {
    const user = requireAuthUser(db, params.activeToken, 'WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    if (!wp) fail(404, 'Worker profile not found.');

    const compFilter = query.competencyId || '';
    const rows = db.evidence
      .filter((e) => e.workerProfileId === wp.id && (!compFilter || e.competencyId === compFilter))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const items = await Promise.all(
      rows.map(async (r) => {
        const comp = findRecord(db, 'competencies', (c) => c.id === r.competencyId);
        return {
          id: r.id,
          competencyId: r.competencyId,
          competencyTitle: comp?.title || 'Competency',
          title: r.title,
          description: r.description,
          fileType: r.fileType,
          mimeType: r.mimeType,
          fileSize: r.fileSize,
          originalName: r.originalName,
          status: r.status,
          createdAt: r.createdAt,
          signedUrl: await getEvidencePreviewUrl(r.fileKey, r.seedAssetPath),
        };
      })
    );
    return ok(items);
  }

  if (method === 'POST' && path === '/workers/me/evidence') {
    const user = requireAuthUser(db, params.activeToken, 'WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    if (!wp) fail(404, 'Worker profile not found.');

    if (!(body instanceof FormData)) {
      fail(400, 'Multipart form data with files is required.');
    }

    const competencyId = String(body.get('competencyId') || '').trim();
    const title = String(body.get('title') || '').trim();
    const description = String(body.get('description') || '').trim();
    const files = body.getAll('files').filter((f): f is File => f instanceof File);

    if (!competencyId) fail(400, 'Competency is required.');
    if (title.length < 3) fail(400, 'Title must be at least 3 characters.');
    if (description.length < 5) fail(400, 'Description must be at least 5 characters.');

    const fileError = validateEvidenceFiles(files);
    if (fileError) fail(400, fileError);

    const comp = findRecord(db, 'competencies', (c) => c.id === competencyId && c.isActive);
    if (!comp || comp.tradeId !== wp.selectedTradeId) {
      fail(400, 'Competency does not belong to your selected trade.');
    }

    const now = new Date().toISOString();
    const created: any[] = [];
    for (const file of files) {
      const id = newId('ev');
      const fileKey = `evfile_${wp.id}_${id}`;
      await saveEvidenceFile(fileKey, file, {
        mimeType: file.type,
        originalName: file.name,
      });
      const fileType = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
      insertRecord(db, 'evidence', {
        id,
        workerProfileId: wp.id,
        competencyId: comp.id,
        title,
        description,
        fileType,
        mimeType: file.type,
        fileSize: file.size,
        fileKey,
        originalName: file.name,
        status: 'PRIVATE',
        createdAt: now,
        updatedAt: now,
      });
      created.push({
        id,
        competencyId: comp.id,
        title,
        fileType,
        signedUrl: await getEvidencePreviewUrl(fileKey),
      });
    }

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'EVIDENCE_UPLOADED',
      entityType: 'Evidence',
      entityId: created[0].id,
      description: `${user.fullName} uploaded ${files.length} private evidence file(s) for ${comp.title}.`,
    });
    writeDb(db);
    return ok(created);
  }

  if (method === 'DELETE' && path.startsWith('/workers/me/evidence/')) {
    const user = requireAuthUser(db, params.activeToken, 'WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    if (!wp) fail(404, 'Worker profile not found.');

    const evId = path.slice('/workers/me/evidence/'.length);
    const ev = findRecord(db, 'evidence', (e) => e.id === evId);
    if (!ev || ev.workerProfileId !== wp.id) fail(404, 'Evidence item not found.');
    if (ev.status === 'APPROVED') fail(400, 'Approved evidence used for a badge cannot be deleted.');

    await deleteEvidenceFile(ev.fileKey);
    deleteRecordsWhere(db, 'evidence', (e) => e.id === ev.id);
    writeDb(db);
    return ok(undefined, 'Evidence removed.');
  }

  if (method === 'POST' && path === '/workers/me/verification-requests') {
    const user = requireAuthUser(db, params.activeToken, 'WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    if (!wp || !wp.selectedTradeId) {
      fail(400, 'Select a trade in your profile before requesting verification.');
    }

    const compIds: string[] = Array.isArray(body?.competencyIds)
      ? Array.from(new Set<string>(body.competencyIds.map((c: any) => String(c))))
      : [];
    if (compIds.length === 0) fail(400, 'Select at least one competency.');

    const workerReqIds = new Set(db.assessmentRequests.filter((r) => r.workerProfileId === wp.id).map((r) => r.id));

    for (const compId of compIds) {
      const comp = findRecord(db, 'competencies', (c) => c.id === compId && c.isActive);
      if (!comp || comp.tradeId !== wp.selectedTradeId) {
        fail(400, 'Selected competency is invalid for your active trade.');
      }
      const evCount = db.evidence.filter((e) => e.workerProfileId === wp.id && e.competencyId === compId).length;
      if (evCount === 0) {
        fail(400, `Cannot request verification for "${comp.title}" without uploaded evidence.`);
      }
      const pendingExists = db.assessmentItems.some(
        (i) => workerReqIds.has(i.requestId) && i.competencyId === compId && i.status === 'PENDING'
      );
      if (pendingExists) {
        fail(409, `A verification request for "${comp.title}" is already under review.`);
      }
    }

    const now = new Date().toISOString();
    const requestId = newId('req');
    insertRecord(db, 'assessmentRequests', {
      id: requestId,
      workerProfileId: wp.id,
      tradeId: wp.selectedTradeId,
      status: 'PENDING',
      requestedAt: now,
      completedAt: null,
      updatedAt: now,
    });

    for (const compId of compIds) {
      insertRecord(db, 'assessmentItems', {
        id: newId('item'),
        requestId,
        competencyId: compId,
        assessorProfileId: null,
        status: 'PENDING',
        totalScore: 0,
        maxScore: 0,
        percentage: 0,
        level: null,
        feedback: '',
        assessedAt: null,
        isAppealed: false,
        appealReason: '',
        appealStatus: 'NONE',
        appealedFromItemId: null,
        createdAt: now,
        updatedAt: now,
      });
      for (const ev of db.evidence) {
        if (ev.workerProfileId === wp.id && ev.competencyId === compId && (ev.status === 'PRIVATE' || ev.status === 'NEEDS_REVISION')) {
          ev.status = 'SUBMITTED';
          ev.updatedAt = now;
        }
      }
    }

    const approvedAssessors = db.assessorProfiles.filter(
      (ap) => ap.approvalStatus === 'APPROVED' && ap.approvedTradeIds.includes(wp.selectedTradeId!)
    );
    for (const asr of approvedAssessors) {
      appendNotification(db, {
        userId: asr.userId,
        type: 'NEW_VERIFICATION_REQUEST',
        title: `New Assessment Request: ${user.fullName}`,
        message: `${user.fullName} submitted ${compIds.length} competency item(s) for verification.`,
        link: `/assessor/queue/${requestId}`,
      });
    }

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'VERIFICATION_REQUESTED',
      entityType: 'AssessmentRequest',
      entityId: requestId,
      description: `${user.fullName} requested verification for ${compIds.length} competency item(s).`,
    });
    writeDb(db);
    return ok({ requestId }, 'Verification request submitted to assessor queue.');
  }

  if (method === 'GET' && path === '/workers/me/assessments') {
    const user = requireAuthUser(db, params.activeToken, 'WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    if (!wp) fail(404, 'Worker profile not found.');

    const reqMap = new Map(db.assessmentRequests.filter((r) => r.workerProfileId === wp.id).map((r) => [r.id, r]));
    const items = db.assessmentItems
      .filter((i) => reqMap.has(i.requestId))
      .sort((a, b) => {
        const ra = reqMap.get(a.requestId)!;
        const rb = reqMap.get(b.requestId)!;
        return new Date(rb.requestedAt).getTime() - new Date(ra.requestedAt).getTime();
      })
      .map((item) => {
        const reqObj = reqMap.get(item.requestId)!;
        const trade = findRecord(db, 'trades', (t) => t.id === reqObj.tradeId);
        const comp = findRecord(db, 'competencies', (c) => c.id === item.competencyId);
        const ap = item.assessorProfileId ? findRecord(db, 'assessorProfiles', (a) => a.id === item.assessorProfileId) : undefined;
        const asrUser = ap ? findRecord(db, 'users', (u) => u.id === ap.userId) : undefined;
        const badge = findRecord(db, 'badges', (b) => b.assessmentItemId === item.id);
        const scores = db.assessmentScores
          .filter((s) => s.assessmentItemId === item.id)
          .map((s) => {
            const crit = findRecord(db, 'rubricCriteria', (rc) => rc.id === s.criterionId);
            return {
              criterionTitle: crit?.title || 'Criterion',
              isSafetyCritical: crit?.isSafetyCritical || false,
              score: s.score,
              maxScore: crit?.maxScore || 3,
              comment: s.comment,
            };
          });

        return {
          id: item.id,
          requestId: item.requestId,
          competencyId: item.competencyId,
          competencyTitle: comp?.title || 'Competency',
          tradeName: trade?.name || '',
          status: item.status,
          totalScore: item.totalScore,
          maxScore: item.maxScore,
          percentage: item.percentage,
          level: item.level,
          feedback: item.feedback,
          assessorName: asrUser?.fullName || null,
          requestedAt: reqObj.requestedAt,
          assessedAt: item.assessedAt,
          isAppealed: item.isAppealed,
          appealStatus: item.appealStatus,
          badge: badge ? { id: badge.id, expiresAt: badge.expiresAt, status: badge.status } : null,
          scores,
        };
      });

    return ok(items);
  }

  if (method === 'POST' && path.startsWith('/workers/me/assessments/') && path.endsWith('/appeal')) {
    const user = requireAuthUser(db, params.activeToken, 'WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    if (!wp) fail(404, 'Worker profile not found.');

    const itemId = path.slice('/workers/me/assessments/'.length, -'/appeal'.length);
    const reason = String(body?.reason || '').trim();
    if (reason.length < 10) fail(400, 'Explain why you are appealing (minimum 10 characters).');

    const item = findRecord(db, 'assessmentItems', (i) => i.id === itemId);
    const reqObj = item ? findRecord(db, 'assessmentRequests', (r) => r.id === item.requestId) : undefined;
    if (!item || !reqObj || reqObj.workerProfileId !== wp.id) {
      fail(404, 'Assessment record not found.');
    }
    if (item.status === 'PENDING' || item.status === 'VERIFIED') {
      fail(400, 'Only completed non-verified assessments can be appealed.');
    }
    if (item.isAppealed) {
      fail(409, 'An appeal has already been submitted for this assessment.');
    }

    const comp = findRecord(db, 'competencies', (c) => c.id === item.competencyId);
    const now = new Date().toISOString();
    const appealReqId = newId('req');
    const appealItemId = newId('item');

    item.isAppealed = true;
    item.appealReason = reason;
    item.appealStatus = 'PENDING';
    item.updatedAt = now;

    insertRecord(db, 'assessmentRequests', {
      id: appealReqId,
      workerProfileId: wp.id,
      tradeId: reqObj.tradeId,
      status: 'PENDING',
      requestedAt: now,
      completedAt: null,
      updatedAt: now,
    });

    insertRecord(db, 'assessmentItems', {
      id: appealItemId,
      requestId: appealReqId,
      competencyId: item.competencyId,
      assessorProfileId: null,
      status: 'PENDING',
      totalScore: 0,
      maxScore: 0,
      percentage: 0,
      level: null,
      feedback: '',
      assessedAt: null,
      isAppealed: false,
      appealReason: reason,
      appealStatus: 'NONE',
      appealedFromItemId: item.id,
      createdAt: now,
      updatedAt: now,
    });

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'ASSESSMENT_APPEALED',
      entityType: 'AssessmentItem',
      entityId: item.id,
      description: `${user.fullName} appealed assessment for ${comp?.title || 'Competency'}. Assigned for independent review.`,
    });
    writeDb(db);
    return ok(undefined, 'Appeal submitted for review by a different assessor.');
  }

  if (method === 'GET' && path === '/workers/me/badges') {
    const user = requireAuthUser(db, params.activeToken, 'WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    if (!wp) fail(404, 'Worker profile not found.');

    const badges = db.badges
      .filter((b) => b.workerProfileId === wp.id)
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
      .map((b) => {
        const comp = findRecord(db, 'competencies', (c) => c.id === b.competencyId);
        const trade = findRecord(db, 'trades', (t) => t.id === b.tradeId);
        const ap = findRecord(db, 'assessorProfiles', (a) => a.id === b.assessorProfileId);
        const asrUser = ap ? findRecord(db, 'users', (u) => u.id === ap.userId) : undefined;
        return {
          id: b.id,
          workerName: user.fullName,
          tradeName: trade?.name || '',
          competencyId: b.competencyId,
          competencyTitle: comp?.title || 'Competency',
          level: b.level,
          assessorName: asrUser?.fullName || 'Authorized Assessor',
          issuedAt: b.issuedAt,
          expiresAt: b.expiresAt,
          status: b.status,
        };
      });
    return ok(badges);
  }

  // ==================== EMPLOYER ROUTES ====================
  if (method === 'GET' && path === '/employers/me') {
    const user = requireAuthUser(db, params.activeToken, 'EMPLOYER');
    const emp = findRecord(db, 'employerProfiles', (e) => e.userId === user.id);
    if (!emp) fail(404, 'Employer profile not found.');

    const totalAvailableWorkers = db.workerProfiles.filter((wp) => {
      const wu = findRecord(db, 'users', (u) => u.id === wp.userId);
      return wp.isPublic && wu?.status === 'ACTIVE';
    }).length;
    const savedWorkers = db.shortlists.filter((s) => s.employerProfileId === emp.id).length;
    const pendingContactRequests = db.contactRequests.filter(
      (c) => c.employerProfileId === emp.id && c.status === 'PENDING'
    ).length;
    const acceptedContactRequests = db.contactRequests.filter(
      (c) => c.employerProfileId === emp.id && c.status === 'ACCEPTED'
    ).length;

    const recentShortlist = db.shortlists
      .filter((s) => s.employerProfileId === emp.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
      .map((s) => {
        const wp = findRecord(db, 'workerProfiles', (w) => w.id === s.workerProfileId);
        const wu = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
        const trade = wp?.selectedTradeId ? findRecord(db, 'trades', (t) => t.id === wp.selectedTradeId) : undefined;
        return wp && wu
          ? {
              id: s.id,
              publicId: wp.publicId,
              fullName: wu.fullName,
              city: wu.city,
              tradeName: trade?.name || 'Trade Not Selected',
              yearsExperience: wp.yearsExperience,
              avatarUrl: wp.avatarUrl,
            }
          : null;
      })
      .filter(Boolean);

    const customerJobs = (db.jobs || []).filter((j) => j.customerUserId === user.id);
    const activeJobsCount = customerJobs.filter((j) =>
      ['REQUESTED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'DISPUTED'].includes(j.status)
    ).length;
    const completedJobsCount = customerJobs.filter((j) => j.status === 'COMPLETED').length;
    const reviewedJobIds = new Set((db.reviews || []).map((r) => r.jobId));
    const pendingReviewJobs = customerJobs
      .filter((j) => j.status === 'COMPLETED' && !reviewedJobIds.has(j.id))
      .slice(0, 5)
      .map((j) => {
        const wp = findRecord(db, 'workerProfiles', (w) => w.id === j.workerProfileId);
        const wu = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
        return {
          jobId: j.id,
          title: j.title,
          workerName: wu?.fullName || 'Worker',
          completedAt: j.completedAt,
        };
      });

    return ok({
      id: emp.id,
      userId: emp.userId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      accountType: emp.accountType || (emp.companyName ? 'BUSINESS' : 'INDIVIDUAL'),
      companyName: emp.companyName,
      industry: emp.industry,
      city: emp.city || user.city,
      website: emp.website,
      description: emp.description,
      stats: {
        totalAvailableWorkers,
        savedWorkers,
        pendingContactRequests,
        acceptedContactRequests,
        activeJobsCount,
        completedJobsCount,
        pendingReviewsCount: pendingReviewJobs.length,
      },
      pendingReviewJobs,
      recentShortlist,
    });
  }

  if (method === 'PUT' && path === '/employers/me') {
    const user = requireAuthUser(db, params.activeToken, 'EMPLOYER');
    const emp = findRecord(db, 'employerProfiles', (e) => e.userId === user.id);
    if (!emp) fail(404, 'Customer profile not found.');

    const fullName = String(body?.fullName || '').trim();
    const city = String(body?.city || '').trim();
    const phone = String(body?.phone || '').trim();
    const accountType = body?.accountType === 'BUSINESS' ? 'BUSINESS' : 'INDIVIDUAL';
    const companyName = String(body?.companyName || '').trim();
    if (fullName.length < 2 || city.length < 2 || phone.length < 7) {
      fail(400, 'Full name, city, and phone are required.');
    }
    if (accountType === 'BUSINESS' && companyName.length < 2) {
      fail(400, 'Company name is required for business employer accounts.');
    }

    const now = new Date().toISOString();
    user.fullName = fullName;
    user.city = city;
    user.phone = phone;
    user.updatedAt = now;

    emp.accountType = accountType;
    emp.companyName = companyName;
    emp.industry = String(body?.industry || '').trim();
    emp.city = city;
    emp.website = String(body?.website || '').trim();
    emp.description = String(body?.description || '').trim();
    emp.updatedAt = now;

    writeDb(db);
    return ok(undefined, 'Customer / Employer profile updated.');
  }

  if (method === 'GET' && path === '/employers/search') {
    const user = requireAuthUser(db, params.activeToken, 'EMPLOYER');
    return ok(searchWorkers(db, query, user));
  }

  if (method === 'GET' && path === '/employers/shortlists') {
    const user = requireAuthUser(db, params.activeToken, 'EMPLOYER');
    const emp = findRecord(db, 'employerProfiles', (e) => e.userId === user.id);
    if (!emp) fail(404, 'Employer profile not found.');

    const nowMs = Date.now();
    const rows = db.shortlists
      .filter((s) => s.employerProfileId === emp.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((s) => {
        const wp = findRecord(db, 'workerProfiles', (w) => w.id === s.workerProfileId);
        const wu = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
        if (!wp || !wu || wu.status !== 'ACTIVE') return null;
        const trade = wp.selectedTradeId ? findRecord(db, 'trades', (t) => t.id === wp.selectedTradeId) : undefined;
        const verifiedCount = db.badges.filter(
          (b) => b.workerProfileId === wp.id && b.status === 'ACTIVE' && new Date(b.expiresAt).getTime() > nowMs
        ).length;
        return {
          id: s.id,
          workerProfileId: wp.id,
          publicId: wp.publicId,
          fullName: wu.fullName,
          city: wu.city,
          tradeName: trade?.name || 'Trade Not Selected',
          yearsExperience: wp.yearsExperience,
          verifiedCount,
          avatarUrl: wp.avatarUrl,
          notes: s.notes,
          createdAt: s.createdAt,
        };
      })
      .filter(Boolean);

    return ok(rows);
  }

  if (method === 'POST' && path === '/employers/shortlists') {
    const user = requireAuthUser(db, params.activeToken, 'EMPLOYER');
    const emp = findRecord(db, 'employerProfiles', (e) => e.userId === user.id);
    if (!emp) fail(404, 'Employer profile not found.');

    const workerProfileId = String(body?.workerProfileId || '').trim();
    const wp = findRecord(db, 'workerProfiles', (w) => w.id === workerProfileId && w.isPublic);
    if (!wp) fail(404, 'Public worker profile not found.');

    if (db.shortlists.some((s) => s.employerProfileId === emp.id && s.workerProfileId === workerProfileId)) {
      fail(409, 'This worker is already in your shortlist.');
    }

    const now = new Date().toISOString();
    const id = newId('shl');
    insertRecord(db, 'shortlists', {
      id,
      employerProfileId: emp.id,
      workerProfileId,
      notes: String(body?.notes || '').trim().slice(0, 500),
      createdAt: now,
      updatedAt: now,
    });
    writeDb(db);
    return ok({ id }, 'Worker added to shortlist.');
  }

  if (method === 'PATCH' && path.startsWith('/employers/shortlists/')) {
    const user = requireAuthUser(db, params.activeToken, 'EMPLOYER');
    const emp = findRecord(db, 'employerProfiles', (e) => e.userId === user.id);
    if (!emp) fail(404, 'Employer profile not found.');

    const id = path.slice('/employers/shortlists/'.length);
    const row = findRecord(db, 'shortlists', (s) => s.id === id && s.employerProfileId === emp.id);
    if (!row) fail(404, 'Shortlist entry not found.');

    row.notes = String(body?.notes || '').trim().slice(0, 500);
    row.updatedAt = new Date().toISOString();
    writeDb(db);
    return ok(undefined, 'Shortlist note saved.');
  }

  if (method === 'DELETE' && path.startsWith('/employers/shortlists/')) {
    const user = requireAuthUser(db, params.activeToken, 'EMPLOYER');
    const emp = findRecord(db, 'employerProfiles', (e) => e.userId === user.id);
    if (!emp) fail(404, 'Employer profile not found.');

    const idOrWorker = path.slice('/employers/shortlists/'.length);
    const deleted = deleteRecordsWhere(
      db,
      'shortlists',
      (s) => s.employerProfileId === emp.id && (s.id === idOrWorker || s.workerProfileId === idOrWorker)
    );
    if (deleted === 0) fail(404, 'Shortlist entry not found.');
    writeDb(db);
    return ok(undefined, 'Worker removed from shortlist.');
  }

  if (method === 'POST' && path === '/employers/contact-requests') {
    const user = requireAuthUser(db, params.activeToken, 'EMPLOYER');
    const emp = findRecord(db, 'employerProfiles', (e) => e.userId === user.id);
    if (!emp) fail(404, 'Employer profile not found.');

    const workerProfileId = String(body?.workerProfileId || '').trim();
    const wp = findRecord(db, 'workerProfiles', (w) => w.id === workerProfileId);
    const wu = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
    if (!wp || !wu || !wp.isPublic || wu.status !== 'ACTIVE') {
      fail(404, 'Worker profile is unavailable.');
    }

    const exists = db.contactRequests.some(
      (cr) =>
        cr.employerProfileId === emp.id &&
        cr.workerProfileId === wp.id &&
        (cr.status === 'PENDING' || cr.status === 'ACCEPTED')
    );
    if (exists) {
      fail(409, 'You already have an active or accepted contact request with this worker.');
    }

    const now = new Date().toISOString();
    const id = newId('cr');
    insertRecord(db, 'contactRequests', {
      id,
      employerProfileId: emp.id,
      workerProfileId: wp.id,
      message: String(body?.message || '').trim().slice(0, 600),
      status: 'PENDING',
      createdAt: now,
      respondedAt: null,
      updatedAt: now,
    });

    appendNotification(db, {
      userId: wu.id,
      type: 'CONTACT_REQUEST_RECEIVED',
      title: `New Contact Request from ${emp.companyName || user.fullName}`,
      message: 'An employer would like to view your contact details. Accept or decline from your Contact Requests page.',
      link: '/worker/requests',
    });

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'CONTACT_REQUEST_SENT',
      entityType: 'ContactRequest',
      entityId: id,
      description: `${emp.companyName || user.fullName} sent a contact request to ${wu.fullName}.`,
    });
    writeDb(db);
    return ok({ id }, 'Contact request sent. Private phone and email remain hidden until the worker accepts.');
  }

  // ==================== CONTACT REQUESTS ====================
  if (method === 'GET' && path === '/contact-requests') {
    const user = requireAuthUser(db, params.activeToken, 'WORKER', 'EMPLOYER');

    if (user.role === 'WORKER') {
      const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
      if (!wp) fail(404, 'Worker profile not found.');

      const items = db.contactRequests
        .filter((cr) => cr.workerProfileId === wp.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((cr) => {
          const ep = findRecord(db, 'employerProfiles', (e) => e.id === cr.employerProfileId);
          const eu = ep ? findRecord(db, 'users', (u) => u.id === ep.userId) : undefined;
          return {
            id: cr.id,
            employerProfileId: cr.employerProfileId,
            employerName: eu?.fullName || 'Employer',
            companyName: ep?.companyName || eu?.fullName || 'Company',
            industry: ep?.industry || '',
            city: ep?.city || eu?.city || '',
            message: cr.message,
            status: cr.status,
            createdAt: cr.createdAt,
            respondedAt: cr.respondedAt,
            employerContact: cr.status === 'ACCEPTED' && eu ? { email: eu.email, phone: eu.phone } : null,
          };
        });
      return ok(items);
    }

    const ep = findRecord(db, 'employerProfiles', (e) => e.userId === user.id);
    if (!ep) fail(404, 'Employer profile not found.');

    const items = db.contactRequests
      .filter((cr) => cr.employerProfileId === ep.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((cr) => {
        const wp = findRecord(db, 'workerProfiles', (w) => w.id === cr.workerProfileId);
        const wu = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
        const trade = wp?.selectedTradeId ? findRecord(db, 'trades', (t) => t.id === wp.selectedTradeId) : undefined;
        return {
          id: cr.id,
          workerProfileId: cr.workerProfileId,
          workerPublicId: wp?.publicId || '',
          workerName: wu?.fullName || 'Worker',
          workerCity: wu?.city || '',
          tradeName: trade?.name || 'Trade Not Selected',
          avatarUrl: wp?.avatarUrl || '',
          message: cr.message,
          status: cr.status,
          createdAt: cr.createdAt,
          respondedAt: cr.respondedAt,
          contactDetails:
            cr.status === 'ACCEPTED' && wu
              ? { phone: wu.phone, email: wu.email }
              : null,
        };
      });
    return ok(items);
  }

  if (method === 'PATCH' && path.startsWith('/contact-requests/')) {
    const user = requireAuthUser(db, params.activeToken, 'WORKER');
    const wp = findRecord(db, 'workerProfiles', (w) => w.userId === user.id);
    if (!wp) fail(404, 'Worker profile not found.');

    const id = path.slice('/contact-requests/'.length);
    const status = String(body?.status || '').toUpperCase();
    if (status !== 'ACCEPTED' && status !== 'DECLINED') {
      fail(400, 'Status must be ACCEPTED or DECLINED.');
    }

    const cr = findRecord(db, 'contactRequests', (c) => c.id === id && c.workerProfileId === wp.id);
    if (!cr) fail(404, 'Contact request not found.');
    if (cr.status !== 'PENDING') fail(400, 'This contact request has already been responded to.');

    const now = new Date().toISOString();
    cr.status = status;
    cr.respondedAt = now;
    cr.updatedAt = now;

    const ep = findRecord(db, 'employerProfiles', (e) => e.id === cr.employerProfileId);
    if (ep) {
      appendNotification(db, {
        userId: ep.userId,
        type: 'CONTACT_REQUEST_UPDATED',
        title: `Contact Request ${status === 'ACCEPTED' ? 'Accepted' : 'Declined'}`,
        message:
          status === 'ACCEPTED'
            ? `${user.fullName} accepted your contact request. Their phone and email are now visible.`
            : `${user.fullName} declined your contact request.`,
        link: '/employer/requests',
      });
    }

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'CONTACT_REQUEST_RESPONDED',
      entityType: 'ContactRequest',
      entityId: cr.id,
      description: `${user.fullName} ${status.toLowerCase()} contact request.`,
    });
    writeDb(db);
    return ok(undefined, `Contact request ${status.toLowerCase()}.`);
  }

  // ==================== ASSESSOR ROUTES ====================
  if (method === 'GET' && path === '/assessors/me') {
    const user = requireAuthUser(db, params.activeToken, 'ASSESSOR');
    const ap = findRecord(db, 'assessorProfiles', (a) => a.userId === user.id);
    if (!ap) fail(404, 'Assessor profile not found.');

    const tradeMap = new Map(db.trades.map((t) => [t.id, { id: t.id, name: t.name, urduName: t.urduName }]));

    let pendingQueueCount = 0;
    if (ap.approvalStatus === 'APPROVED' && ap.approvedTradeIds.length > 0) {
      const reqById = new Map(db.assessmentRequests.map((r) => [r.id, r]));
      pendingQueueCount = db.assessmentItems.filter((item) => {
        if (item.status !== 'PENDING') return false;
        const r = reqById.get(item.requestId);
        return r && ap.approvedTradeIds.includes(r.tradeId);
      }).length;
    }

    const completedItems = db.assessmentItems
      .filter((i) => i.assessorProfileId === ap.id && i.status !== 'PENDING')
      .sort((a, b) => new Date(b.assessedAt || b.updatedAt).getTime() - new Date(a.assessedAt || a.updatedAt).getTime());

    const recentActivity = completedItems.slice(0, 6).map((item) => {
      const r = findRecord(db, 'assessmentRequests', (req) => req.id === item.requestId);
      const wp = r ? findRecord(db, 'workerProfiles', (w) => w.id === r.workerProfileId) : undefined;
      const wu = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
      const comp = findRecord(db, 'competencies', (c) => c.id === item.competencyId);
      return {
        id: item.id,
        status: item.status,
        level: item.level,
        percentage: item.percentage,
        assessedAt: item.assessedAt,
        competencyTitle: comp?.title || 'Competency',
        workerName: wu?.fullName || 'Worker',
      };
    });

    return ok({
      id: ap.id,
      userId: ap.userId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      city: user.city,
      approvalStatus: ap.approvalStatus,
      approvedTradeIds: ap.approvedTradeIds,
      approvedTrades: ap.approvedTradeIds.map((id) => tradeMap.get(id)).filter(Boolean),
      appliedTradeIds: ap.appliedTradeIds,
      appliedTrades: ap.appliedTradeIds.map((id) => tradeMap.get(id)).filter(Boolean),
      yearsExperience: ap.yearsExperience,
      qualifications: ap.qualifications,
      bio: ap.bio,
      rejectionReason: ap.rejectionReason,
      appliedAt: ap.appliedAt,
      reviewedAt: ap.reviewedAt,
      stats: {
        pendingQueueCount,
        completedAssessments: completedItems.length,
      },
      recentActivity,
    });
  }

  if (method === 'POST' && path === '/assessors/apply') {
    const user = requireAuthUser(db, params.activeToken, 'ASSESSOR');
    const ap = findRecord(db, 'assessorProfiles', (a) => a.userId === user.id);
    if (!ap) fail(404, 'Assessor profile not found.');

    const fullName = String(body?.fullName || '').trim();
    const city = String(body?.city || '').trim();
    const tradeIds = Array.isArray(body?.tradeIds) ? body.tradeIds.map((id: any) => String(id)) : [];
    const yearsExperience = Math.round(Number(body?.yearsExperience || 0));
    const qualifications = String(body?.qualifications || '').trim();
    const bio = String(body?.bio || '').trim();

    if (fullName.length < 2) fail(400, 'Full name is required.');
    if (tradeIds.length === 0) fail(400, 'Select at least one trade.');
    if (yearsExperience < 1) fail(400, 'At least 1 year of experience required.');
    if (qualifications.length < 10) fail(400, 'Provide your qualifications or trade background (10+ characters).');
    if (bio.length < 10) fail(400, 'Provide a short professional biography (10+ characters).');

    for (const tid of tradeIds) {
      if (!findRecord(db, 'trades', (t) => t.id === tid && t.isActive)) {
        fail(400, 'One or more selected trades are invalid.');
      }
    }

    const now = new Date().toISOString();
    user.fullName = fullName;
    if (city.length >= 2) user.city = city;
    user.updatedAt = now;

    ap.approvalStatus = 'PENDING';
    ap.appliedTradeIds = tradeIds;
    ap.yearsExperience = yearsExperience;
    ap.qualifications = qualifications;
    ap.bio = bio;
    ap.rejectionReason = '';
    ap.appliedAt = now;
    ap.updatedAt = now;

    const admins = listRecords(db, 'users', (u) => u.role === 'ADMIN' && u.status === 'ACTIVE');
    for (const admin of admins) {
      appendNotification(db, {
        userId: admin.id,
        type: 'ASSESSOR_APPLICATION',
        title: `Assessor Application: ${fullName}`,
        message: `${fullName} applied to become an authorized assessor.`,
        link: '/admin/assessors',
      });
    }

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'ASSESSOR_APPLIED',
      entityType: 'AssessorProfile',
      entityId: ap.id,
      description: `${fullName} submitted an assessor approval application.`,
    });
    writeDb(db);
    return ok(undefined, 'Assessor application submitted for administrator review.');
  }

  if (method === 'GET' && path === '/assessors/queue') {
    const user = requireAuthUser(db, params.activeToken, 'ASSESSOR');
    const ap = findRecord(db, 'assessorProfiles', (a) => a.userId === user.id);
    if (!ap) fail(404, 'Assessor profile not found.');

    if (ap.approvalStatus !== 'APPROVED' || ap.approvedTradeIds.length === 0) {
      return ok({ approvalStatus: ap.approvalStatus, items: [] });
    }

    const reqMap = new Map(db.assessmentRequests.map((r) => [r.id, r]));
    const items = db.assessmentItems
      .filter((item) => {
        if (item.status !== 'PENDING') return false;
        const r = reqMap.get(item.requestId);
        if (!r || !ap.approvedTradeIds.includes(r.tradeId)) return false;
        const wp = findRecord(db, 'workerProfiles', (w) => w.id === r.workerProfileId);
        const wu = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
        if (!wp || !wu || wu.status !== 'ACTIVE') return false;
        if (item.appealedFromItemId) {
          const orig = findRecord(db, 'assessmentItems', (o) => o.id === item.appealedFromItemId);
          if (orig?.assessorProfileId === ap.id) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const ra = reqMap.get(a.requestId)!;
        const rb = reqMap.get(b.requestId)!;
        return new Date(ra.requestedAt).getTime() - new Date(rb.requestedAt).getTime();
      })
      .map((item) => {
        const r = reqMap.get(item.requestId)!;
        const trade = findRecord(db, 'trades', (t) => t.id === r.tradeId);
        const comp = findRecord(db, 'competencies', (c) => c.id === item.competencyId);
        const wp = findRecord(db, 'workerProfiles', (w) => w.id === r.workerProfileId)!;
        const wu = findRecord(db, 'users', (u) => u.id === wp.userId)!;
        const evidenceCount = db.evidence.filter(
          (e) => e.workerProfileId === wp.id && e.competencyId === item.competencyId
        ).length;
        return {
          itemId: item.id,
          requestId: item.requestId,
          competencyId: item.competencyId,
          competencyTitle: comp?.title || 'Competency',
          tradeId: r.tradeId,
          tradeName: trade?.name || '',
          workerName: wu.fullName,
          workerCity: wu.city,
          workerPublicId: wp.publicId,
          evidenceCount,
          requestedAt: r.requestedAt,
          status: item.status,
          isAppeal: Boolean(item.appealedFromItemId),
        };
      });

    return ok({ approvalStatus: ap.approvalStatus, items });
  }

  if (method === 'GET' && path.startsWith('/assessors/requests/')) {
    const user = requireAuthUser(db, params.activeToken, 'ASSESSOR');
    const ap = findRecord(db, 'assessorProfiles', (a) => a.userId === user.id);
    if (!ap) fail(404, 'Assessor profile not found.');
    if (ap.approvalStatus !== 'APPROVED') {
      fail(403, 'Only approved assessors can review verification requests.');
    }

    const requestId = path.slice('/assessors/requests/'.length);
    const requestRow = findRecord(db, 'assessmentRequests', (r) => r.id === requestId);
    if (!requestRow) fail(404, 'Verification request not found.');
    if (!ap.approvedTradeIds.includes(requestRow.tradeId)) {
      fail(403, 'You are not approved to assess this trade.');
    }

    const trade = findRecord(db, 'trades', (t) => t.id === requestRow.tradeId);
    const wp = findRecord(db, 'workerProfiles', (w) => w.id === requestRow.workerProfileId)!;
    const wu = findRecord(db, 'users', (u) => u.id === wp.userId)!;

    const rawItems = db.assessmentItems.filter((i) => i.requestId === requestRow.id);
    const enrichedItems = await Promise.all(
      rawItems.map(async (item) => {
        if (item.appealedFromItemId) {
          const orig = findRecord(db, 'assessmentItems', (o) => o.id === item.appealedFromItemId);
          if (orig?.assessorProfileId === ap.id) {
            return { ...item, restrictedAppealConflict: true };
          }
        }
        const comp = findRecord(db, 'competencies', (c) => c.id === item.competencyId);
        const criteria = db.rubricCriteria
          .filter((rc) => rc.competencyId === item.competencyId)
          .sort((a, b) => a.orderIndex - b.orderIndex);
        const evRows = db.evidence
          .filter((e) => e.workerProfileId === wp.id && e.competencyId === item.competencyId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const evidence = await Promise.all(
          evRows.map(async (e) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            fileType: e.fileType,
            mimeType: e.mimeType,
            originalName: e.originalName,
            createdAt: e.createdAt,
            signedUrl: await getEvidencePreviewUrl(e.fileKey, e.seedAssetPath),
          }))
        );

        const savedScores = db.assessmentScores
          .filter((s) => s.assessmentItemId === item.id)
          .map((s) => ({ criterion_id: s.criterionId, score: s.score, comment: s.comment }));

        return {
          id: item.id,
          competencyId: item.competencyId,
          competencyTitle: comp?.title || 'Competency',
          competencyUrduTitle: comp?.urduTitle || '',
          competencyDescription: comp?.description || '',
          status: item.status,
          totalScore: item.totalScore,
          maxScore: item.maxScore,
          percentage: item.percentage,
          level: item.level,
          feedback: item.feedback,
          assessedAt: item.assessedAt,
          isAppeal: Boolean(item.appealedFromItemId),
          appealReason: item.appealReason,
          restrictedAppealConflict: false,
          criteria: criteria.map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            isSafetyCritical: c.isSafetyCritical,
            maxScore: c.maxScore,
          })),
          evidence,
          savedScores,
        };
      })
    );

    return ok({
      requestId: requestRow.id,
      status: requestRow.status,
      requestedAt: requestRow.requestedAt,
      tradeId: requestRow.tradeId,
      tradeName: trade?.name || '',
      worker: {
        id: wp.id,
        publicId: wp.publicId,
        fullName: wu.fullName,
        city: wu.city,
        yearsExperience: wp.yearsExperience,
        bio: wp.bio,
        avatarUrl: wp.avatarUrl,
      },
      items: enrichedItems,
    });
  }

  if (method === 'POST' && path.startsWith('/assessors/requests/') && path.endsWith('/assessment')) {
    const user = requireAuthUser(db, params.activeToken, 'ASSESSOR');
    const ap = findRecord(db, 'assessorProfiles', (a) => a.userId === user.id);
    if (!ap || ap.approvalStatus !== 'APPROVED') {
      fail(403, 'Only approved assessors can submit assessments.');
    }

    const requestId = path.slice('/assessors/requests/'.length, -'/assessment'.length);
    const requestRow = findRecord(db, 'assessmentRequests', (r) => r.id === requestId);
    if (!requestRow) fail(404, 'Assessment request not found.');
    if (!ap.approvedTradeIds.includes(requestRow.tradeId)) {
      fail(403, 'You are not authorized for this trade.');
    }

    const competencyId = String(body?.competencyId || '').trim();
    const decision = String(body?.decision || '');
    const feedback = String(body?.feedback || '').trim();
    const scores = Array.isArray(body?.scores) ? body.scores : [];
    if (!['VERIFY', 'REQUEST_MORE_EVIDENCE', 'NOT_VERIFY'].includes(decision)) {
      fail(400, 'Invalid assessment decision.');
    }
    if (feedback.length < 5) fail(400, 'Assessor feedback is required (5+ characters).');

    const item = findRecord(db, 'assessmentItems', (i) => i.requestId === requestRow.id && i.competencyId === competencyId);
    if (!item) fail(404, 'Assessment competency item not found.');
    if (item.status !== 'PENDING') fail(409, 'This assessment item has already been evaluated.');

    if (item.appealedFromItemId) {
      const orig = findRecord(db, 'assessmentItems', (o) => o.id === item.appealedFromItemId);
      if (orig?.assessorProfileId === ap.id) {
        fail(403, 'Original assessor cannot review their own appealed decision.');
      }
    }

    const criteria = db.rubricCriteria.filter((rc) => rc.competencyId === item.competencyId);
    let rubricResult;
    try {
      rubricResult = evaluateRubricScores(criteria, scores);
    } catch (err: any) {
      fail(400, err.message);
    }

    if (decision === 'VERIFY') {
      if (rubricResult.safetyCriticalFailed) {
        fail(400, 'Safety-critical criterion received 0. Verification cannot be approved.');
      }
      if (!rubricResult.eligibleForVerification || !rubricResult.level) {
        fail(400, `Total score (${rubricResult.percentage}%) is below the 50% minimum threshold required to verify.`);
      }
    }

    const now = new Date().toISOString();
    const itemStatus =
      decision === 'VERIFY' ? 'VERIFIED' : decision === 'REQUEST_MORE_EVIDENCE' ? 'NEEDS_MORE_EVIDENCE' : 'NOT_VERIFIED';
    const wp = findRecord(db, 'workerProfiles', (w) => w.id === requestRow.workerProfileId)!;
    const wu = findRecord(db, 'users', (u) => u.id === wp.userId)!;
    const comp = findRecord(db, 'competencies', (c) => c.id === item.competencyId)!;

    for (const s of scores) {
      insertRecord(db, 'assessmentScores', {
        id: newId('scr'),
        assessmentItemId: item.id,
        criterionId: String(s.criterionId),
        score: Number(s.score),
        comment: String(s.comment || ''),
        createdAt: now,
      });
    }

    item.assessorProfileId = ap.id;
    item.status = itemStatus;
    item.totalScore = rubricResult.totalScore;
    item.maxScore = rubricResult.maxScore;
    item.percentage = rubricResult.percentage;
    item.level = decision === 'VERIFY' ? rubricResult.level : null;
    item.feedback = feedback;
    item.assessedAt = now;
    item.updatedAt = now;

    let createdBadgeId: string | null = null;
    if (decision === 'VERIFY' && rubricResult.level) {
      for (const existingBadge of db.badges) {
        if (
          existingBadge.workerProfileId === wp.id &&
          existingBadge.competencyId === item.competencyId &&
          existingBadge.status === 'ACTIVE'
        ) {
          existingBadge.status = 'EXPIRED';
          existingBadge.updatedAt = now;
        }
      }

      createdBadgeId = newId('bdg');
      const expiresAt = new Date(Date.now() + 365 * 86400000).toISOString();
      insertRecord(db, 'badges', {
        id: createdBadgeId,
        workerProfileId: wp.id,
        competencyId: item.competencyId,
        tradeId: requestRow.tradeId,
        assessmentItemId: item.id,
        assessorProfileId: ap.id,
        level: rubricResult.level,
        issuedAt: now,
        expiresAt,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      for (const ev of db.evidence) {
        if (ev.workerProfileId === wp.id && ev.competencyId === item.competencyId) {
          ev.status = 'APPROVED';
          ev.updatedAt = now;
        }
      }

      appendAuditLog(db, {
        actorUserId: user.id,
        action: 'BADGE_CREATED',
        entityType: 'Badge',
        entityId: createdBadgeId,
        description: `Issued ${rubricResult.level} badge for "${comp.title}" to ${wu.fullName}.`,
      });
      checkAndQueueEligibleTierApplication(db, wp.id);
    } else if (decision === 'REQUEST_MORE_EVIDENCE') {
      for (const ev of db.evidence) {
        if (ev.workerProfileId === wp.id && ev.competencyId === item.competencyId && ev.status === 'SUBMITTED') {
          ev.status = 'NEEDS_REVISION';
          ev.updatedAt = now;
        }
      }
    }

    if (item.appealedFromItemId) {
      const orig = findRecord(db, 'assessmentItems', (o) => o.id === item.appealedFromItemId);
      if (orig) orig.appealStatus = 'REVIEWED';
    }

    const remainingPending = db.assessmentItems.filter((i) => i.requestId === requestRow.id && i.status === 'PENDING').length;
    requestRow.status = remainingPending === 0 ? 'COMPLETED' : 'IN_REVIEW';
    if (remainingPending === 0) requestRow.completedAt = now;
    requestRow.updatedAt = now;

    appendNotification(db, {
      userId: wu.id,
      type: decision === 'VERIFY' ? 'COMPETENCY_VERIFIED' : decision === 'REQUEST_MORE_EVIDENCE' ? 'MORE_EVIDENCE_REQUESTED' : 'ASSESSMENT_COMPLETED',
      title:
        decision === 'VERIFY'
          ? `Competency Verified: ${comp.title}`
          : decision === 'REQUEST_MORE_EVIDENCE'
            ? `More Evidence Requested: ${comp.title}`
            : `Assessment Completed: ${comp.title}`,
      message:
        decision === 'VERIFY'
          ? `${user.fullName} verified your competency at ${rubricResult.level} (${rubricResult.percentage}%).`
          : `${user.fullName} reviewed your submission (${rubricResult.percentage}%): ${feedback}`,
      link: decision === 'VERIFY' ? '/worker/badges' : '/worker/assessments',
    });

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'ASSESSMENT_SUBMITTED',
      entityType: 'AssessmentItem',
      entityId: item.id,
      description: `${user.fullName} marked "${comp.title}" for ${wu.fullName} as ${itemStatus} (${rubricResult.percentage}%).`,
    });
    writeDb(db);

    return ok(
      { status: itemStatus, ...rubricResult, badgeId: createdBadgeId },
      decision === 'VERIFY'
        ? `Competency verified at ${rubricResult.level} (${rubricResult.percentage}%) and badge issued.`
        : 'Assessment feedback saved and sent to worker.'
    );
  }

  if (method === 'GET' && path === '/assessors/completed') {
    const user = requireAuthUser(db, params.activeToken, 'ASSESSOR');
    const ap = findRecord(db, 'assessorProfiles', (a) => a.userId === user.id);
    if (!ap) fail(404, 'Assessor profile not found.');

    const rows = db.assessmentItems
      .filter((i) => i.assessorProfileId === ap.id && i.status !== 'PENDING')
      .sort((a, b) => new Date(b.assessedAt || b.updatedAt).getTime() - new Date(a.assessedAt || a.updatedAt).getTime())
      .map((item) => {
        const r = findRecord(db, 'assessmentRequests', (req) => req.id === item.requestId)!;
        const trade = findRecord(db, 'trades', (t) => t.id === r.tradeId);
        const comp = findRecord(db, 'competencies', (c) => c.id === item.competencyId);
        const wp = findRecord(db, 'workerProfiles', (w) => w.id === r.workerProfileId)!;
        const wu = findRecord(db, 'users', (u) => u.id === wp.userId)!;
        return {
          id: item.id,
          requestId: item.requestId,
          workerName: wu.fullName,
          workerCity: wu.city,
          workerPublicId: wp.publicId,
          tradeName: trade?.name || '',
          competencyTitle: comp?.title || 'Competency',
          status: item.status,
          totalScore: item.totalScore,
          maxScore: item.maxScore,
          percentage: item.percentage,
          level: item.level,
          feedback: item.feedback,
          assessedAt: item.assessedAt,
        };
      });
    return ok(rows);
  }

  // ==================== ADMIN ROUTES ====================
  if (method === 'GET' && path === '/admin/dashboard') {
    requireAuthUser(db, params.activeToken, 'ADMIN');

    const nowMs = Date.now();
    const activeBadges = db.badges.filter((b) => b.status === 'ACTIVE' && new Date(b.expiresAt).getTime() > nowMs);

    const badgesByTrade = db.trades
      .map((t) => ({
        tradeName: t.name,
        count: activeBadges.filter((b) => b.tradeId === t.id).length,
      }))
      .sort((a, b) => b.count - a.count);

    const recentActivity = db.auditLogs
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((l) => {
        const actor = l.actorUserId ? findRecord(db, 'users', (u) => u.id === l.actorUserId) : undefined;
        return {
          id: l.id,
          action: l.action,
          entityType: l.entityType,
          description: l.description,
          actorName: actor?.fullName || 'System',
          actorRole: actor?.role || 'SYSTEM',
          createdAt: l.createdAt,
        };
      });

    return ok({
      stats: {
        totalUsers: db.users.length,
        totalWorkers: db.users.filter((u) => u.role === 'WORKER').length,
        totalEmployers: db.users.filter((u) => u.role === 'EMPLOYER').length,
        totalAssessors: db.users.filter((u) => u.role === 'ASSESSOR').length,
        pendingAssessors: db.assessorProfiles.filter((a) => a.approvalStatus === 'PENDING').length,
        pendingReports: db.reports.filter((r) => r.status === 'OPEN' || r.status === 'UNDER_REVIEW').length,
        verifiedCompetencies: activeBadges.length,
        totalJobs: (db.jobs || []).length,
        completedJobs: (db.jobs || []).filter((j) => j.status === 'COMPLETED').length,
        pendingDisputes: (db.disputes || []).filter((d) => d.status === 'OPEN' || d.status === 'WORKER_RESPONDED').length,
        pendingTierApprovals: (db.tierApplications || []).filter((t) => t.status === 'PENDING').length,
      },
      badgesByTrade: badgesByTrade.slice(0, 12),
      recentActivity,
    });
  }

  if (method === 'GET' && path === '/admin/users') {
    requireAuthUser(db, params.activeToken, 'ADMIN');
    const q = (query.q || '').trim().toLowerCase();
    const role = (query.role || '').trim().toUpperCase();

    const rows = db.users
      .filter((u) => {
        if (role && u.role !== role) return false;
        if (q) {
          return (
            u.fullName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.city.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((u) => {
        const wp = findRecord(db, 'workerProfiles', (w) => w.userId === u.id);
        const ep = findRecord(db, 'employerProfiles', (e) => e.userId === u.id);
        const ap = findRecord(db, 'assessorProfiles', (a) => a.userId === u.id);
        return {
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          role: u.role,
          city: u.city,
          status: u.status,
          createdAt: u.createdAt,
          workerPublicId: wp?.publicId || null,
          companyName: ep?.companyName || null,
          assessorApprovalStatus: ap?.approvalStatus || null,
        };
      });
    return ok(rows);
  }

  if (method === 'PATCH' && path.startsWith('/admin/users/') && path.endsWith('/status')) {
    const admin = requireAuthUser(db, params.activeToken, 'ADMIN');
    const targetId = path.slice('/admin/users/'.length, -'/status'.length);
    const status = String(body?.status || '').toUpperCase();
    if (status !== 'ACTIVE' && status !== 'SUSPENDED') {
      fail(400, 'Status must be ACTIVE or SUSPENDED.');
    }
    if (targetId === admin.id) {
      fail(400, 'You cannot suspend your own admin account.');
    }

    const target = findRecord(db, 'users', (u) => u.id === targetId);
    if (!target) fail(404, 'User not found.');

    target.status = status;
    target.updatedAt = new Date().toISOString();
    appendAuditLog(db, {
      actorUserId: admin.id,
      action: status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      entityType: 'User',
      entityId: target.id,
      description: `${target.fullName} (${target.role}) account status changed to ${status}.`,
    });
    writeDb(db);
    return ok(undefined, `User status updated to ${status}.`);
  }

  if (method === 'GET' && path === '/admin/assessors') {
    requireAuthUser(db, params.activeToken, 'ADMIN');
    const tradeMap = new Map(db.trades.map((t) => [t.id, t.name]));
    const rank = (s: AssessorApprovalStatus) => (s === 'PENDING' ? 0 : s === 'APPROVED' ? 1 : 2);

    const rows = db.assessorProfiles
      .slice()
      .sort((a, b) => rank(a.approvalStatus) - rank(b.approvalStatus) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((ap) => {
        const u = findRecord(db, 'users', (usr) => usr.id === ap.userId)!;
        return {
          id: ap.id,
          userId: ap.userId,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          city: u.city,
          userStatus: u.status,
          approvalStatus: ap.approvalStatus,
          approvedTradeIds: ap.approvedTradeIds,
          approvedTradeNames: ap.approvedTradeIds.map((id) => tradeMap.get(id)).filter(Boolean),
          appliedTradeIds: ap.appliedTradeIds,
          appliedTradeNames: ap.appliedTradeIds.map((id) => tradeMap.get(id)).filter(Boolean),
          yearsExperience: ap.yearsExperience,
          qualifications: ap.qualifications,
          bio: ap.bio,
          rejectionReason: ap.rejectionReason,
          appliedAt: ap.appliedAt,
          reviewedAt: ap.reviewedAt,
        };
      });
    return ok(rows);
  }

  if (method === 'PATCH' && path.startsWith('/admin/assessors/') && path.endsWith('/approval')) {
    const admin = requireAuthUser(db, params.activeToken, 'ADMIN');
    const apId = path.slice('/admin/assessors/'.length, -'/approval'.length);
    const ap = findRecord(db, 'assessorProfiles', (a) => a.id === apId);
    if (!ap) fail(404, 'Assessor profile not found.');

    const approvalStatus = String(body?.approvalStatus || '').toUpperCase() as AssessorApprovalStatus;
    if (!['APPROVED', 'REJECTED', 'REVOKED'].includes(approvalStatus)) {
      fail(400, 'Invalid approval status.');
    }
    const approvedTradeIds: string[] = Array.isArray(body?.approvedTradeIds)
      ? body.approvedTradeIds.map((id: any) => String(id))
      : [];
    const rejectionReason = String(body?.rejectionReason || '').trim();

    if (approvalStatus === 'APPROVED' && approvedTradeIds.length === 0) {
      fail(400, 'Assign at least one approved trade when approving an assessor.');
    }

    const now = new Date().toISOString();
    ap.approvalStatus = approvalStatus;
    ap.approvedTradeIds = approvalStatus === 'APPROVED' ? approvedTradeIds : [];
    ap.rejectionReason = rejectionReason;
    ap.reviewedAt = now;
    ap.updatedAt = now;

    const u = findRecord(db, 'users', (usr) => usr.id === ap.userId)!;
    appendNotification(db, {
      userId: ap.userId,
      type: approvalStatus === 'APPROVED' ? 'ASSESSOR_APPROVED' : 'ASSESSOR_REJECTED',
      title:
        approvalStatus === 'APPROVED'
          ? 'Assessor Application Approved'
          : approvalStatus === 'REVOKED'
            ? 'Assessor Authorization Revoked'
            : 'Assessor Application Update',
      message:
        approvalStatus === 'APPROVED'
          ? 'Your assessor profile is approved. You can now review verification requests in your assigned trades.'
          : rejectionReason || `Your assessor status is now ${approvalStatus}.`,
      link: '/assessor/dashboard',
    });

    appendAuditLog(db, {
      actorUserId: admin.id,
      action: `ASSESSOR_${approvalStatus}`,
      entityType: 'AssessorProfile',
      entityId: ap.id,
      description: `${u.fullName} assessor status set to ${approvalStatus}.`,
    });
    writeDb(db);
    return ok(undefined, `Assessor ${approvalStatus.toLowerCase()}.`);
  }

  if (method === 'GET' && path === '/admin/trades') {
    requireAuthUser(db, params.activeToken, 'ADMIN');
    const data = db.trades
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => {
        const ref = getServiceBySlugOrId(t.slug || t.id);
        return {
          id: t.id,
          slug: t.slug,
          name: t.name,
          urduName: t.urduName,
          group: t.group || ref?.group || 'Home Repair & Maintenance',
          urduGroup: t.urduGroup || ref?.urduGroup || '',
          description: t.description,
          icon: t.icon,
          priceGuide: t.priceGuide?.length ? t.priceGuide : ref?.defaultPriceGuide || [],
          isActive: t.isActive,
          competencies: db.competencies
            .filter((c) => c.tradeId === t.id)
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((c) => ({
              id: c.id,
              tradeId: c.tradeId,
              slug: c.slug,
              title: c.title,
              urduTitle: c.urduTitle,
              description: c.description,
              orderIndex: c.orderIndex,
              isActive: c.isActive,
              criteria: db.rubricCriteria
                .filter((r) => r.competencyId === c.id)
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((r) => ({
                  id: r.id,
                  title: r.title,
                  description: r.description,
                  isSafetyCritical: r.isSafetyCritical,
                  maxScore: r.maxScore,
                  orderIndex: r.orderIndex,
                })),
            })),
        };
      });
    return ok(data);
  }

  if (method === 'POST' && path === '/admin/trades') {
    const admin = requireAuthUser(db, params.activeToken, 'ADMIN');
    const name = String(body?.name || '').trim();
    const urduName = String(body?.urduName || '').trim();
    const group = String(body?.group || 'Home Repair & Maintenance').trim();
    const urduGroup = String(body?.urduGroup || '').trim();
    const description = String(body?.description || '').trim();
    const icon = String(body?.icon || 'wrench').trim();
    const isActive = Boolean(body?.isActive ?? true);
    const priceGuide = Array.isArray(body?.priceGuide) ? body.priceGuide : [];

    if (name.length < 2 || description.length < 5) fail(400, 'Trade name and description are required.');
    const slug = toSlug(name);
    if (db.trades.some((t) => t.slug === slug || t.name.toLowerCase() === name.toLowerCase())) {
      fail(409, 'A trade with this name already exists.');
    }

    const now = new Date().toISOString();
    const id = newId('trd');
    insertRecord(db, 'trades', { id, slug, name, urduName, group, urduGroup, description, icon, priceGuide, isActive, createdAt: now, updatedAt: now });
    appendAuditLog(db, {
      actorUserId: admin.id,
      action: 'TRADE_CREATED',
      entityType: 'Trade',
      entityId: id,
      description: `Admin added category "${name}" (${group}).`,
    });
    writeDb(db);
    return ok({ id });
  }

  if (method === 'PUT' && path.startsWith('/admin/trades/')) {
    const admin = requireAuthUser(db, params.activeToken, 'ADMIN');
    const id = path.slice('/admin/trades/'.length);
    const trade = findRecord(db, 'trades', (t) => t.id === id);
    if (!trade) fail(404, 'Trade not found.');

    const name = String(body?.name || '').trim();
    if (name.length < 2) fail(400, 'Trade name is required.');
    trade.name = name;
    trade.urduName = String(body?.urduName || '').trim();
    if (body?.group !== undefined) trade.group = String(body.group || '').trim();
    if (body?.urduGroup !== undefined) trade.urduGroup = String(body.urduGroup || '').trim();
    trade.description = String(body?.description || '').trim();
    trade.icon = String(body?.icon || 'wrench').trim();
    if (Array.isArray(body?.priceGuide)) {
      trade.priceGuide = body.priceGuide;
    }
    trade.isActive = Boolean(body?.isActive ?? true);
    trade.updatedAt = new Date().toISOString();

    appendAuditLog(db, {
      actorUserId: admin.id,
      action: 'TRADE_UPDATED',
      entityType: 'Trade',
      entityId: id,
      description: `Admin updated category "${name}" (active: ${trade.isActive}).`,
    });
    writeDb(db);
    return ok(undefined, 'Category & fair price guide updated.');
  }

  if (method === 'POST' && path === '/admin/competencies') {
    const admin = requireAuthUser(db, params.activeToken, 'ADMIN');
    const tradeId = String(body?.tradeId || '').trim();
    const title = String(body?.title || '').trim();
    const urduTitle = String(body?.urduTitle || '').trim();
    const description = String(body?.description || '').trim();
    const orderIndex = Number(body?.orderIndex || 1);
    const isActive = Boolean(body?.isActive ?? true);
    const criteria = Array.isArray(body?.criteria) ? body.criteria : [];

    const trade = findRecord(db, 'trades', (t) => t.id === tradeId);
    if (!trade) fail(404, 'Trade not found.');
    if (title.length < 3 || description.length < 5 || criteria.length === 0) {
      fail(400, 'Competency title, description, and at least one rubric criterion are required.');
    }

    const now = new Date().toISOString();
    const compId = newId('cmp');
    insertRecord(db, 'competencies', {
      id: compId,
      tradeId,
      slug: `${toSlug(title)}-${Math.random().toString(36).slice(2, 5)}`,
      title,
      urduTitle,
      description,
      orderIndex,
      isActive,
      createdAt: now,
      updatedAt: now,
    });

    criteria.forEach((c: any, idx: number) => {
      insertRecord(db, 'rubricCriteria', {
        id: newId('crt'),
        competencyId: compId,
        title: String(c.title || '').trim(),
        description: String(c.description || '').trim(),
        isSafetyCritical: Boolean(c.isSafetyCritical),
        maxScore: Number(c.maxScore || 3),
        orderIndex: Number(c.orderIndex || idx + 1),
        createdAt: now,
        updatedAt: now,
      });
    });

    appendAuditLog(db, {
      actorUserId: admin.id,
      action: 'COMPETENCY_CREATED',
      entityType: 'Competency',
      entityId: compId,
      description: `Admin added competency "${title}" under ${trade.name} with ${criteria.length} rubric criteria.`,
    });
    writeDb(db);
    return ok({ id: compId });
  }

  if (method === 'PUT' && path.startsWith('/admin/competencies/')) {
    const admin = requireAuthUser(db, params.activeToken, 'ADMIN');
    const compId = path.slice('/admin/competencies/'.length);
    const comp = findRecord(db, 'competencies', (c) => c.id === compId);
    if (!comp) fail(404, 'Competency not found.');

    const title = String(body?.title || '').trim();
    const description = String(body?.description || '').trim();
    const criteria = Array.isArray(body?.criteria) ? body.criteria : [];
    if (title.length < 3 || description.length < 5 || criteria.length === 0) {
      fail(400, 'Competency title, description, and rubric criteria are required.');
    }

    const now = new Date().toISOString();
    comp.tradeId = String(body?.tradeId || comp.tradeId);
    comp.title = title;
    comp.urduTitle = String(body?.urduTitle || '').trim();
    comp.description = description;
    comp.orderIndex = Number(body?.orderIndex || comp.orderIndex);
    comp.isActive = Boolean(body?.isActive ?? true);
    comp.updatedAt = now;

    const existingCriteria = db.rubricCriteria.filter((rc) => rc.competencyId === compId);
    const incomingIds = new Set(criteria.map((c: any) => c.id).filter(Boolean));
    for (const ec of existingCriteria) {
      if (!incomingIds.has(ec.id)) {
        const usedInScores = db.assessmentScores.some((s) => s.criterionId === ec.id);
        if (!usedInScores) {
          deleteRecordsWhere(db, 'rubricCriteria', (rc) => rc.id === ec.id);
        }
      }
    }

    criteria.forEach((c: any, idx: number) => {
      const existing = c.id ? findRecord(db, 'rubricCriteria', (rc) => rc.id === c.id && rc.competencyId === compId) : undefined;
      if (existing) {
        existing.title = String(c.title || '').trim();
        existing.description = String(c.description || '').trim();
        existing.isSafetyCritical = Boolean(c.isSafetyCritical);
        existing.maxScore = Number(c.maxScore || 3);
        existing.orderIndex = idx + 1;
        existing.updatedAt = now;
      } else {
        insertRecord(db, 'rubricCriteria', {
          id: newId('crt'),
          competencyId: compId,
          title: String(c.title || '').trim(),
          description: String(c.description || '').trim(),
          isSafetyCritical: Boolean(c.isSafetyCritical),
          maxScore: Number(c.maxScore || 3),
          orderIndex: idx + 1,
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    appendAuditLog(db, {
      actorUserId: admin.id,
      action: 'COMPETENCY_UPDATED',
      entityType: 'Competency',
      entityId: compId,
      description: `Admin updated competency "${title}" and rubric criteria.`,
    });
    writeDb(db);
    return ok(undefined, 'Competency and rubric updated.');
  }

  if (method === 'GET' && path === '/admin/reports') {
    requireAuthUser(db, params.activeToken, 'ADMIN');
    const rank = (s: string) => (s === 'OPEN' ? 0 : s === 'UNDER_REVIEW' ? 1 : 2);
    const typePriority = (t: string) => (t === 'JOB_SOS' ? 0 : 1);
    const rows = db.reports
      .slice()
      .sort(
        (a, b) =>
          rank(a.status) - rank(b.status) ||
          typePriority(a.targetType) - typePriority(b.targetType) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((r) => {
        const reporter = findRecord(db, 'users', (u) => u.id === r.reporterUserId);
        const resolver = r.resolvedByUserId ? findRecord(db, 'users', (u) => u.id === r.resolvedByUserId) : undefined;
        let targetSummary = r.targetId;
        let targetUserId: string | null = null;
        if (r.targetType === 'WORKER_PROFILE') {
          const wp = findRecord(db, 'workerProfiles', (w) => w.id === r.targetId);
          const wu = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
          if (wp && wu) {
            targetSummary = `${wu.fullName} (/workers/${wp.publicId}) — ${wu.status}`;
            targetUserId = wu.id;
          }
        } else if (r.targetType === 'EVIDENCE') {
          const ev = findRecord(db, 'evidence', (e) => e.id === r.targetId);
          const wp = ev ? findRecord(db, 'workerProfiles', (w) => w.id === ev.workerProfileId) : undefined;
          const wu = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
          if (ev && wu) {
            targetSummary = `Evidence "${ev.title}" by ${wu.fullName}`;
            targetUserId = wu.id;
          }
        } else if (r.targetType === 'REVIEW') {
          const rev = findRecord(db, 'reviews', (rv) => rv.id === r.targetId);
          const wp = rev ? findRecord(db, 'workerProfiles', (w) => w.id === rev.workerProfileId) : undefined;
          const wu = wp ? findRecord(db, 'users', (u) => u.id === wp.userId) : undefined;
          if (rev) {
            targetSummary = `Review (${rev.overallRating}★) on ${wu?.fullName || 'Worker'}${rev.isHiddenByAdmin ? ' [HIDDEN]' : ''}`;
            targetUserId = rev.customerUserId;
          }
        } else if (r.targetType === 'JOB_SOS') {
          const job = findRecord(db, 'jobs', (j) => j.id === r.targetId);
          targetSummary = `URGENT SOS Job: "${job?.title || r.targetId}" (${job?.city || ''})`;
        }
        return {
          id: r.id,
          targetType: r.targetType,
          targetId: r.targetId,
          targetSummary,
          targetUserId,
          reason: r.reason,
          details: r.details,
          status: r.status,
          adminNotes: r.adminNotes,
          reporterName: reporter?.fullName || 'User',
          resolvedByName: resolver?.fullName || null,
          createdAt: r.createdAt,
          resolvedAt: r.resolvedAt,
        };
      });
    return ok(rows);
  }

  if (method === 'PATCH' && path.startsWith('/admin/reports/')) {
    const admin = requireAuthUser(db, params.activeToken, 'ADMIN');
    const reportId = path.slice('/admin/reports/'.length);
    const report = findRecord(db, 'reports', (r) => r.id === reportId);
    if (!report) fail(404, 'Report not found.');

    const status = String(body?.status || '').toUpperCase();
    if (!['UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].includes(status)) {
      fail(400, 'Invalid report resolution status.');
    }

    const now = new Date().toISOString();
    report.status = status as any;
    report.adminNotes = String(body?.adminNotes || '').trim();
    report.resolvedByUserId = admin.id;
    report.resolvedAt = now;
    report.updatedAt = now;

    if (body?.hideTargetReview && report.targetType === 'REVIEW') {
      const rev = findRecord(db, 'reviews', (rv) => rv.id === report.targetId);
      if (rev) {
        rev.isHiddenByAdmin = true;
        rev.hiddenReason = report.adminNotes || report.reason;
        rev.updatedAt = now;
        appendAuditLog(db, {
          actorUserId: admin.id,
          action: 'REVIEW_HIDDEN',
          entityType: 'Review',
          entityId: rev.id,
          description: `Review ${rev.id} hidden via report ${report.id}.`,
        });
      }
    }

    if (body?.suspendTargetUser) {
      let targetUserId: string | null = null;
      if (report.targetType === 'WORKER_PROFILE') {
        const wp = findRecord(db, 'workerProfiles', (w) => w.id === report.targetId);
        targetUserId = wp?.userId || null;
      } else if (report.targetType === 'EVIDENCE') {
        const ev = findRecord(db, 'evidence', (e) => e.id === report.targetId);
        const wp = ev ? findRecord(db, 'workerProfiles', (w) => w.id === ev.workerProfileId) : undefined;
        targetUserId = wp?.userId || null;
      } else if (report.targetType === 'REVIEW') {
        const rev = findRecord(db, 'reviews', (rv) => rv.id === report.targetId);
        targetUserId = rev?.customerUserId || null;
      }
      if (targetUserId && targetUserId !== admin.id) {
        const tu = findRecord(db, 'users', (u) => u.id === targetUserId);
        if (tu) {
          tu.status = 'SUSPENDED';
          tu.updatedAt = now;
          appendAuditLog(db, {
            actorUserId: admin.id,
            action: 'USER_SUSPENDED',
            entityType: 'User',
            entityId: tu.id,
            description: `Suspended user via moderation report ${report.id}.`,
          });
        }
      }
    }

    appendAuditLog(db, {
      actorUserId: admin.id,
      action: 'REPORT_REVIEWED',
      entityType: 'Report',
      entityId: report.id,
      description: `Report ${report.id} marked ${status}.`,
    });
    writeDb(db);
    return ok(undefined, 'Report updated.');
  }

  if (method === 'GET' && path === '/admin/audit-logs') {
    requireAuthUser(db, params.activeToken, 'ADMIN');
    const actionFilter = (query.action || '').trim();
    const limit = Math.min(200, Math.max(10, Number(query.limit || 100)));

    const logs = db.auditLogs
      .filter((l) => !actionFilter || l.action === actionFilter)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((r) => {
        const actor = r.actorUserId ? findRecord(db, 'users', (u) => u.id === r.actorUserId) : undefined;
        return {
          id: r.id,
          action: r.action,
          entityType: r.entityType,
          entityId: r.entityId,
          description: r.description,
          actorName: actor?.fullName || 'System',
          actorEmail: actor?.email || '',
          actorRole: actor?.role || 'SYSTEM',
          createdAt: r.createdAt,
        };
      });
    return ok(logs);
  }

  // ==================== NOTIFICATIONS ====================
  if (method === 'GET' && path === '/notifications') {
    const user = requireAuthUser(db, params.activeToken);
    const items = db.notifications
      .filter((n) => n.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 30);
    return ok(items);
  }

  if (method === 'PATCH' && path === '/notifications/read-all') {
    const user = requireAuthUser(db, params.activeToken);
    for (const n of db.notifications) {
      if (n.userId === user.id) n.isRead = true;
    }
    writeDb(db);
    return ok();
  }

  if (method === 'PATCH' && path.startsWith('/notifications/') && path.endsWith('/read')) {
    const user = requireAuthUser(db, params.activeToken);
    const id = path.slice('/notifications/'.length, -'/read'.length);
    const n = findRecord(db, 'notifications', (notif) => notif.id === id && notif.userId === user.id);
    if (n) {
      n.isRead = true;
      writeDb(db);
    }
    return ok();
  }

  // ==================== REPORTS ====================
  if (method === 'POST' && path === '/reports') {
    const user = requireAuthUser(db, params.activeToken);
    const targetType = String(body?.targetType || '') as ReportTargetType;
    const targetId = String(body?.targetId || '').trim();
    const reason = String(body?.reason || '').trim();
    const details = String(body?.details || '').trim();
    if (!['WORKER_PROFILE', 'EVIDENCE', 'REVIEW', 'JOB_SOS'].includes(targetType) || !targetId || reason.length < 3) {
      fail(400, 'Invalid report details.');
    }

    const now = new Date().toISOString();
    const id = newId('rep');
    insertRecord(db, 'reports', {
      id,
      reporterUserId: user.id,
      targetType,
      targetId,
      reason,
      details,
      status: 'OPEN',
      adminNotes: '',
      resolvedByUserId: null,
      createdAt: now,
      resolvedAt: null,
      updatedAt: now,
    });

    const admins = listRecords(db, 'users', (u) => u.role === 'ADMIN' && u.status === 'ACTIVE');
    for (const admin of admins) {
      appendNotification(db, {
        userId: admin.id,
        type: 'NEW_REPORT',
        title: 'New Moderation Report Filed',
        message: `A report was submitted regarding ${targetType.replace('_', ' ').toLowerCase()}: ${reason}.`,
        link: '/admin/reports',
      });
    }

    appendAuditLog(db, {
      actorUserId: user.id,
      action: 'REPORT_FILED',
      entityType: 'Report',
      entityId: id,
      description: `Filed moderation report on ${targetType} (${targetId}): ${reason}.`,
    });
    writeDb(db);
    return ok({ id }, 'Report submitted for administrator review.');
  }

  fail(404, `Endpoint not found: ${method} ${path}`);
}
