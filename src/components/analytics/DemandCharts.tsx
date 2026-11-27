import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { useI18n } from '../../i18n/translations';

export interface InDemandSkillDatum {
  tradeId: string;
  slug: string;
  name: string;
  urduName: string;
  group: string;
  requestsCount: number;
  completedCount: number;
  availableKarigars: number;
  avgPkr: number | null;
}

export interface CategoryDistributionDatum {
  group: string;
  urduGroup: string;
  count: number;
  percentage: number;
}

export interface MonthlyTrendDatum {
  key: string;
  label: string;
  urduLabel: string;
  requestsCount: number;
  completedCount: number;
}

export interface LocationDemandDatum {
  city: string;
  requestsCount: number;
  completedCount: number;
  availableKarigars: number;
  topSkill: string | null;
  isSelectedCity: boolean;
}

const DOUGHNUT_PALETTE = [
  '#11221B',
  '#176B4A',
  '#26805B',
  '#399B6B',
  '#56B383',
  '#C9973A',
  '#D8D0BE',
  '#ECE6D7',
];

export function InDemandSkillsBarChart({
  data,
  onSelectTrade,
}: {
  data: InDemandSkillDatum[];
  onSelectTrade?: (slug: string) => void;
}) {
  const { bi, isUr } = useI18n();
  const prefersReduced = useReducedMotion();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(1, ...data.map((d) => d.requestsCount));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-[#F3EFE4] border border-[#E2DBCB] p-6 text-center text-sm text-[#4D6357]">
        {bi(
          'No skill request activity matches the current category, city, and time window filters.',
          'منتخب کردہ کیٹیگری، شہر اور مدت کے مطابق ابھی کوئی ڈیمانڈ ریکارڈ موجود نہیں۔'
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hoveredIdx !== null && data[hoveredIdx] ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#11221B] px-3.5 py-2 text-xs text-white shadow-sm">
          <span className="font-bold">
            {isUr && data[hoveredIdx].urduName ? data[hoveredIdx].urduName : data[hoveredIdx].name}
          </span>
          <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums text-[#D8D0BE]">
            <span>
              {data[hoveredIdx].requestsCount} {bi('requests', 'درخواستیں')}
            </span>
            <span>·</span>
            <span>
              {data[hoveredIdx].availableKarigars} {bi('Karigars', 'کاریگر')}
            </span>
            {data[hoveredIdx].avgPkr ? (
              <>
                <span>·</span>
                <span>Avg PKR {data[hoveredIdx].avgPkr.toLocaleString()}</span>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl bg-[#F3EFE4] border border-[#E2DBCB] px-3.5 py-2 text-xs text-[#4D6357]">
          <span>{bi('Hover or tap a skill bar to inspect supply & rates', 'تفصیلات دیکھنے کے لیے کسی بھی ہنر پر ہوور یا کلک کریں')}</span>
          <span className="font-mono font-semibold text-[#176B4A] tabular-nums">
            {bi('Top', 'نمایاں')} {data.length}
          </span>
        </div>
      )}

      <div className="space-y-2.5 pt-1">
        {data.map((item, idx) => {
          const widthPct = Math.max(8, Math.round((item.requestsCount / maxVal) * 100));
          const isHovered = hoveredIdx === idx;
          const barTone =
            idx === 0
              ? 'from-[#11221B] to-[#176B4A]'
              : idx <= 2
                ? 'from-[#176B4A] to-[#399B6B]'
                : 'from-[#399B6B] to-[#C9973A]';

          return (
            <button
              key={item.tradeId}
              type="button"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onFocus={() => setHoveredIdx(idx)}
              onClick={() => onSelectTrade?.(item.slug)}
              className={`w-full rounded-xl p-2 text-start transition-colors ${
                isHovered ? 'bg-[#F3EFE4]' : 'hover:bg-[#F3EFE4]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[11px] font-bold text-[#176B4A] tabular-nums w-5 shrink-0">
                    0{idx + 1}
                  </span>
                  <span className="font-bold text-[#11221B] truncate">
                    {isUr && item.urduName ? item.urduName : item.name}
                  </span>
                  <span className="hidden sm:inline text-[11px] text-[#5B6D63] truncate">
                    ({item.availableKarigars} {bi('available', 'دستیاب')})
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 font-mono text-xs font-extrabold text-[#176B4A] tabular-nums shrink-0">
                  <span>{item.requestsCount}</span>
                  <ArrowUpRight className="h-3 w-3 opacity-70 rtl:-scale-x-100" />
                </span>
              </div>

              <div className="h-3 w-full rounded-full bg-[#F3EFE4] overflow-hidden">
                <motion.div
                  initial={prefersReduced ? { width: `${widthPct}%` } : { width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.55, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-full rounded-full bg-gradient-to-r ${barTone}`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CategoryDoughnutChart({
  data,
  activeCategory,
  onSelectCategory,
}: {
  data: CategoryDistributionDatum[];
  activeCategory: string;
  onSelectCategory?: (group: string) => void;
}) {
  const { bi, isUr } = useI18n();
  const prefersReduced = useReducedMotion();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const totalCount = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data]);

  const segments = useMemo(() => {
    const radius = 68;
    const circumference = 2 * Math.PI * radius;
    let cumulativeFraction = 0;

    return data.map((item, idx) => {
      const fraction = totalCount > 0 ? item.count / totalCount : 0;
      const strokeLength = Math.max(0, fraction * circumference - 2.5);
      const offset = -cumulativeFraction * circumference;
      cumulativeFraction += fraction;
      return {
        ...item,
        color: DOUGHNUT_PALETTE[idx % DOUGHNUT_PALETTE.length],
        circumference,
        strokeLength,
        offset,
      };
    });
  }, [data, totalCount]);

  if (data.length === 0 || totalCount === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-[#F3EFE4] border border-[#E2DBCB] p-6 text-center text-sm text-[#4D6357]">
        {bi(
          'No category distribution data found for the current filters.',
          'موجودہ فلٹرز کے لیے کیٹیگری کی تقسیم کا ڈیٹا دستیاب نہیں۔'
        )}
      </div>
    );
  }

  const activeSlice = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
      <div className="sm:col-span-5 flex items-center justify-center">
        <div className="relative h-48 w-48">
          <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="90" cy="90" r="68" fill="none" stroke="#ECE6D7" strokeWidth="22" />
            {segments.map((seg, idx) => {
              const isHighlighted =
                hoveredIdx === idx ||
                (activeCategory !== 'ALL' && activeCategory.toLowerCase() === seg.group.toLowerCase());
              return (
                <motion.circle
                  key={seg.group}
                  cx="90"
                  cy="90"
                  r="68"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isHighlighted ? 26 : 22}
                  strokeDasharray={`${seg.strokeLength} ${seg.circumference}`}
                  strokeDashoffset={seg.offset}
                  initial={prefersReduced ? false : { opacity: 0 }}
                  animate={{ opacity: hoveredIdx !== null && hoveredIdx !== idx ? 0.45 : 1 }}
                  transition={{ duration: 0.3 }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => onSelectCategory?.(seg.group)}
                  className="cursor-pointer transition-all duration-200"
                />
              );
            })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <p className="font-mono text-2xl font-extrabold text-[#11221B] tabular-nums leading-none">
              {activeSlice ? `${activeSlice.percentage}%` : totalCount}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[#4D6357] line-clamp-2 leading-tight">
              {activeSlice
                ? isUr
                  ? activeSlice.urduGroup
                  : activeSlice.group
                : bi('Total Requests', 'کل درخواستیں')}
            </p>
          </div>
        </div>
      </div>

      <div className="sm:col-span-7 space-y-2">
        {segments.map((seg, idx) => {
          const isHovered = hoveredIdx === idx;
          const isFiltered =
            activeCategory !== 'ALL' && activeCategory.toLowerCase() === seg.group.toLowerCase();
          return (
            <button
              key={seg.group}
              type="button"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSelectCategory?.(isFiltered ? 'ALL' : seg.group)}
              className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-start text-xs transition-colors ${
                isHovered || isFiltered ? 'bg-[#ECE6D7]' : 'hover:bg-[#F3EFE4]'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="font-semibold text-[#11221B] truncate">
                  {isUr ? seg.urduGroup : seg.group}
                </span>
              </span>
              <span className="font-mono font-bold text-[#176B4A] tabular-nums shrink-0">
                {seg.count} ({seg.percentage}%)
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MonthlyDemandLineChart({ data }: { data: MonthlyTrendDatum[] }) {
  const { bi, isUr } = useI18n();
  const prefersReduced = useReducedMotion();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 560;
  const height = 220;
  const padX = 38;
  const padTop = 24;
  const padBottom = 34;
  const chartW = width - padX * 2;
  const chartH = height - padTop - padBottom;

  const maxY = Math.max(4, ...data.map((d) => Math.max(d.requestsCount, d.completedCount)));

  const points = useMemo(() => {
    const count = Math.max(1, data.length - 1);
    return data.map((d, idx) => {
      const x = data.length === 1 ? padX + chartW / 2 : padX + (idx / count) * chartW;
      const yReq = padTop + chartH - (d.requestsCount / maxY) * chartH;
      const yComp = padTop + chartH - (d.completedCount / maxY) * chartH;
      return { ...d, x, yReq, yComp };
    });
  }, [data, maxY, chartW, chartH]);

  const totalLinePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yReq.toFixed(1)}`).join(' ');
  }, [points]);

  const completedLinePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yComp.toFixed(1)}`).join(' ');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `${totalLinePath} L ${last.x.toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${first.x.toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`;
  }, [points, totalLinePath, chartH]);

  if (data.length === 0 || data.every((d) => d.requestsCount === 0 && d.completedCount === 0)) {
    return (
      <div className="flex h-60 items-center justify-center rounded-2xl bg-[#F3EFE4] border border-[#E2DBCB] p-6 text-center text-sm text-[#4D6357]">
        {bi(
          'No monthly request trend points recorded for this selection yet.',
          'اس انتخاب کے لیے ابھی ماہانہ رجحان کا کوئی ریکارڈ دستیاب نہیں۔'
        )}
      </div>
    );
  }

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#11221B]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#176B4A]" />
            <span>{bi('Demand Requests', 'کل ڈیمانڈ درخواستیں')}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#176B4A]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C9973A]" />
            <span>{bi('Completed Jobs', 'مکمل شدہ کام')}</span>
          </span>
        </div>
        {activePoint && (
          <div className="rounded-lg bg-[#ECE6D7] px-3 py-1 font-mono text-[11px] font-bold text-[#11221B] tabular-nums">
            {isUr ? activePoint.urduLabel : activePoint.label}: {activePoint.requestsCount}{' '}
            {bi('req', 'درخواست')} · {activePoint.completedCount} {bi('done', 'مکمل')}
          </div>
        )}
      </div>

      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-52 sm:h-56 overflow-visible">
          <defs>
            <linearGradient id="kc-demand-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#399B6B" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#399B6B" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Subtle horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padTop + chartH * (1 - t);
            const labelVal = Math.round(maxY * t);
            return (
              <g key={t}>
                <line
                  x1={padX}
                  x2={width - padX}
                  y1={y}
                  y2={y}
                  stroke="#ECE6D7"
                  strokeDasharray="3 4"
                  strokeWidth="1"
                />
                <text
                  x={padX - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#5B6D63] text-[10px] font-mono tabular-nums"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill="url(#kc-demand-area)" />}

          {/* Primary Demand Line */}
          <motion.path
            d={totalLinePath}
            fill="none"
            stroke="#176B4A"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={prefersReduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Secondary Completed Jobs Line */}
          <motion.path
            d={completedLinePath}
            fill="none"
            stroke="#5AC48A"
            strokeWidth="2.4"
            strokeDasharray="5 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={prefersReduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Interactive Data Points */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={pt.key}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {isHovered && (
                  <line
                    x1={pt.x}
                    x2={pt.x}
                    y1={padTop}
                    y2={padTop + chartH}
                    stroke="#11221B"
                    strokeOpacity="0.22"
                    strokeWidth="1.5"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.yReq}
                  r={isHovered ? 6 : 4}
                  fill="#FFFFFF"
                  stroke="#176B4A"
                  strokeWidth="2.5"
                />
                <circle
                  cx={pt.x}
                  cy={pt.yComp}
                  r={isHovered ? 5 : 3.2}
                  fill="#FFFFFF"
                  stroke="#399B6B"
                  strokeWidth="2"
                />
                <rect
                  x={pt.x - 24}
                  y={padTop}
                  width="48"
                  height={chartH + 20}
                  fill="transparent"
                />
                <text
                  x={pt.x}
                  y={height - 10}
                  textAnchor="middle"
                  className={`text-[11px] font-medium ${
                    isHovered ? 'fill-[#11221B] font-bold' : 'fill-[#4D6357]'
                  }`}
                >
                  {isUr ? pt.urduLabel : pt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function LocationDemandChart({
  data,
  onSelectCity,
}: {
  data: LocationDemandDatum[];
  onSelectCity?: (city: string) => void;
}) {
  const { bi } = useI18n();
  const prefersReduced = useReducedMotion();
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.requestsCount, d.availableKarigars)));

  if (data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center rounded-2xl bg-[#F3EFE4] border border-[#E2DBCB] p-6 text-center text-sm text-[#4D6357]">
        {bi('No city demand records available for this selection.', 'اس انتخاب کے لیے شہروں کی ڈیمانڈ کا ڈیٹا دستیاب نہیں۔')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#11221B]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#176B4A]" />
            <span>{bi('Skill Requests', 'سکل ڈیمانڈ')}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#176B4A]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C9973A]" />
            <span>{bi('Available Karigars', 'دستیاب کاریگر')}</span>
          </span>
        </div>
        <span className="text-[11px] text-[#5B6D63]">
          {bi('Click city to filter insights', 'فلٹر کے لیے شہر منتخب کریں')}
        </span>
      </div>

      <div className="space-y-3 pt-1">
        {data.map((row, idx) => {
          const reqPct = row.requestsCount > 0 ? Math.max(6, Math.round((row.requestsCount / maxVal) * 100)) : 0;
          const supPct = row.availableKarigars > 0 ? Math.max(6, Math.round((row.availableKarigars / maxVal) * 100)) : 0;
          const isHovered = hoveredCity === row.city;

          return (
            <button
              key={row.city}
              type="button"
              onMouseEnter={() => setHoveredCity(row.city)}
              onMouseLeave={() => setHoveredCity(null)}
              onClick={() => onSelectCity?.(row.isSelectedCity ? 'ALL' : row.city)}
              className={`w-full rounded-2xl p-3 text-start transition-all border ${
                row.isSelectedCity
                  ? 'bg-[#ECE6D7] border-[#176B4A]'
                  : isHovered
                    ? 'bg-[#F3EFE4] border-[#D8D0BE]'
                    : 'bg-[#F3EFE4] border-[#E2DBCB] hover:bg-[#F3EFE4]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="h-3.5 w-3.5 text-[#176B4A] shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-[#11221B]">{row.city}</span>
                  {row.topSkill && (
                    <span className="rounded-full bg-white border border-[#E2DBCB] px-2 py-0.5 text-[10px] font-semibold text-[#176B4A] truncate max-w-[140px]">
                      {bi('Top:', 'نمایاں:')} {row.topSkill}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px] font-bold tabular-nums shrink-0">
                  <span className="text-[#11221B]">
                    {row.requestsCount} {bi('req', 'درخواست')}
                  </span>
                  <span className="text-[#176B4A]">
                    {row.availableKarigars} {bi('pros', 'ماہر')}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-[#ECE6D7] overflow-hidden">
                  <motion.div
                    initial={prefersReduced ? { width: `${reqPct}%` } : { width: 0 }}
                    animate={{ width: `${reqPct}%` }}
                    transition={{ duration: 0.45, delay: idx * 0.04 }}
                    className="h-full rounded-full bg-[#176B4A]"
                  />
                </div>
                <div className="h-2 w-full rounded-full bg-[#ECE6D7] overflow-hidden">
                  <motion.div
                    initial={prefersReduced ? { width: `${supPct}%` } : { width: 0 }}
                    animate={{ width: `${supPct}%` }}
                    transition={{ duration: 0.45, delay: idx * 0.04 + 0.05 }}
                    className="h-full rounded-full bg-[#C9973A]"
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
