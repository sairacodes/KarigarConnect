import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  FileWarning,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../i18n/translations';

export function formatDate(dateStr?: string | null, lang: 'en' | 'ur' = 'en'): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatLevelLabel(level?: string | null, lang: 'en' | 'ur' = 'en'): string {
  const isUr = lang === 'ur';
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
}

export function StatusLabel({ status }: { status: string }) {
  const { statusText } = useI18n();
  const normalized = status.toUpperCase();
  const label = statusText(normalized);

  if (['VERIFIED', 'ACTIVE', 'APPROVED', 'ACCEPTED', 'RESOLVED', 'COMPLETED', 'VALID'].includes(normalized)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#176B4A]">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#399B6B]" />
        <span>{label}</span>
      </span>
    );
  }
  if (['PENDING', 'UNDER_REVIEW', 'IN_REVIEW', 'EVIDENCE_ADDED', 'SUBMITTED', 'OPEN', 'REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'WORKER_RESPONDED'].includes(normalized)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }
  if (['NEEDS_MORE_EVIDENCE', 'NEEDS_REVISION', 'EXPIRED', 'DISPUTED'].includes(normalized)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }
  if (['NOT_VERIFIED', 'REJECTED', 'REVOKED', 'SUSPENDED', 'DECLINED', 'DISMISSED', 'CANCELLED', 'RESOLVED_UPHELD'].includes(normalized)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
        <XCircle className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }
  return <span className="text-xs font-medium text-[#78857D]">{label}</span>;
}

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 rounded-2xl bg-[#E5EEE8]/80" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-8 sm:p-10 text-center kc-glass-card">
      <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DDF3E4] text-[#176B4A]">
        <FileWarning className="h-5 w-5" />
      </div>
      <h3 className="text-base font-bold text-[#17251E]">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-[#78857D]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { bi } = useI18n();
  if (!open) return null;
  const resolvedConfirm = confirmLabel || bi('Confirm', 'تصدیق کریں');
  const resolvedCancel = cancelLabel || bi('Cancel', 'منسوخ کریں');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251E]/45 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#B8E4C7] bg-[#F2FAF5]/98 backdrop-blur-md p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold text-[#17251E]">{title}</h3>
          <button type="button" onClick={onCancel} className="text-[#78857D] hover:text-[#17251E]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-[#78857D] leading-relaxed">{message}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-[#E5EEE8] bg-white px-4 py-2 text-sm font-semibold text-[#17251E] hover:bg-[#F7FAF8]"
          >
            {resolvedCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
              destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#176B4A] hover:bg-[#13563B]'
            }`}
          >
            {loading ? bi('Processing...', 'جاری ہے...') : resolvedConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BadgeCard({
  workerName,
  tradeName,
  competencyTitle,
  level,
  assessorName,
  issuedAt,
  expiresAt,
  status = 'ACTIVE',
}: {
  workerName: string;
  tradeName: string;
  competencyTitle: string;
  level: string;
  assessorName: string;
  issuedAt: string;
  expiresAt: string;
  status?: string;
}) {
  const { lang, bi } = useI18n();
  const isExpired = status === 'EXPIRED' || new Date(expiresAt).getTime() <= Date.now();
  const levelAccent =
    level === 'ADVANCED'
      ? 'border-[#73C99B] bg-gradient-to-br from-[#EAF7EE] to-[#CBEBD5]/90 backdrop-blur-md'
      : level === 'COMPETENT'
        ? 'border-[#9BD9B4] bg-gradient-to-br from-[#F0FAF3] to-[#DDF3E4]/90 backdrop-blur-md'
        : 'kc-glass-card';

  return (
    <div
      className={`rounded-2xl border p-5 kc-hover-lift kc-card-shadow ${
        isExpired ? 'border-[#C6E2CF] bg-[#EAF5EE]/90 opacity-80' : levelAccent
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#399B6B]">
            {tradeName} · {formatLevelLabel(level, lang)}
          </p>
          <h4 className="mt-1 text-base font-bold text-[#17251E]">{competencyTitle}</h4>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isExpired
              ? 'bg-[#E5EEE8] text-[#78857D]'
              : level === 'ADVANCED'
                ? 'bg-[#176B4A] text-white'
                : level === 'COMPETENT'
                  ? 'bg-[#399B6B] text-white'
                  : 'bg-[#DDF3E4] text-[#176B4A]'
          }`}
        >
          {level === 'ADVANCED' ? <Award className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#E5EEE8] pt-3 text-xs">
        <div>
          <dt className="text-[#78857D]">{bi('Holder', 'ہنرمند')}</dt>
          <dd className="font-semibold text-[#17251E] truncate">{workerName}</dd>
        </div>
        <div>
          <dt className="text-[#78857D]">{bi('Assessed By', 'جائزہ کار')}</dt>
          <dd className="font-semibold text-[#17251E] truncate">{assessorName}</dd>
        </div>
        <div>
          <dt className="text-[#78857D]">{bi('Issued', 'تاریخِ اجراء')}</dt>
          <dd className="font-mono tabular-nums text-[#17251E]">{formatDate(issuedAt, lang)}</dd>
        </div>
        <div>
          <dt className="text-[#78857D]">{isExpired ? bi('Expired', 'میعاد ختم') : bi('Valid Until', 'قابلِ قبول تا')}</dt>
          <dd className={`font-mono tabular-nums ${isExpired ? 'text-red-700 font-semibold' : 'text-[#176B4A] font-medium'}`}>
            {formatDate(expiresAt, lang)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-[11px] text-[#78857D] leading-snug">
        {bi(
          'Rubric-assessed competency badge by an approved KARIGAR CONNECT assessor. Not a government accreditation.',
          'یہ بیج کاریگر کنیکٹ کے منظور شدہ ماہرِ جائزہ کی جانچ کی بنیاد پر جاری کیا گیا ہے اور یہ سرکاری سند نہیں ہے۔'
        )}
      </p>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
}) {
  const { bi } = useI18n();
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-[#E5EEE8] pt-4 text-sm">
      <span className="text-[#78857D] tabular-nums">
        {bi(`Page ${page} of ${totalPages}`, `صفحہ ${page} از ${totalPages}`)}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-xl border border-[#E5EEE8] bg-white px-3.5 py-1.5 text-sm font-medium text-[#17251E] hover:bg-[#DDF3E4]/50 disabled:opacity-50"
        >
          {bi('Previous', 'پچھلا')}
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-xl border border-[#E5EEE8] bg-white px-3.5 py-1.5 text-sm font-medium text-[#17251E] hover:bg-[#DDF3E4]/50 disabled:opacity-50"
        >
          {bi('Next', 'اگلا')}
        </button>
      </div>
    </div>
  );
}

export function ReportModal({
  open,
  targetType,
  targetId,
  targetLabel,
  onClose,
}: {
  open: boolean;
  targetType: 'WORKER_PROFILE' | 'EVIDENCE' | 'REVIEW' | 'JOB_SOS';
  targetId: string;
  targetLabel: string;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const { bi } = useI18n();
  const [reason, setReason] = useState('Suspicious or inaccurate claims');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reports', { targetType, targetId, reason, details });
      showToast(bi('Report submitted for administrator moderation.', 'رپورٹ ایڈمن جائزے کے لیے جمع کر دی گئی ہے۔'), 'success');
      setDetails('');
      onClose();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251E]/45 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#B8E4C7] bg-[#F2FAF5]/98 backdrop-blur-md p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#17251E]">{bi('Report Content', 'مواد کی رپورٹ کریں')}</h3>
            <p className="text-xs text-[#78857D] mt-0.5">{targetLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#78857D] hover:text-[#17251E]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#17251E] mb-1">{bi('Reason', 'وجہ')}</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm text-[#17251E] focus:border-[#399B6B] focus:bg-white focus:outline-none"
            >
              <option value="Suspicious or inaccurate claims">{bi('Suspicious or inaccurate claims', 'مشکوک یا غلط دعوے')}</option>
              <option value="Unsafe work practices shown">{bi('Unsafe work practices shown', 'غیر محفوظ کام کا طریقہ')}</option>
              <option value="Inappropriate or offensive content">{bi('Inappropriate or offensive content', 'نامناسب یا قابلِ اعتراض مواد')}</option>
              <option value="Impersonation or stolen media">{bi('Impersonation or stolen media', 'جعلی شناخت یا چوری شدہ تصاویر/ویڈیو')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#17251E] mb-1">{bi('Details (optional)', 'تفصیلات (اختیاری)')}</label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={bi('Provide context for the moderation team...', 'ماڈریشن ٹیم کے لیے مزید وضاحت لکھیں...')}
              className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm text-[#17251E] focus:border-[#399B6B] focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E5EEE8] px-4 py-2 text-sm font-semibold text-[#17251E] hover:bg-[#F7FAF8]"
            >
              {bi('Cancel', 'منسوخ کریں')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#176B4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
            >
              {submitting ? bi('Submitting...', 'جمع ہو رہا ہے...') : bi('Submit Report', 'رپورٹ جمع کریں')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
