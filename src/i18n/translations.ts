import { useCallback } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';

export type AppLang = 'en' | 'ur';

export function useI18n() {
  const { lang, setLang, toggleLang } = useAuth();
  const isUr = lang === 'ur';

  const bi = useCallback(
    <T extends string | React.ReactNode>(en: T, ur: T): T => (isUr ? ur : en),
    [isUr]
  );

  const statusText = useCallback(
    (status: string): string => {
      const norm = status.toUpperCase();
      if (!isUr) {
        const enOverrides: Record<string, string> = {
          REQUESTED: 'Requested',
          SCHEDULED: 'Scheduled',
          IN_PROGRESS: 'In Progress',
          COMPLETED: 'Completed',
          CANCELLED: 'Cancelled',
          DISPUTED: 'Disputed',
          RESOLVED_UPHELD: 'Upheld',
          RESOLVED_DISMISSED: 'Dismissed',
          WORKER_RESPONDED: 'Worker Responded',
        };
        return enOverrides[norm] || norm.replace(/_/g, ' ');
      }
      const map: Record<string, string> = {
        VERIFIED: 'تصدیق شدہ',
        ACTIVE: 'فعال',
        APPROVED: 'منظور شدہ',
        ACCEPTED: 'قبول شدہ',
        RESOLVED: 'حل شدہ',
        COMPLETED: 'مکمل',
        SCHEDULED: 'طے شدہ',
        IN_PROGRESS: 'جاری ہے',
        REQUESTED: 'درخواست شدہ',
        PENDING: 'زیرِ التواء',
        UNDER_REVIEW: 'زیرِ جائزہ',
        IN_REVIEW: 'زیرِ جائزہ',
        EVIDENCE_ADDED: 'ثبوت شامل',
        SUBMITTED: 'جمع شدہ',
        OPEN: 'کھلا',
        NEEDS_MORE_EVIDENCE: 'مزید ثبوت درکار',
        NEEDS_REVISION: 'تجدید درکار',
        EXPIRED: 'میعاد ختم',
        NOT_VERIFIED: 'غیر تصدیق شدہ',
        NOT_STARTED: 'شروع نہیں ہوا',
        NOT_APPLIED: 'درخواست نہیں دی',
        REJECTED: 'مسترد',
        REVOKED: 'منسوخ',
        SUSPENDED: 'معطل',
        DECLINED: 'انکار شدہ',
        CANCELLED: 'منسوخ شدہ',
        DISPUTED: 'متنازعہ',
        DISMISSED: 'خارج',
        WORKER_RESPONDED: 'ہنرمند کا جواب موصول',
        RESOLVED_UPHELD: 'شکایت برقرار',
        RESOLVED_DISMISSED: 'شکایت خارج',
        VALID: 'درست / قابلِ تصدیق',
      };
      return map[norm] || norm.replace(/_/g, ' ');
    },
    [isUr]
  );

  const levelText = useCallback(
    (level?: string | null): string => {
      switch (level) {
        case 'ADVANCED':
          return isUr ? 'درجہ ۳ — اعلیٰ' : 'Level 3 — Advanced';
        case 'COMPETENT':
          return isUr ? 'درجہ ۲ — ماہر' : 'Level 2 — Competent';
        case 'BASIC':
          return isUr ? 'درجہ ۱ — بنیادی' : 'Level 1 — Basic';
        default:
          return isUr ? 'درجہ بندی نہیں ہوئی' : 'Not Rated';
      }
    },
    [isUr]
  );

  const tierText = useCallback(
    (tier?: string | null): string => {
      switch ((tier || '').toUpperCase()) {
        case 'PLATINUM':
          return isUr ? 'پلاٹینم کاریگر' : 'Platinum Karigar';
        case 'GOLD':
          return isUr ? 'گولڈ کاریگر' : 'Gold Karigar';
        case 'SILVER':
          return isUr ? 'سلور کاریگر' : 'Silver Karigar';
        case 'BRONZE':
          return isUr ? 'کانسی کاریگر' : 'Bronze Karigar';
        default:
          return isUr ? 'ابھی کوئی درجہ نہیں' : 'No Tier Yet';
      }
    },
    [isUr]
  );

  const roleText = useCallback(
    (role: UserRole | string): string => {
      if (!isUr) {
        if (role === 'EMPLOYER') return 'Customer / Employer';
        return role;
      }
      const map: Record<string, string> = {
        WORKER: 'ہنرمند (ورکر)',
        EMPLOYER: 'گاہک / آجِر',
        ASSESSOR: 'ماہرِ جائزہ (ایسیسر)',
        ADMIN: 'ایڈمن',
      };
      return map[role] || role;
    },
    [isUr]
  );

  return {
    lang,
    isUr,
    isRtl: isUr,
    setLang,
    toggleLang,
    bi,
    statusText,
    levelText,
    tierText,
    roleText,
  };
}
