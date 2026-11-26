export type UserRole = 'WORKER' | 'EMPLOYER' | 'ASSESSOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type AssessorApprovalStatus = 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
export type EvidenceFileType = 'IMAGE' | 'VIDEO';
export type EvidenceStatus = 'PRIVATE' | 'SUBMITTED' | 'APPROVED' | 'NEEDS_REVISION';
export type AssessmentRequestStatus = 'PENDING' | 'IN_REVIEW' | 'COMPLETED';
export type AssessmentItemStatus = 'PENDING' | 'VERIFIED' | 'NEEDS_MORE_EVIDENCE' | 'NOT_VERIFIED';
export type VerificationLevel = 'BASIC' | 'COMPETENT' | 'ADVANCED';
export type BadgeStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';
export type ContactRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type ReportTargetType = 'WORKER_PROFILE' | 'EVIDENCE' | 'REVIEW' | 'JOB_SOS';
export type ReportStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export type JobStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type KarigarTier = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type TierStatus = 'NONE' | 'ACTIVE' | 'UNDER_REVIEW' | 'EXPIRED';
export type TierApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type DisputeStatus = 'OPEN' | 'WORKER_RESPONDED' | 'RESOLVED_UPHELD' | 'RESOLVED_DISMISSED';
export type EmployerAccountType = 'INDIVIDUAL' | 'BUSINESS';

export interface FairPriceItem {
  id: string;
  serviceLabel: string;
  serviceUrduLabel: string;
  minPkr: number;
  maxPkr: number;
  unit: string;
}

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  passwordSalt: string;
  role: UserRole;
  city: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerCertificate {
  title: string;
  issuer: string;
  year: string;
}

export interface WorkerProfileRecord {
  id: string;
  userId: string;
  publicId: string;
  passportId?: string;
  selectedTradeId: string | null;
  yearsExperience: number;
  bio: string;
  skills: string[];
  certificates: WorkerCertificate[];
  showCertificates: boolean;
  avatarUrl: string;
  isPublic: boolean;
  isFemaleProfessional?: boolean;
  tier?: KarigarTier;
  tierStatus?: TierStatus;
  tierIssuedAt?: string | null;
  tierExpiresAt?: string | null;
  tierUnderReview?: boolean;
  tierRejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployerProfileRecord {
  id: string;
  userId: string;
  accountType?: EmployerAccountType;
  companyName: string;
  industry: string;
  city: string;
  website: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessorProfileRecord {
  id: string;
  userId: string;
  approvalStatus: AssessorApprovalStatus;
  approvedTradeIds: string[];
  appliedTradeIds: string[];
  yearsExperience: number;
  qualifications: string;
  bio: string;
  rejectionReason: string;
  appliedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TradeRecord {
  id: string;
  slug: string;
  name: string;
  urduName: string;
  group?: string;
  urduGroup?: string;
  description: string;
  icon: string;
  priceGuide?: FairPriceItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompetencyRecord {
  id: string;
  tradeId: string;
  slug: string;
  title: string;
  urduTitle: string;
  description: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RubricCriterionRecord {
  id: string;
  competencyId: string;
  title: string;
  description: string;
  isSafetyCritical: boolean;
  maxScore: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceRecord {
  id: string;
  workerProfileId: string;
  competencyId: string;
  title: string;
  description: string;
  fileType: EvidenceFileType;
  mimeType: string;
  fileSize: number;
  fileKey: string;
  seedAssetPath?: string;
  originalName: string;
  status: EvidenceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentRequestRecord {
  id: string;
  workerProfileId: string;
  tradeId: string;
  status: AssessmentRequestStatus;
  requestedAt: string;
  completedAt: string | null;
  updatedAt: string;
}

export interface AssessmentItemRecord {
  id: string;
  requestId: string;
  competencyId: string;
  assessorProfileId: string | null;
  status: AssessmentItemStatus;
  totalScore: number;
  maxScore: number;
  percentage: number;
  level: VerificationLevel | null;
  feedback: string;
  assessedAt: string | null;
  isAppealed: boolean;
  appealReason: string;
  appealStatus: 'NONE' | 'PENDING' | 'REVIEWED';
  appealedFromItemId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentScoreRecord {
  id: string;
  assessmentItemId: string;
  criterionId: string;
  score: number;
  comment: string;
  createdAt: string;
}

export interface BadgeRecord {
  id: string;
  workerProfileId: string;
  competencyId: string;
  tradeId: string;
  assessmentItemId: string;
  assessorProfileId: string;
  level: VerificationLevel;
  issuedAt: string;
  expiresAt: string;
  status: BadgeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContactRequestRecord {
  id: string;
  employerProfileId: string;
  workerProfileId: string;
  message: string;
  status: ContactRequestStatus;
  createdAt: string;
  respondedAt: string | null;
  updatedAt: string;
}

export interface ShortlistRecord {
  id: string;
  employerProfileId: string;
  workerProfileId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportRecord {
  id: string;
  reporterUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string;
  status: ReportStatus;
  adminNotes: string;
  resolvedByUserId: string | null;
  createdAt: string;
  resolvedAt: string | null;
  updatedAt: string;
}

export interface AuditLogRecord {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface JobPhotoRef {
  id: string;
  fileKey: string;
  seedAssetPath?: string;
  originalName: string;
  mimeType: string;
  caption?: string;
}

export interface JobRecord {
  id: string;
  customerUserId: string;
  employerProfileId: string;
  workerProfileId: string;
  tradeId: string;
  title: string;
  description: string;
  city: string;
  area: string;
  preferredDate: string;
  preferredTimeSlot: string;
  scheduledDateTime: string | null;
  problemPhotos: JobPhotoRef[];
  beforePhotos: JobPhotoRef[];
  afterPhotos: JobPhotoRef[];
  quotedPkr: number | null;
  finalPkr: number | null;
  priceStatus?: 'BELOW_GUIDE' | 'WITHIN_GUIDE' | 'ABOVE_GUIDE' | 'NO_GUIDE';
  workerNotes: string;
  completionNotes: string;
  customerConfirmedProof: boolean;
  customerConfirmedAt: string | null;
  status: JobStatus;
  cancelledByRole?: UserRole | null;
  cancelReason?: string;
  requestedAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
}

export interface ReviewRecord {
  id: string;
  jobId: string;
  customerUserId: string;
  workerProfileId: string;
  tradeId: string;
  overallRating: number;
  qualityRating: number;
  punctualityRating: number;
  behaviourRating: number;
  valueRating: number;
  tags: string[];
  comment: string;
  photos: JobPhotoRef[];
  workerReply: string;
  workerRepliedAt: string | null;
  isHiddenByAdmin: boolean;
  hiddenReason: string;
  editableUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeRecord {
  id: string;
  jobId: string;
  customerUserId: string;
  workerProfileId: string;
  reason: string;
  details: string;
  workerResponse: string;
  workerRespondedAt: string | null;
  status: DisputeStatus;
  adminResolutionNotes: string;
  resolvedByUserId: string | null;
  createdAt: string;
  resolvedAt: string | null;
  updatedAt: string;
}

export interface TierRuleItem {
  tier: Exclude<KarigarTier, 'NONE'>;
  minVerifiedCompetencies: number;
  minRating: number;
  minCompletedJobs: number;
  minActiveMonths: number;
  validityMonths: number;
}

export interface TierRuleConfig {
  BRONZE: TierRuleItem;
  SILVER: TierRuleItem;
  GOLD: TierRuleItem;
  PLATINUM: TierRuleItem;
}

export interface TierApplicationRecord {
  id: string;
  workerProfileId: string;
  requestedTier: Exclude<KarigarTier, 'NONE'>;
  status: TierApplicationStatus;
  trustScoreSnapshot: number;
  adminNotes: string;
  reviewedByUserId: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface EarningsLogRecord {
  id: string;
  workerProfileId: string;
  jobId?: string | null;
  title: string;
  amountPkr: number;
  date: string;
  notes: string;
  createdAt: string;
}

export interface InternalDatabaseSchema {
  version: number;
  settings: {
    lang: 'en' | 'ur';
    tierRules?: TierRuleConfig;
  };
  users: UserRecord[];
  workerProfiles: WorkerProfileRecord[];
  employerProfiles: EmployerProfileRecord[];
  assessorProfiles: AssessorProfileRecord[];
  trades: TradeRecord[];
  competencies: CompetencyRecord[];
  rubricCriteria: RubricCriterionRecord[];
  evidence: EvidenceRecord[];
  assessmentRequests: AssessmentRequestRecord[];
  assessmentItems: AssessmentItemRecord[];
  assessmentScores: AssessmentScoreRecord[];
  badges: BadgeRecord[];
  contactRequests: ContactRequestRecord[];
  shortlists: ShortlistRecord[];
  reports: ReportRecord[];
  auditLogs: AuditLogRecord[];
  notifications: NotificationRecord[];
  jobs?: JobRecord[];
  reviews?: ReviewRecord[];
  disputes?: DisputeRecord[];
  tierApplications?: TierApplicationRecord[];
  earningsLogs?: EarningsLogRecord[];
}
