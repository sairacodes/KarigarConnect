import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Award, CheckCircle2, Copy, Printer, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../i18n/translations';
import { useToast } from '../../context/ToastContext';
import { TierPill, TrustScoreBadge } from './RatingDisplay';

export function QrPassportCard({
  workerName,
  city,
  tradeName,
  passportId,
  publicId,
  tier,
  trustScore,
  verifiedCount,
  completedJobsCount,
  rating,
  totalReviews,
}: {
  workerName: string;
  city: string;
  tradeName: string;
  passportId: string;
  publicId: string;
  tier?: string;
  trustScore: number;
  verifiedCount: number;
  completedJobsCount: number;
  rating: number;
  totalReviews: number;
}) {
  const { bi } = useI18n();
  const { showToast } = useToast();
  const [qrUrl, setQrUrl] = useState<string>('');

  const verifyPath = `${window.location.origin}/verify-badge?code=${encodeURIComponent(passportId)}`;
  const profileUrl = `${window.location.origin}/workers/${encodeURIComponent(publicId)}`;

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(verifyPath, {
      width: 180,
      margin: 1,
      color: { dark: '#17251E', light: '#FFFFFF' },
    })
      .then((url) => {
        if (active) setQrUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [verifyPath]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(verifyPath);
      showToast(bi('Verification link copied!', 'تصدیقی لنک کاپی ہو گیا!'), 'success');
    } catch {
      showToast(bi('Copy the link from the field.', 'براہِ کرم لنک کاپی کریں۔'), 'info');
    }
  };

  return (
    <div className="rounded-2xl border border-[#D8D0BE] bg-white p-6 shadow-sm print:shadow-none print:border-[#176B4A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-2.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#176B4A]">
              <ShieldCheck className="h-4 w-4" />
              {bi('KARIGAR PASSPORT', 'کاریگر پاسپورٹ')}
            </span>
            <TierPill tier={tier} compact />
            <TrustScoreBadge score={trustScore} compact />
          </div>
          <h3 className="text-xl font-extrabold text-[#17251E]">{workerName}</h3>
          <p className="text-sm text-[#69726B]">
            {tradeName} · {city}
          </p>
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="rounded-xl bg-[#F7F4EC] p-2.5 border border-[#E6E0D2]">
              <p className="text-[11px] text-[#69726B]">{bi('Verified Skills', 'تصدیق شدہ مہارتیں')}</p>
              <p className="text-sm font-bold text-[#176B4A] tabular-nums">{verifiedCount}</p>
            </div>
            <div className="rounded-xl bg-[#F7F4EC] p-2.5 border border-[#E6E0D2]">
              <p className="text-[11px] text-[#69726B]">{bi('Jobs Done', 'مکمل کام')}</p>
              <p className="text-sm font-bold text-[#17251E] tabular-nums">{completedJobsCount}</p>
            </div>
            <div className="rounded-xl bg-[#F7F4EC] p-2.5 border border-[#E6E0D2]">
              <p className="text-[11px] text-[#69726B]">{bi('Customer Rating', 'کسٹمر ریٹنگ')}</p>
              <p className="text-sm font-bold text-[#17251E] tabular-nums">
                {totalReviews > 0 ? `${rating.toFixed(1)}★ (${totalReviews})` : '—'}
              </p>
            </div>
          </div>
          <div className="pt-1 flex flex-wrap items-center gap-2 text-xs text-[#69726B]">
            <span className="font-mono font-bold text-[#17251E] bg-[#ECE6D7]/60 px-2.5 py-1 rounded-lg">
              {passportId}
            </span>
            <span className="inline-flex items-center gap-1 text-[#176B4A]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {bi('Public portfolio:', 'عوامی پروفائل:')} {publicId}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E6E0D2] bg-[#F7F4EC] p-3.5 shrink-0">
          {qrUrl ? (
            <img src={qrUrl} alt={`QR Code for ${passportId}`} className="h-32 w-32 rounded-lg" />
          ) : (
            <div className="h-32 w-32 rounded-lg bg-[#E6E0D2] flex items-center justify-center">
              <Award className="h-8 w-8 text-[#176B4A]" />
            </div>
          )}
          <span className="mt-2 text-[10px] font-mono text-[#69726B]">{bi('Scan to verify', 'تصدیق کے لیے اسکین کریں')}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#E6E0D2] flex flex-wrap items-center justify-between gap-2 print:hidden">
        <span className="text-[11px] text-[#69726B] truncate max-w-md">{profileUrl}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6E0D2] bg-white px-3 py-1.5 text-xs font-semibold text-[#17251E] hover:bg-[#F7F4EC]"
          >
            <Copy className="h-3.5 w-3.5 text-[#176B4A]" />
            {bi('Copy Verify Link', 'تصدیقی لنک کاپی کریں')}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#176B4A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#13563B]"
          >
            <Printer className="h-3.5 w-3.5" />
            {bi('Print / Save PDF', 'پرنٹ / پی ڈی ایف')}
          </button>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-[#69726B]">
        {bi(
          'A verified badge means a competency was assessed by an authorized KARIGAR CONNECT assessor using a defined rubric. It is not government accreditation.',
          'تصدیقی بیج کا مطلب یہ ہے کہ مہارت کو منظور شدہ کاریگر کنیکٹ ماہرِ جائزہ نے طے شدہ معیار پر پرکھا ہے۔ یہ سرکاری سند نہیں ہے۔'
        )}
      </p>
    </div>
  );
}
