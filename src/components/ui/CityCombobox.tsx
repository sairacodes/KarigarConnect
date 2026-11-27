import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, MapPin, Search, X } from 'lucide-react';
import { PAKISTAN_PROVINCE_GROUPS, findCityOption } from '../../data/pakistanCities';
import { useI18n } from '../../i18n/translations';

interface CityComboboxProps {
  value: string;
  onChange: (city: string) => void;
  allowAll?: boolean;
  allLabel?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function CityCombobox({
  value,
  onChange,
  allowAll = false,
  allLabel,
  placeholder,
  required = false,
  className = '',
}: CityComboboxProps) {
  const { lang, bi } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [otherMode, setOtherMode] = useState(false);
  const [customCity, setCustomCity] = useState('');

  useEffect(() => {
    if (value && !findCityOption(value)) {
      setCustomCity(value);
    }
  }, [value]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PAKISTAN_PROVINCE_GROUPS.map((g) => ({
      ...g,
      cities: g.cities.filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.urduName.toLowerCase().includes(q) ||
          g.province.toLowerCase().includes(q)
      ),
    })).filter((g) => g.cities.length > 0);
  }, [query]);

  const matched = value ? findCityOption(value) : undefined;
  const displayValue = value
    ? matched
      ? lang === 'ur'
        ? `${matched.urduName} (${matched.name})`
        : matched.name
      : value
    : allowAll
      ? allLabel || bi('All cities across Pakistan', 'پاکستان کے تمام شہر')
      : '';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#69726B]" />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] ps-9 pe-3 py-2.5 text-sm text-start text-[#17251E] hover:bg-white focus:border-[#399B6B] focus:bg-white focus:outline-none transition-colors"
        >
          <span className={`truncate ${!value && !allowAll ? 'text-[#69726B]' : 'font-medium'}`}>
            {displayValue || placeholder || bi('Select city in Pakistan...', 'پاکستان کا شہر منتخب کریں...')}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {value && allowAll && (
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                  setOtherMode(false);
                }}
                className="rounded p-0.5 text-[#69726B] hover:bg-[#E6E0D2] hover:text-[#17251E]"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-[#69726B]" />
          </span>
        </button>
        {required && (
          <input
            tabIndex={-1}
            aria-hidden="true"
            required
            value={value}
            onChange={() => {}}
            className="sr-only"
          />
        )}
      </div>

      {open && (
        <div className="absolute start-0 end-0 z-50 mt-1.5 rounded-2xl border border-[#E6E0D2] bg-white shadow-xl overflow-hidden">
          <div className="border-b border-[#E6E0D2] p-2.5 bg-[#F7F4EC]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#69726B]" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={bi('Type city or province name...', 'شہر یا صوبے کا نام لکھیں...')}
                className="w-full rounded-lg border border-[#E6E0D2] bg-white ps-8 pe-3 py-1.5 text-xs text-[#17251E] focus:border-[#399B6B] focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1.5 space-y-2">
            {allowAll && !query && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setOtherMode(false);
                  setOpen(false);
                }}
                className={`w-full rounded-lg px-3 py-2 text-start text-xs font-semibold transition-colors ${
                  !value ? 'bg-[#ECE6D7] text-[#176B4A]' : 'text-[#17251E] hover:bg-[#F7F4EC]'
                }`}
              >
                {allLabel || bi('All cities across Pakistan', 'پاکستان کے تمام شہر')}
              </button>
            )}

            {filteredGroups.map((g) => (
              <div key={g.province}>
                <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#69726B] bg-[#F7F4EC] rounded-md">
                  {lang === 'ur' ? `${g.urduName} (${g.province})` : g.province}
                </p>
                <div className="mt-1 space-y-0.5">
                  {g.cities.map((c) => {
                    const selected = value.toLowerCase() === c.name.toLowerCase();
                    return (
                      <button
                        key={`${g.province}-${c.name}`}
                        type="button"
                        onClick={() => {
                          onChange(c.name);
                          setOtherMode(false);
                          setOpen(false);
                          setQuery('');
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-start text-xs transition-colors ${
                          selected
                            ? 'bg-[#ECE6D7] font-semibold text-[#176B4A]'
                            : 'text-[#17251E] hover:bg-[#F7F4EC]'
                        }`}
                      >
                        <span>{c.name}</span>
                        <span className="text-[11px] text-[#69726B]">{c.urduName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredGroups.length === 0 && (
              <p className="px-3 py-2 text-xs text-[#69726B]">
                {bi('No listed city matched.', 'کوئی درج شہر نہیں ملا۔')}
              </p>
            )}

            <div className="border-t border-[#E6E0D2] pt-1.5">
              {!otherMode ? (
                <button
                  type="button"
                  onClick={() => setOtherMode(true)}
                  className="w-full rounded-lg px-3 py-2 text-start text-xs font-semibold text-[#176B4A] hover:bg-[#ECE6D7]/50"
                >
                  {bi('Other (type your city / tehsil)', 'دیگر (اپنا شہر یا تحصیل لکھیں)')}
                </button>
              ) : (
                <div className="p-2 space-y-2 bg-[#F7F4EC] rounded-lg">
                  <input
                    type="text"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder={bi('Enter city or town name...', 'شہر یا قصبے کا نام لکھیں...')}
                    className="w-full rounded-lg border border-[#E6E0D2] bg-white px-2.5 py-1.5 text-xs text-[#17251E] focus:border-[#399B6B] focus:outline-none"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOtherMode(false)}
                      className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#69726B] hover:text-[#17251E]"
                    >
                      {bi('Cancel', 'منسوخ')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (customCity.trim().length >= 2) {
                          onChange(customCity.trim());
                          setOpen(false);
                          setQuery('');
                        }
                      }}
                      className="rounded-lg bg-[#176B4A] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#13563B]"
                    >
                      {bi('Use City', 'منتخب کریں')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
