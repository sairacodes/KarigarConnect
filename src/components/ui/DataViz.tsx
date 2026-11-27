import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export function StatKpiCard({
  label,
  value,
  sublabel,
  highlighted = false,
  to,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  sublabel?: string;
  highlighted?: boolean;
  to?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const cardClass = highlighted
    ? 'kc-kpi-gradient border border-[#176B4A] text-white shadow-sm kc-hover-lift'
    : 'kc-glass-card text-[#17251E]';

  const content = (
    <div
      className={`group relative rounded-2xl p-5 ${cardClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`text-sm font-medium ${
            highlighted ? 'text-[#ECE6D7]' : 'text-[#17251E]'
          }`}
        >
          {label}
        </span>
        <span
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
            highlighted
              ? 'border-white/30 bg-white/95 text-[#176B4A] group-hover:bg-white'
              : 'border-[#D8D0BE] bg-[#ECE6D7] text-[#176B4A] group-hover:border-[#399B6B] group-hover:bg-[#E3DCC9]'
          }`}
        >
          <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
        </span>
      </div>

      <p
        className={`mt-3 text-3xl sm:text-[34px] font-extrabold tracking-tight tabular-nums leading-none ${
          highlighted ? 'text-white' : 'text-[#17251E]'
        }`}
      >
        {value}
      </p>

      {(sublabel || Icon) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {Icon && (
            <Icon
              className={`h-3.5 w-3.5 shrink-0 ${
                highlighted ? 'text-[#D8D0BE]' : 'text-[#399B6B]'
              }`}
            />
          )}
          {sublabel && (
            <span className={highlighted ? 'text-[#ECE6D7]' : 'text-[#69726B]'}>
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block focus:outline-none">
        {content}
      </Link>
    );
  }
  return content;
}

export interface BarDatum {
  label: string;
  shortLabel?: string;
  value: number;
  variant?: 'dark' | 'medium' | 'light' | 'hatched';
}

export function AnimatedBarChart({
  title,
  subtitle,
  data,
  unitLabel = '',
}: {
  title: string;
  subtitle?: string;
  data: BarDatum[];
  unitLabel?: string;
}) {
  const prefersReduced = useReducedMotion();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="rounded-2xl p-5 sm:p-6 kc-glass-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#17251E]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-[#69726B]">{subtitle}</p>}
        </div>
        {hoveredIdx !== null && data[hoveredIdx] ? (
          <span className="text-xs font-semibold text-[#176B4A] font-mono tabular-nums">
            {data[hoveredIdx].label}: {data[hoveredIdx].value}
            {unitLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-6 flex items-end justify-between gap-2 sm:gap-3 h-44 pt-6">
        {data.map((bar, idx) => {
          const pct = Math.max(bar.value > 0 ? 16 : 10, Math.round((bar.value / maxVal) * 100));
          const isHovered = hoveredIdx === idx;
          const barBg =
            bar.variant === 'dark'
              ? 'bg-[#176B4A]'
              : bar.variant === 'medium'
                ? 'bg-[#399B6B]'
                : bar.variant === 'light'
                  ? 'bg-[#C9973A]'
                  : 'kc-hatched-bar border border-[#D8D0BE]/70';

          return (
            <div
              key={bar.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-default min-w-0"
            >
              <div className="relative w-full max-w-[44px] h-full flex items-end justify-center">
                {isHovered && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-md bg-[#17251E] px-2 py-0.5 text-[11px] font-mono font-semibold text-white whitespace-nowrap shadow-sm z-10 tabular-nums">
                    {bar.value}
                    {unitLabel}
                  </div>
                )}
                <motion.div
                  initial={prefersReduced ? false : { height: '8%' }}
                  whileInView={{ height: `${pct}%` }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className={`w-full rounded-2xl transition-transform duration-200 group-hover:scale-[1.03] ${barBg}`}
                />
              </div>
              <span className="mt-2.5 text-[11px] font-medium text-[#69726B] truncate max-w-full text-center">
                {bar.shortLabel || bar.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SemiCircleGauge({
  title,
  percentage,
  caption,
  primaryLabel = 'Completed',
  secondaryLabel = 'Remaining',
}: {
  title: string;
  percentage: number;
  caption: string;
  primaryLabel?: string;
  secondaryLabel?: string;
}) {
  const prefersReduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const radius = 84;
  const circumference = Math.PI * radius; // semi-circle arc length
  const filledOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="rounded-2xl p-5 sm:p-6 kc-glass-card flex flex-col justify-between">
      <h3 className="text-base font-bold text-[#17251E]">{title}</h3>

      <div className="mt-4 flex flex-col items-center">
        <div className="relative w-52 h-28 flex items-end justify-center">
          <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible" aria-hidden="true">
            <defs>
              <pattern id="kc-hatch-arc" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#D8D0BE" strokeWidth="2.5" />
              </pattern>
            </defs>
            {/* Background hatched track */}
            <path
              d="M 16 100 A 84 84 0 0 1 184 100"
              fill="none"
              stroke="url(#kc-hatch-arc)"
              strokeWidth="22"
              strokeLinecap="round"
            />
            {/* Soft mint base behind progress */}
            <path
              d="M 16 100 A 84 84 0 0 1 184 100"
              fill="none"
              stroke="#ECE6D7"
              strokeOpacity="0.45"
              strokeWidth="22"
              strokeLinecap="round"
            />
            {/* Active green arc */}
            <motion.path
              d="M 16 100 A 84 84 0 0 1 184 100"
              fill="none"
              stroke="#176B4A"
              strokeWidth="22"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={prefersReduced ? { strokeDashoffset: filledOffset } : { strokeDashoffset: circumference }}
              whileInView={{ strokeDashoffset: filledOffset }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div className="absolute bottom-1 text-center">
            <p className="text-3xl font-extrabold text-[#17251E] tabular-nums leading-none">
              {clamped}%
            </p>
            <p className="mt-1 text-xs font-medium text-[#69726B]">{caption}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-5 text-xs text-[#69726B]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#176B4A]" />
            <span>{primaryLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full kc-hatched-bar border border-[#D8D0BE]" />
            <span>{secondaryLabel}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function HorizontalProgressBar({
  value,
  max = 100,
  heightClass = 'h-2.5',
}: {
  value: number;
  max?: number;
  heightClass?: string;
}) {
  const prefersReduced = useReducedMotion();
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div className={`w-full rounded-full bg-[#ECE6D7] overflow-hidden ${heightClass}`}>
      <motion.div
        initial={prefersReduced ? { width: `${pct}%` } : { width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full bg-gradient-to-r from-[#176B4A] to-[#399B6B]"
      />
    </div>
  );
}
