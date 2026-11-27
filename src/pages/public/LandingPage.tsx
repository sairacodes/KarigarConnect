import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import QRCode from 'qrcode';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Camera,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  MapPin,
  RotateCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { PublicLayout } from '../../components/layouts/PublicLayout';
import { CityCombobox } from '../../components/ui/CityCombobox';
import { ALL_CITIES_FLAT } from '../../data/pakistanCities';
import { SERVICE_CATALOG } from '../../data/serviceCatalog';
import { api } from '../../services/api';
import { useI18n } from '../../i18n/translations';
import { SUPPORT_EMAIL } from '../../config/site';

import avatarBilalImg from '../../assets/images/avatar_bilal_1795340853872.jpg';

const LEVEL_TO_SCORE: Record<string, number> = { BASIC: 1, COMPETENT: 2, ADVANCED: 3 };

/** Rubric score drawn as 0–3 tally marks: a small handmade touch. */
function Tally({ score, label }: { score: number; label?: string }) {
  return (
    <span className="kc-tally" role="img" aria-label={label ?? `Rubric score ${score} of 3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= score ? 'on' : ''} />
      ))}
    </span>
  );
}

const PILOT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Karigar Connect pilot')}&body=${encodeURIComponent(
  'Assalam-o-Alaikum,\n\nWe are interested in a Karigar Connect pilot.\n\nOrganisation:\nTrade(s):\nCity:\n'
)}`;

/* Hero visual: the Karigar Passport, which flips to show the competency matrix */
function PassportCard() {
  const { bi, isUr } = useI18n();
  const prefersReduced = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const [qr, setQr] = useState('');

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/verify-badge`, {
      margin: 0,
      width: 160,
      color: { dark: '#11221B', light: '#FFFDF8' },
    })
      .then(setQr)
      .catch(() => setQr(''));
  }, []);

  // One gentle flip on first view so people discover the back.
  useEffect(() => {
    if (prefersReduced) return;
    const a = window.setTimeout(() => setFlipped(true), 2600);
    const b = window.setTimeout(() => setFlipped(false), 5800);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [prefersReduced]);

  const skills = [
    { en: 'Electrical safety practices', ur: 'برقی حفاظتی تدابیر', score: 3, safety: true },
    { en: 'Electrical installation', ur: 'برقی تنصیب', score: 3 },
    { en: 'Circuit troubleshooting', ur: 'سرکٹ کی خرابی کی تشخیص', score: 3 },
    { en: 'Distribution board setup', ur: 'ڈسٹری بیوشن بورڈ', score: 0, pending: true },
    { en: 'Earthing & bonding', ur: 'ارتھنگ', score: 0, pending: true },
  ];

  return (
    <div className={`kc-flip relative mx-auto w-full max-w-[400px] ${flipped ? 'is-flipped' : ''}`}>
      <div className="kc-flip-inner">
        {/* FRONT */}
        <div className="kc-flip-face rounded-[28px] bg-[#FFFDF8] border border-[#E2DBCB] p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#176B4A]">
              {bi('Karigar Passport', 'کاریگر پاسپورٹ')}
            </p>
            <span className="text-[11px] font-mono text-[#69726B]">KC-ISB-0192</span>
          </div>
          <div className="kc-stitch mt-4" />

          <div className="mt-6 flex items-center gap-4">
            <img
              src={avatarBilalImg}
              alt={bi('Sample karigar Bilal Ahmed', 'نمونہ کاریگر بلال احمد')}
              className="h-20 w-20 rounded-2xl object-cover"
            />
            <div className="min-w-0">
              <p className="font-[Fraunces] text-2xl font-semibold text-[#11221B] leading-tight">
                {bi('Bilal Ahmed', 'بلال احمد')}
              </p>
              <p className="mt-1 text-sm text-[#4D6357]">{bi('Electrician · Islamabad', 'الیکٹریشن · اسلام آباد')}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#E2DBCB] bg-[#E2DBCB]">
            <div className="bg-[#FFFDF8] p-4">
              <p className="text-xs text-[#69726B]">{bi('Verified skills', 'تصدیق شدہ مہارتیں')}</p>
              <p className="mt-1 font-[Fraunces] text-3xl font-semibold text-[#176B4A] tabular-nums">3</p>
            </div>
            <div className="bg-[#FFFDF8] p-4">
              <p className="text-xs text-[#69726B]">{bi('Trust score', 'اعتماد اسکور')}</p>
              <p className="mt-1 font-[Fraunces] text-3xl font-semibold text-[#11221B] tabular-nums">
                79<span className="text-base text-[#69726B]">/100</span>
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#176B4A]">
                <ShieldCheck className="h-3.5 w-3.5" />
                {bi('Assessor-verified', 'ماہر سے تصدیق شدہ')}
              </p>
              <p className="mt-1 text-xs text-[#69726B]">{bi('Valid until Nov 2027', 'نومبر ۲۰۲۷ تک مؤثر')}</p>
            </div>
            {qr ? (
              <img src={qr} alt={bi('QR code to verify this passport', 'پاسپورٹ کی تصدیق کا QR کوڈ')} className="h-20 w-20" />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-[#ECE6D7]" />
            )}
          </div>
        </div>

        {/* BACK: competency matrix */}
        <div className="kc-flip-face kc-flip-back rounded-[28px] bg-[#11221B] text-[#F7F4EC] p-6 sm:p-7 flex flex-col">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E9C77E]">
              {bi('Competency matrix', 'مہارتوں کا خاکہ')}
            </p>
            <span className="text-[11px] text-[#D8D0BE]">{bi('Rubric 0–3', 'معیار ۰ تا ۳')}</span>
          </div>
          <div className="kc-stitch mt-4" />
          <ul className="mt-4 flex-1 divide-y divide-white/10">
            {skills.map((s) => (
              <li key={s.en} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-sm">
                  {isUr ? s.ur : s.en}
                  {s.safety && (
                    <span className="ms-2 rounded-full border border-[#E9C77E]/50 px-1.5 py-0.5 text-[10px] font-semibold text-[#E9C77E]">
                      {bi('Safety', 'حفاظت')}
                    </span>
                  )}
                </span>
                {s.pending ? (
                  <span className="text-xs text-[#D8D0BE]">{bi('In review', 'جانچ جاری')}</span>
                ) : (
                  <span className="kc-tally-dark">
                    <Tally score={s.score} />
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[#D8D0BE]">
            {bi('Scored by an approved electrical assessor.', 'منظور شدہ الیکٹریکل ماہر نے جانچا۔')}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="mt-4 mx-auto flex items-center gap-1.5 text-xs font-semibold text-[#4D6357] hover:text-[#11221B]"
      >
        <RotateCw className="h-3.5 w-3.5" />
        {flipped ? bi('Show passport', 'پاسپورٹ دیکھیں') : bi('Flip to see verified skills', 'تصدیق شدہ مہارتیں دیکھیں')}
      </button>
      <p className="mt-1 text-center text-[11px] text-[#69726B]">{bi('Sample profile', 'نمونہ پروفائل')}</p>
    </div>
  );
}

export function LandingPage() {
  const prefersReduced = useReducedMotion();
  const { bi, isUr } = useI18n();
  const navigate = useNavigate();

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [leaderCity, setLeaderCity] = useState('');
  const [searchTradeOrQuery, setSearchTradeOrQuery] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    setLoadingWorkers(true);
    api
      .get('/public/leaderboard', { params: { city: leaderCity || undefined } })
      .then((res) => setLeaderboard(res.data.data || []))
      .catch(() => setLeaderboard([]))
      .finally(() => setLoadingWorkers(false));
  }, [leaderCity]);

  useEffect(() => {
    api
      .get('/public/stats')
      .then((res) => setStats(res.data.data || res.data))
      .catch(() => setStats(null));
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let rawQuery = searchTradeOrQuery.trim();
    let resolvedCity = searchCity.trim();
    let resolvedTrade = '';

    const inMatch = rawQuery.match(/^(.+?)\s+in\s+(.+)$/i);
    if (inMatch) {
      rawQuery = inMatch[1].trim();
      if (!resolvedCity) {
        const candidateCity = inMatch[2].trim().toLowerCase();
        const foundCity = ALL_CITIES_FLAT.find((c) => c.name.toLowerCase() === candidateCity);
        resolvedCity = foundCity ? foundCity.name : inMatch[2].trim();
      }
    }
    if (rawQuery) {
      const qLower = rawQuery.toLowerCase();
      const matchedService = SERVICE_CATALOG.find(
        (s) => s.name.toLowerCase() === qLower || s.slug.toLowerCase() === qLower || s.urduName === rawQuery
      );
      if (matchedService) resolvedTrade = matchedService.slug;
    }
    const params = new URLSearchParams();
    if (resolvedTrade) params.set('trade', resolvedTrade);
    else if (rawQuery) params.set('q', rawQuery);
    if (resolvedCity) params.set('city', resolvedCity);
    const qs = params.toString();
    navigate(qs ? `/explore?${qs}` : '/explore');
  };

  const steps = [
    {
      icon: Camera,
      title: bi('Evidence', 'ثبوت'),
      body: bi(
        'The worker uploads photos or video of real work for each competency in their trade.',
        'ہنرمند اپنے پیشے کی ہر مہارت کے لیے اصل کام کی تصاویر یا ویڈیو اپ لوڈ کرتا ہے۔'
      ),
    },
    {
      icon: ClipboardCheck,
      title: bi('Assessor rubric', 'ماہر کی جانچ'),
      body: bi(
        'An approved trade assessor scores each competency from 0 to 3 against a written rubric.',
        'منظور شدہ ماہر ہر مہارت کو تحریری معیار کے مطابق ۰ سے ۳ تک نمبر دیتا ہے۔'
      ),
      tally: true,
    },
    {
      icon: ShieldAlert,
      title: bi('Safety check', 'حفاظتی جانچ'),
      body: bi(
        'Any failed safety-critical item blocks the badge, however high the other scores are.',
        'کوئی بھی لازمی حفاظتی نکتہ ناکام ہو تو بیج نہیں ملتا، چاہے باقی نمبر کتنے ہی زیادہ ہوں۔'
      ),
    },
    {
      icon: BadgeCheck,
      title: bi('Badge', 'بیج'),
      body: bi(
        'A verified badge, valid for 12 months, that anyone can check by scanning the QR passport.',
        '۱۲ ماہ کے لیے مؤثر تصدیق شدہ بیج، جسے کوئی بھی QR پاسپورٹ اسکین کر کے جانچ سکتا ہے۔'
      ),
    },
  ];

  const faqs = [
    {
      q: bi('What does a verified badge mean? Is it a government certificate?', 'تصدیق شدہ بیج کا کیا مطلب ہے؟ کیا یہ سرکاری سرٹیفکیٹ ہے؟'),
      a: bi(
        'It means an approved trade assessor scored the worker’s evidence against a 0–3 practical rubric, including mandatory safety checks. Badges last 12 months. They are not government accreditation or a licence.',
        'اس کا مطلب ہے کہ منظور شدہ ماہر نے ہنرمند کے ثبوت کو ۰ تا ۳ عملی معیار اور لازمی حفاظتی اصولوں پر پرکھا ہے۔ بیج ۱۲ ماہ کے لیے ہوتا ہے اور یہ سرکاری سند یا لائسنس نہیں ہے۔'
      ),
    },
    {
      q: bi('Who are the assessors?', 'جانچ کرنے والے ماہر کون ہیں؟'),
      a: bi(
        'Experienced tradespeople and vocational instructors who apply, are reviewed by an admin, and score against the same written rubric. Workers can appeal a result.',
        'تجربہ کار کاریگر اور فنی اساتذہ جو درخواست دیتے ہیں، ایڈمن ان کا جائزہ لیتا ہے، اور وہ ایک ہی تحریری معیار پر جانچ کرتے ہیں۔ ہنرمند نتیجے کے خلاف اپیل کر سکتا ہے۔'
      ),
    },
    {
      q: bi('When can a customer see a worker’s phone number?', 'گاہک ہنرمند کا فون نمبر کب دیکھ سکتا ہے؟'),
      a: bi(
        'Only after the worker accepts the job or contact request. Until then, contact details stay hidden.',
        'صرف اس وقت جب ہنرمند جاب یا رابطہ درخواست قبول کر لے۔ تب تک رابطہ معلومات پوشیدہ رہتی ہیں۔'
      ),
    },
  ];

  const leaderCities = ['', 'Islamabad', 'Lahore', 'Karachi', 'Rawalpindi'];

  const fade = (delay = 0) =>
    prefersReduced
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-60px' },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as any },
        };

  return (
    <PublicLayout>
      {/* 1. HERO */}
      <section id="top" className="bg-[#F7F4EC]">
        <div className="mx-auto max-w-7xl px-4 pt-14 pb-20 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24 lg:pb-28">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:items-center">
            <motion.div {...fade(0)} className="lg:col-span-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B4A]">
                {bi('Skills verification for Pakistan’s karigars', 'پاکستان کے کاریگروں کے لیے مہارت کی تصدیق')}
              </p>

              <h1 className="mt-5 text-[40px] sm:text-6xl lg:text-[66px] font-semibold tracking-tight text-[#11221B] leading-[1.05] text-balance">
                {isUr ? (
                  <>
                    دوسری ایپس بتاتی ہیں کون دستیاب ہے۔{' '}
                    <span className="text-[#176B4A]">ہم بتاتے ہیں کون ثابت شدہ ہے۔</span>
                  </>
                ) : (
                  <>
                    Other apps tell you who is available.{' '}
                    <span className="italic text-[#176B4A]">We tell you who is proven.</span>
                  </>
                )}
              </h1>

              <p className="mt-6 text-base sm:text-lg text-[#4D6357] leading-relaxed max-w-xl">
                {bi(
                  'Skilled workers build a portable profile of practical skills, scored by approved assessors against a written rubric, with safety checks that can’t be skipped.',
                  'ہنرمند اپنی عملی مہارتوں کا ایسا پروفائل بناتے ہیں جسے منظور شدہ ماہرین تحریری معیار اور لازمی حفاظتی جانچ کے ساتھ پرکھتے ہیں۔'
                )}
              </p>

              <form onSubmit={handleHeroSearch} className="mt-9 max-w-2xl">
                <div className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-[#E2DBCB] bg-[#FFFDF8] p-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute start-3.5 top-3 h-4 w-4 text-[#69726B]" />
                    <input
                      type="text"
                      list="kc-hero-trades"
                      value={searchTradeOrQuery}
                      onChange={(e) => setSearchTradeOrQuery(e.target.value)}
                      placeholder={bi('Electrician, plumber, carpenter…', 'الیکٹریشن، پلمبر، بڑھئی…')}
                      aria-label={bi('Trade or search query', 'ہنر یا تلاش')}
                      className="w-full rounded-xl bg-transparent ps-10 pe-3 py-2.5 text-sm text-[#17251E] placeholder:text-[#69726B] focus:outline-none"
                    />
                    <datalist id="kc-hero-trades">
                      {SERVICE_CATALOG.map((s) => (
                        <option key={s.id} value={isUr ? s.urduName : s.name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="sm:w-52">
                    <CityCombobox
                      value={searchCity}
                      onChange={setSearchCity}
                      allowAll
                      placeholder={bi('Any city', 'کوئی بھی شہر')}
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#11221B] px-5 py-2.5 text-sm font-semibold text-[#F7F4EC] hover:bg-[#176B4A] transition-colors whitespace-nowrap"
                  >
                    {bi('Find proven workers', 'ہنرمند تلاش کریں')}
                  </button>
                </div>
              </form>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                <a href="#partners" className="inline-flex items-center gap-1.5 font-semibold text-[#176B4A] hover:text-[#11221B]">
                  {bi('For institutes & employers', 'اداروں اور آجروں کے لیے')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </a>
                <Link to="/register/karigar" className="font-semibold text-[#4D6357] hover:text-[#11221B]">
                  {bi('I’m a karigar: build my profile', 'میں کاریگر ہوں: پروفائل بنائیں')}
                </Link>
              </div>
            </motion.div>

            <motion.div {...fade(0.15)} className="lg:col-span-5">
              <PassportCard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. HOW PROOF WORKS */}
      <section id="how" className="bg-[#FFFDF8] border-y border-[#E2DBCB]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <motion.div {...fade(0)} className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B4A]">
              {bi('How proof works', 'ثبوت کیسے بنتا ہے')}
            </p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight text-[#11221B]">
              {bi('A badge means someone checked.', 'بیج کا مطلب ہے کہ کسی نے جانچا ہے۔')}
            </h2>
          </motion.div>

          <ol className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.li key={i} {...fade(0.08 * i)} className="border-t-2 border-[#11221B] pt-6">
                  <div className="flex items-center justify-between">
                    <span className="font-[Fraunces] text-4xl font-semibold text-[#176B4A] tabular-nums">0{i + 1}</span>
                    <Icon className={`h-5 w-5 ${i === 2 ? 'text-[#B07F22]' : 'text-[#69726B]'}`} />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-[#11221B]">{s.title}</p>
                  <p className="mt-2 text-sm text-[#4D6357] leading-relaxed">{s.body}</p>
                  {s.tally && (
                    <div className="mt-4 flex items-center gap-4 text-xs text-[#69726B]">
                      {[0, 1, 2, 3].map((n) => (
                        <span key={n} className="inline-flex items-center gap-1.5">
                          <Tally score={n} /> {n}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.li>
              );
            })}
          </ol>

          <Link
            to="/how-it-works"
            className="mt-12 inline-flex items-center gap-1.5 text-sm font-semibold text-[#176B4A] hover:text-[#11221B]"
          >
            {bi('See the full process', 'مکمل طریقہ کار دیکھیں')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </section>

      {/* 3. PROVEN KARIGARS + 3 NUMBERS */}
      <section className="bg-[#F7F4EC]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <motion.div {...fade(0)}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B4A]">
                {bi('Proven karigars', 'ثابت شدہ کاریگر')}
              </p>
              <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight text-[#11221B]">
                {bi('Skills you can check.', 'مہارت جسے جانچا جا سکے۔')}
              </h2>
            </motion.div>
            <div className="flex flex-wrap gap-1.5">
              {leaderCities.map((c) => (
                <button
                  key={c || 'all'}
                  type="button"
                  onClick={() => setLeaderCity(c)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    leaderCity === c
                      ? 'bg-[#11221B] text-[#F7F4EC]'
                      : 'border border-[#E2DBCB] text-[#4D6357] hover:border-[#11221B] hover:text-[#11221B]'
                  }`}
                >
                  {c || bi('All', 'سب')}
                </button>
              ))}
            </div>
          </div>

          {loadingWorkers ? (
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 rounded-3xl bg-[#EFE9DC] animate-pulse" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="mt-10 border-t border-[#E2DBCB] pt-8 text-sm text-[#4D6357]">
              {bi('No public profiles in this city yet.', 'اس شہر میں ابھی کوئی عوامی پروفائل نہیں۔')}{' '}
              <button type="button" onClick={() => setLeaderCity('')} className="font-semibold text-[#176B4A] underline">
                {bi('Show all cities', 'تمام شہر دکھائیں')}
              </button>
            </p>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {leaderboard.slice(0, 3).map((w, idx) => (
                <motion.div key={w.workerProfileId} {...fade(0.06 * idx)}>
                  <Link
                    to={`/workers/${w.publicId}`}
                    className="group flex h-full flex-col rounded-3xl border border-[#E2DBCB] bg-[#FFFDF8] p-6 transition-colors hover:border-[#11221B]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#ECE6D7] flex items-center justify-center font-semibold text-[#176B4A]">
                        {w.avatarUrl ? (
                          <img src={w.avatarUrl} alt={w.fullName} className="h-full w-full object-cover" />
                        ) : (
                          w.fullName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-[Fraunces] text-xl font-semibold text-[#11221B]">{w.fullName}</h3>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-[#4D6357]">
                          <span className="truncate">{isUr && w.tradeUrduName ? w.tradeUrduName : w.tradeName}</span>
                          <span className="text-[#C9BFA8]">·</span>
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {w.city}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="font-[Fraunces] text-2xl font-semibold text-[#11221B] tabular-nums">{w.trustScore}</p>
                        <p className="text-[10px] uppercase tracking-wider text-[#69726B]">{bi('Trust', 'اعتماد')}</p>
                      </div>
                    </div>

                    <div className="kc-stitch my-5" />

                    <p className="text-xs font-semibold text-[#176B4A]">
                      {w.verifiedCount} {bi('verified skills', 'تصدیق شدہ مہارتیں')}
                    </p>
                    {w.verifiedBadges && w.verifiedBadges.length > 0 ? (
                      <ul className="mt-3 flex-1 space-y-2.5">
                        {w.verifiedBadges.slice(0, 3).map((b: any) => (
                          <li key={b.id} className="flex items-center justify-between gap-3 text-sm text-[#17251E]">
                            <span className="truncate">
                              {isUr && b.competencyUrduTitle ? b.competencyUrduTitle : b.competencyTitle}
                            </span>
                            <Tally score={LEVEL_TO_SCORE[b.level] ?? 0} />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 flex-1 text-sm text-[#69726B]">
                        {bi('Evidence under review', 'ثبوت کی جانچ جاری ہے')}
                      </p>
                    )}

                    <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#11221B] group-hover:text-[#176B4A]">
                      {bi('View portfolio', 'پورٹ فولیو دیکھیں')}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          <Link to="/explore" className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[#176B4A] hover:text-[#11221B]">
            {bi('Explore all proven workers', 'تمام ثابت شدہ ہنرمند دیکھیں')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>

          {/* Three numbers instead of a full dashboard */}
          <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-[#E2DBCB] bg-[#E2DBCB] sm:grid-cols-3">
            {[
              { v: stats?.verifiedWorkersCount, l: bi('Karigars with public profiles', 'عوامی پروفائل والے کاریگر') },
              { v: stats?.totalVerifiedBadges, l: bi('Active verified badges', 'فعال تصدیق شدہ بیجز') },
              { v: stats?.approvedAssessorsCount, l: bi('Approved assessors', 'منظور شدہ ماہرین') },
            ].map((s, i) => (
              <div key={i} className="bg-[#FFFDF8] p-7">
                <p className="font-[Fraunces] text-5xl font-semibold text-[#11221B] tabular-nums">{s.v ?? '–'}</p>
                <p className="mt-2 text-sm text-[#4D6357]">{s.l}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#69726B]">
            <span className="inline-flex items-center gap-2">
              <span className="rounded-full border border-[#C9973A] px-2 py-0.5 font-semibold text-[#8A6418]">
                {bi('Sample data', 'نمونہ ڈیٹا')}
              </span>
              {bi('Prototype figures from seeded demo accounts.', 'پروٹوٹائپ کے نمونہ اکاؤنٹس کے اعداد۔')}
            </span>
            <Link to="/demand-insights" className="font-semibold text-[#176B4A] hover:text-[#11221B]">
              {bi('See skill demand insights →', 'مہارتوں کی طلب دیکھیں ←')}
            </Link>
          </div>
        </div>
      </section>

      {/* 4. FOR THE PEOPLE WHO PAY */}
      <section id="partners" className="bg-[#11221B] text-[#F7F4EC] scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <motion.div {...fade(0)} className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E9C77E]">
              {bi('For institutes & employers', 'اداروں اور آجروں کے لیے')}
            </p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight text-[#F7F4EC]">
              {bi('Hire on proof. Train with proof.', 'ثبوت پر بھرتی۔ ثبوت کے ساتھ تربیت۔')}
            </h2>
          </motion.div>

          <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-2">
            <motion.div {...fade(0.05)} className="border-t border-white/15 pt-8">
              <GraduationCap className="h-6 w-6 text-[#E9C77E]" />
              <h3 className="mt-5 font-[Fraunces] text-2xl font-semibold">{bi('Training institutes', 'فنی تربیتی ادارے')}</h3>
              <p className="mt-3 text-[#D8D0BE] leading-relaxed">
                {bi(
                  'Give every graduate a verified, shareable skills profile. Your instructors assess with our rubric; your graduates leave with proof employers can check.',
                  'ہر فارغ التحصیل کو تصدیق شدہ پروفائل دیں۔ آپ کے اساتذہ ہمارے معیار سے جانچیں، اور طلبہ ایسا ثبوت لے کر نکلیں جسے آجر جانچ سکیں۔'
                )}
              </p>
            </motion.div>
            <motion.div {...fade(0.12)} className="border-t border-white/15 pt-8">
              <Building2 className="h-6 w-6 text-[#E9C77E]" />
              <h3 className="mt-5 font-[Fraunces] text-2xl font-semibold">{bi('Employers & contractors', 'آجر اور ٹھیکیدار')}</h3>
              <p className="mt-3 text-[#D8D0BE] leading-relaxed">
                {bi(
                  'Search by verified competency and city, not just job title. Compare candidates on the same rubric before the first trial job.',
                  'صرف عہدے کے بجائے تصدیق شدہ مہارت اور شہر سے تلاش کریں۔ پہلے آزمائشی کام سے پہلے امیدواروں کا ایک ہی معیار پر موازنہ کریں۔'
                )}
              </p>
            </motion.div>
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-4">
            <a
              href={PILOT_MAILTO}
              className="inline-flex items-center gap-2 rounded-full bg-[#E9C77E] px-7 py-3.5 text-sm font-semibold text-[#11221B] hover:bg-[#F3D9A0] transition-colors"
            >
              {bi('Run a pilot with us', 'ہمارے ساتھ پائلٹ شروع کریں')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </a>
            <Link
              to="/register/assessor"
              className="inline-flex items-center rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-[#F7F4EC] hover:border-[#E9C77E]"
            >
              {bi('Apply as an assessor', 'بطور ماہر درخواست دیں')}
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FAQ + CLOSE */}
      <section id="faq" className="bg-[#F7F4EC]">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B4A]">{bi('Questions', 'سوالات')}</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-[#11221B]">
            {bi('Honest answers.', 'سیدھے جوابات۔')}
          </h2>

          <div className="mt-8 divide-y divide-[#E2DBCB] border-y border-[#E2DBCB]">
            {faqs.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 py-5 text-start font-semibold text-[#11221B] hover:text-[#176B4A]"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={prefersReduced ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 text-sm text-[#4D6357] leading-relaxed">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="mt-20 text-center">
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[#11221B] text-balance">
              {bi('Hire with proof, not guesswork.', 'اندازے پر نہیں، ثبوت پر بھرتی کریں۔')}
            </h2>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#11221B] px-7 py-3.5 text-sm font-semibold text-[#F7F4EC] hover:bg-[#176B4A] transition-colors"
              >
                {bi('Get started', 'شروع کریں')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link
                to="/verify-badge"
                className="inline-flex items-center rounded-full border border-[#D8D0BE] px-7 py-3.5 text-sm font-semibold text-[#11221B] hover:border-[#11221B]"
              >
                {bi('Verify a badge', 'بیج کی تصدیق کریں')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
