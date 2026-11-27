import React from 'react';
import { Award, ShieldAlert, ShieldCheck, Star } from 'lucide-react';
import { useI18n } from '../../i18n/translations';
import { KarigarTier } from '../../services/storage/types';

export function TierPill({
  tier,
  underReview = false,
  tierStatus = 'ACTIVE',
  compact = false,
}: {
  tier?: KarigarTier | string | null;
  underReview?: boolean;
  tierStatus?: string;
  compact?: boolean;
}) {
  const { tierText, bi } = useI18n();
  const norm = (tier || 'NONE').toUpperCase();
  if (norm === 'NONE' || tierStatus === 'EXPIRED') return null;

  const palette: Record<string, string> = {
    PLATINUM: 'border-slate-300 bg-gradient-to-r from-slate-800 to-slate-700 text-white',
    GOLD: 'border-amber-300 bg-amber-50 text-amber-900',
    SILVER: 'border-slate-300 bg-slate-100 text-slate-800',
    BRONZE: 'border-orange-200 bg-orange-50 text-orange-900',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-semibold whitespace-nowrap ${
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${palette[norm] || 'border-[#E6E0D2] bg-[#F7F4EC] text-[#17251E]'}`}
    >
      <Award className="h-3.5 w-3.5 shrink-0" />
      <span>{tierText(norm)}</span>
      {underReview && (
        <span className="ms-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-red-700">
          · <ShieldAlert className="h-3 w-3" /> {bi('Under Review', 'زیرِ جائزہ')}
        </span>
      )}
    </span>
  );
}

export function StarRatingInline({
  rating,
  count,
  showEmpty = true,
}: {
  rating: number;
  count: number;
  showEmpty?: boolean;
}) {
  const { bi } = useI18n();
  if (count === 0 && !showEmpty) return null;
  if (count === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[#69726B]">
        <Star className="h-3.5 w-3.5 text-[#C7D4CC]" />
        <span>{bi('New · No reviews yet', 'نیا · ابھی کوئی ریویو نہیں')}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#17251E] tabular-nums">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
      <span>{rating.toFixed(1)}</span>
      <span className="font-normal text-[#69726B]">
        ({count} {bi('verified', 'تصدیق شدہ')})
      </span>
    </span>
  );
}

export function TrustScoreBadge({ score, compact = false }: { score: number; compact?: boolean }) {
  const { bi } = useI18n();
  const color =
    score >= 80
      ? 'text-[#176B4A] bg-[#ECE6D7]/70 border-[#D8D0BE]'
      : score >= 60
        ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
        : 'text-[#17251E] bg-[#F7F4EC] border-[#E6E0D2]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border font-bold tabular-nums whitespace-nowrap ${color} ${
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#176B4A]" />
      <span>
        {bi('Trust', 'اعتماد')}: {score}/100
      </span>
    </span>
  );
}

export function RatingDistributionCard({
  summary,
}: {
  summary: {
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
  };
}) {
  const { bi } = useI18n();

  const subMetrics = [
    { label: bi('Quality of Work', 'کام کا معیار'), val: summary.subAverages.quality },
    { label: bi('Punctuality', 'وقت کی پابندی'), val: summary.subAverages.punctuality },
    { label: bi('Behaviour & Professionalism', 'رویہ اور اخلاق'), val: summary.subAverages.behaviour },
    { label: bi('Value for Money', 'مناسب قیمت'), val: summary.subAverages.value },
  ];

  return (
    <div className="rounded-2xl border border-[#D8D0BE] bg-[#ECE6D7]/80 p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-4 flex flex-col justify-center">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-[#17251E] tabular-nums">
            {summary.totalReviews > 0 ? summary.bayesianRating.toFixed(1) : '—'}
          </span>
          <span className="text-sm font-semibold text-[#4D6357]">/ 5.0</span>
        </div>
        <div className="mt-1 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-4 w-4 ${
                summary.bayesianRating >= s - 0.3
                  ? 'fill-amber-400 text-amber-500'
                  : 'text-[#D8D0BE]'
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-[#4D6357]">
          {bi(
            `Weighted average across ${summary.totalReviews} verified completed job(s)`,
            `${summary.totalReviews} تصدیق شدہ مکمل کاموں کی اوسط درجہ بندی`
          )}
        </p>
      </div>

      <div className="md:col-span-4 space-y-1.5">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const cnt = summary.distribution[star] || 0;
          const pct = summary.totalReviews > 0 ? Math.round((cnt / summary.totalReviews) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-7 font-semibold text-[#17251E] tabular-nums">{star}★</span>
              <div className="flex-1 h-2 rounded-full bg-[#E3DCC9] overflow-hidden">
                <div className="h-full rounded-full bg-[#176B4A]" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-7 text-end text-[#4D6357] tabular-nums">{cnt}</span>
            </div>
          );
        })}
      </div>

      <div className="md:col-span-4 grid grid-cols-2 gap-3">
        {subMetrics.map((m) => (
          <div key={String(m.label)} className="rounded-xl border border-[#D8D0BE] bg-[#F3EFE4] p-2.5">
            <p className="text-[11px] text-[#4D6357] leading-tight">{m.label}</p>
            <p className="mt-1 text-sm font-bold text-[#176B4A] tabular-nums">
              {summary.totalReviews > 0 ? `${m.val.toFixed(1)} / 5` : '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
