import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Award,
  BarChart3,
  ChevronDown,
  Hammer,
  HelpCircle,
  Lock,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Wrench,
  Zap,
} from 'lucide-react';
import { SkillDemandInsightsSection } from '../../components/analytics/SkillDemandInsightsSection';
import { PublicLayout } from '../../components/layouts/PublicLayout';
import { CityCombobox } from '../../components/ui/CityCombobox';
import { formatLevelLabel } from '../../components/ui/Components';
import { FloatingCard } from '../../components/ui/MotionPrimitives';
import { HorizontalProgressBar } from '../../components/ui/DataViz';
import { TierPill, TrustScoreBadge, StarRatingInline } from '../../components/ui/RatingDisplay';
import { ALL_CITIES_FLAT } from '../../data/pakistanCities';
import { SERVICE_CATALOG } from '../../data/serviceCatalog';
import { api } from '../../services/api';
import { useI18n } from '../../i18n/translations';

import heroKarigarImg from '../../assets/images/hero_karigar_trades_1795340854886.jpg';
import avatarBilalImg from '../../assets/images/avatar_bilal_1795340853872.jpg';
import tradeElectricianImg from '../../assets/images/trade_electrician_1795340853927.jpg';
import tradeCarpenterImg from '../../assets/images/trade_carpenter_1795340854383.jpg';
import tradeMechanicImg from '../../assets/images/trade_mechanic_1795340854456.jpg';

const HERO_IMG = heroKarigarImg;
const AVATAR_BILAL = avatarBilalImg;
const TRADE_IMAGES = {
  electrician: tradeElectricianImg,
  carpenter: tradeCarpenterImg,
  mechanic: tradeMechanicImg,
};

const WHATSAPP_WA_URL =
  'https://wa.me/923000000000?text=' +
  encodeURIComponent('Assalam-o-Alaikum KARIGAR CONNECT Support, I have a question about:');

export function LandingPage() {
  const prefersReduced = useReducedMotion();
  const { bi, lang, isUr } = useI18n();
  const navigate = useNavigate();

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [leaderCity, setLeaderCity] = useState('');

  // Unified Home Search State ("Electrician in Rawalpindi")
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
        (s) =>
          s.name.toLowerCase() === qLower ||
          s.slug.toLowerCase() === qLower ||
          s.urduName === rawQuery
      );
      if (matchedService) {
        resolvedTrade = matchedService.slug;
      }
    }

    const params = new URLSearchParams();
    if (resolvedTrade) {
      params.set('trade', resolvedTrade);
    } else if (rawQuery) {
      params.set('q', rawQuery);
    }
    if (resolvedCity) params.set('city', resolvedCity);

    const qs = params.toString();
    navigate(qs ? `/explore?${qs}` : '/explore');
  };

  const trades = [
    {
      slug: 'electrician',
      name: bi('Electrician', 'الیکٹریشن'),
      secondary: isUr ? 'Electrician' : 'الیکٹریشن',
      icon: Zap,
      img: TRADE_IMAGES.electrician,
      description: bi(
        'Residential & commercial wiring, breaker panels, safety earthing, and circuit diagnostics.',
        'گھریلو اور کمرشل وائرنگ، بریکر پینل، سیفٹی ارتھنگ، اور سرکٹ کی تشخیص۔'
      ),
    },
    {
      slug: 'carpenter',
      name: bi('Carpenter', 'کارپینٹر / بڑھئی'),
      secondary: isUr ? 'Carpenter' : 'بڑھئی / کارپینٹر',
      icon: Hammer,
      img: TRADE_IMAGES.carpenter,
      description: bi(
        'Precision measuring, hardwood cutting, mortise-and-tenon joinery, assembly, and finishing.',
        'درست پیمائش، لکڑی کی کٹائی، مضبوط جوڑ، فرنیچر سازی، اور معیاری فنشنگ۔'
      ),
    },
    {
      slug: 'mechanic',
      name: bi('Mechanic', 'آٹو مکینک'),
      secondary: isUr ? 'Mechanic' : 'آٹو مکینک',
      icon: Wrench,
      img: TRADE_IMAGES.mechanic,
      description: bi(
        'Multi-point vehicle inspection, engine servicing, brake systems, and preventive maintenance.',
        'گاڑی کا مکمل معائنہ، انجن سروسنگ، بریک سسٹم، اور احتیاطی دیکھ بھال۔'
      ),
    },
  ];

  const faqs = [
    {
      q: bi(
        'What does a Verified Badge mean? Is it a government certificate?',
        'تصدیق شدہ بیج کا کیا مطلب ہے؟ کیا یہ سرکاری سرٹیفکیٹ ہے؟'
      ),
      a: bi(
        'A verified badge means an Admin-approved trade assessor scored the worker’s uploaded photos or video against a 0–3 practical rubric, with mandatory safety-critical checks. Badges remain valid for 12 months and are NOT government accreditation or a formal license.',
        'تصدیق شدہ بیج کا مطلب ہے کہ ایڈمن سے منظور شدہ ٹریڈ ماہر نے ہنرمند کی اپ لوڈ کردہ تصاویر یا ویڈیو کو ۰ تا ۳ عملی معیار اور لازمی حفاظتی اصولوں پر پرکھا ہے۔ یہ بیج ۱۲ ماہ کے لیے مؤثر ہوتا ہے اور یہ سرکاری سند یا لائسنس نہیں ہے۔'
      ),
    },
    {
      q: bi(
        'When is a worker’s phone number or email visible to customers?',
        'ہنرمند کا فون نمبر یا ای میل گاہک کو کب نظر آتا ہے؟'
      ),
      a: bi(
        'Personal phone numbers and emails stay hidden by default on public portfolios. Contact details are unlocked only after the worker explicitly accepts your job request or contact request.',
        'عوامی پورٹ فولیو پر ذاتی فون نمبر اور ای میل پوشیدہ رہتے ہیں۔ رابطہ تفصیلات صرف اس وقت ظاہر ہوتی ہیں جب ہنرمند خود آپ کی جاب یا رابطہ درخواست قبول کر لے۔'
      ),
    },
    {
      q: bi(
        'Does KARIGAR CONNECT conduct police or CNIC background checks?',
        'کیا کاریگر کنیکٹ پولیس یا شناختی کارڈ کی پس منظر تصدیق کرتا ہے؟'
      ),
      a: bi(
        'No. This prototype focuses strictly on practical skill evidence assessed by approved assessors, privacy-first contact consent, real completed-job reviews, and customer-confirmed work photos. It never claims police or CNIC background checks.',
        'نہیں۔ یہ پلیٹ فارم صرف منظور شدہ ماہرین کے ذریعے عملی مہارت کے ثبوت، اجازت پر مبنی رابطے، مکمل کام پر مبنی ریٹنگ اور تصویری ثبوت کی تصدیق فراہم کرتا ہے۔'
      ),
    },
    {
      q: bi(
        'How does the 7-Day Karigar Guarantee work?',
        '۷ دن کی کاریگر گارنٹی کیسے کام کرتی ہے؟'
      ),
      a: bi(
        'If an issue reappears within 7 days of marking a job Completed, the customer can open a rework review request from My Jobs. Both parties can respond and an administrator reviews the resolution.',
        'اگر کام مکمل ہونے کے ۷ دن کے اندر مسئلہ دوبارہ پیش آئے تو صارف اپنے کاموں کے صفحے سے دوبارہ مرمت یا نظرثانی کی درخواست جمع کرا سکتا ہے جس کا ایڈمن جائزہ لیتا ہے۔'
      ),
    },
    {
      q: bi(
        'How are PKR Fair Price Guides calculated?',
        'پاکستانی روپے میں مناسب نرخ نامہ کیسے طے ہوتا ہے؟'
      ),
      a: bi(
        'Each of the 48+ home-service categories lists reference minimum and maximum PKR ranges editable by administrators so customers and workers can spot Below Guide, Fair Price Range, or Above Guide quotes before accepting.',
        '۴۸ سے زائد گھریلو سروسز میں ایڈمن کے طے کردہ کم از کم اور زیادہ از زیادہ PKR نرخ شامل ہیں تاکہ درخواست قبول کرنے سے پہلے قیمت کے مناسب ہونے کا اندازہ ہو سکے۔'
      ),
    },
  ];

  const leaderCities = ['', 'Islamabad', 'Lahore', 'Karachi', 'Rawalpindi', 'Multan', 'Peshawar', 'Quetta'];

  return (
    <PublicLayout>
      {/* 1. OPEN HERO SECTION (Pure White & Soft Mint Harmony, Exact Tagline Focal Point) */}
      <section id="top" className="relative overflow-hidden bg-gradient-to-b from-white via-[#F6FCF8] to-[#ECF8F1]">
        <div className="pointer-events-none absolute -top-28 end-0 h-96 w-96 rounded-full bg-[#B8E4C7]/45 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 start-0 h-72 w-72 rounded-full bg-[#DDF3E4]/65 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-14 sm:px-6 sm:pt-16 sm:pb-16 lg:px-8 lg:pt-20 lg:pb-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-7"
            >
              <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#176B4A]">
                <MapPin className="h-3.5 w-3.5 text-[#399B6B]" />
                <span>
                  {bi(
                    'Skilled Craftsmanship Across Pakistan',
                    'پاکستان بھر میں ہنر اور بااعتماد روزگار'
                  )}
                </span>
              </p>

              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#11221B] sm:text-5xl lg:text-[56px] text-balance leading-[1.06]">
                {isUr ? (
                  'جہاں ہنر کو مواقع ملتے ہیں۔'
                ) : (
                  <>
                    Where Skills Meet{' '}
                    <span className="text-[#176B4A] underline decoration-[#73C99B]/70 decoration-4 underline-offset-8">
                      Opportunities.
                    </span>
                  </>
                )}
              </h1>

              <p className="mt-5 text-base sm:text-lg text-[#3E5247] leading-relaxed max-w-2xl">
                {bi(
                  'A platform connecting skilled individuals with meaningful opportunities, trusted connections, and professional growth.',
                  'ایک ایسا پلیٹ فارم جو ہنرمند افراد کو بامعنی مواقع، بااعتماد رابطوں اور پیشہ ورانہ ترقی سے جوڑتا ہے۔'
                )}
              </p>

              {/* Floating Open Trade + City Search Strip */}
              <form
                onSubmit={handleHeroSearch}
                className="mt-8 rounded-2xl bg-white p-2.5 shadow-[0_18px_42px_-18px_rgba(17,34,27,0.18)] border border-[#CFE9D8]"
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-center">
                  <div className="sm:col-span-6 relative">
                    <Search className="pointer-events-none absolute start-3.5 top-3 h-4 w-4 text-[#176B4A]" />
                    <input
                      type="text"
                      list="kc-hero-trades"
                      value={searchTradeOrQuery}
                      onChange={(e) => setSearchTradeOrQuery(e.target.value)}
                      placeholder={bi(
                        'Try "Electrician in Rawalpindi" or select trade...',
                        'مثلاً "Electrician in Rawalpindi" یا ہنر لکھیں...'
                      )}
                      aria-label={bi('Trade or search query', 'ہنر یا تلاش')}
                      className="w-full rounded-xl border border-transparent bg-[#F2FBF6] ps-10 pe-3 py-2.5 text-sm font-medium text-[#17251E] placeholder:text-[#5B6D63] focus:border-[#399B6B] focus:bg-white focus:outline-none transition-colors"
                    />
                    <datalist id="kc-hero-trades">
                      {SERVICE_CATALOG.map((s) => (
                        <option key={s.id} value={isUr ? s.urduName : s.name} />
                      ))}
                    </datalist>
                  </div>

                  <div className="sm:col-span-4">
                    <CityCombobox
                      value={searchCity}
                      onChange={setSearchCity}
                      allowAll
                      placeholder={bi('Any city in Pakistan', 'پاکستان کا کوئی بھی شہر')}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#176B4A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#11221B] transition-colors whitespace-nowrap"
                    >
                      <Search className="h-4 w-4" />
                      <span>{bi('Search', 'تلاش')}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-2 pb-0.5 text-xs">
                  <span className="font-semibold text-[#5B6D63]">{bi('Popular:', 'نمایاں تلاش:')}</span>
                  {[
                    { label: bi('Electrician in Rawalpindi', 'راولپنڈی میں الیکٹریشن'), trade: 'electrician', city: 'Rawalpindi' },
                    { label: bi('Plumber in Lahore', 'لاہور میں پلمبر'), trade: 'plumber', city: 'Lahore' },
                    { label: bi('AC Technician in Islamabad', 'اسلام آباد میں اے سی ماہر'), trade: 'ac-technician', city: 'Islamabad' },
                  ].map((preset) => (
                    <Link
                      key={preset.label}
                      to={`/explore?trade=${preset.trade}&city=${encodeURIComponent(preset.city)}`}
                      className="font-semibold text-[#176B4A] hover:text-[#11221B] hover:underline underline-offset-4 transition-colors"
                    >
                      {preset.label}
                    </Link>
                  ))}
                </div>
              </form>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link
                  to="/explore"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#176B4A] px-7 py-3.5 text-sm font-bold text-white hover:bg-[#11221B] transition-all shadow-sm hover:-translate-y-0.5 whitespace-nowrap"
                >
                  <span>{bi('Explore Proven Workers', 'ہنرمند تلاش کریں')}</span>
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </div>
            </motion.div>

            {/* Open Floating Portfolio Preview */}
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5 relative lg:ps-4"
            >
              <div className="relative mx-auto max-w-md">
                <div className="overflow-hidden rounded-3xl bg-white border border-[#CFE9D8] shadow-[0_24px_60px_-20px_rgba(17,34,27,0.22)] kc-hover-lift">
                  <div className="relative h-60 overflow-hidden bg-[#11221B]">
                    <img
                      src={HERO_IMG}
                      alt={bi(
                        'Skilled electrician inspecting a commercial distribution panel with digital multimeter',
                        'ماہر الیکٹریشن ڈیجیٹل ملٹی میٹر کے ساتھ ڈسٹری بیوشن پینل کا معائنہ کرتے ہوئے'
                      )}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#11221B]/90 via-[#11221B]/25 to-transparent" />
                    <div className="absolute bottom-4 start-5 end-5 flex items-center justify-between text-white">
                      <div>
                        <p className="text-[11px] font-semibold text-[#B8E4C7]">
                          {bi(
                            'Rubric-Assessed Evidence · Islamabad',
                            'معیار کے مطابق جانچا گیا ثبوت · اسلام آباد'
                          )}
                        </p>
                        <p className="text-sm font-bold mt-0.5">
                          {bi('Electrical Safety Practices · Level 3', 'برقی حفاظتی تدابیر · درجہ ۳')}
                        </p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#399B6B] text-white shrink-0 shadow-sm">
                        <ShieldCheck className="h-5 w-5" />
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={AVATAR_BILAL}
                          alt={bi('Featured electrician portfolio preview', 'الیکٹریشن پورٹ فولیو کا نمونہ')}
                          referrerPolicy="no-referrer"
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-[#73C99B] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#17251E] truncate">
                            {bi('Bilal Ahmed · Electrician', 'بلال احمد · الیکٹریشن')}
                          </p>
                          <p className="text-xs text-[#4D6357] truncate">
                            {bi('Assessor-verified · 12-Month Badges', 'ماہر سے تصدیق شدہ · ۱۲ ماہ بیج')}
                          </p>
                        </div>
                      </div>
                      <TierPill tier="GOLD" compact />
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#4D6357]">
                          {bi('Karigar Trust Score', 'کاریگر ٹرسٹ اسکور')}
                        </span>
                        <span className="font-mono font-bold text-[#176B4A] tabular-nums">92 / 100</span>
                      </div>
                      <HorizontalProgressBar value={92} heightClass="h-2" />
                    </div>
                  </div>
                </div>

                <FloatingCard
                  offset={6}
                  duration={5.6}
                  delay={0.4}
                  className="hidden sm:block absolute -bottom-5 -start-6 w-56 rounded-2xl bg-[#11221B] text-white p-3.5 shadow-xl"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#399B6B]/30 text-[#B8E4C7] shrink-0">
                      <Lock className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {bi('Privacy-First Hiring', 'رازداری پر مبنی رابطہ')}
                      </p>
                      <p className="text-[11px] text-[#B8E4C7]">
                        {bi('Phone hidden until accepted', 'منظوری تک فون نمبر پوشیدہ')}
                      </p>
                    </div>
                  </div>
                </FloatingCard>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. PROOF WORKER CARDS (Clean crisp white elevated surfaces on soft mint band) */}
      <section className="bg-[#F2FBF6] border-y border-[#CFE9D8] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#176B4A]">
                {bi('Proof Over Promises · Proven Portfolios', 'دعووں کے بجائے عملی ثبوت')}
              </p>
              <h2 className="mt-1.5 text-2xl sm:text-4xl font-extrabold tracking-tight text-[#11221B]">
                {bi('Verified Karigars with Practical Badges', 'تصدیق شدہ ہنرمند اور ان کے مہارتی بیج')}
              </h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {leaderCities.map((c) => (
                <button
                  key={c || 'all'}
                  type="button"
                  onClick={() => setLeaderCity(c)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    leaderCity === c
                      ? 'bg-[#11221B] text-white'
                      : 'bg-white border border-[#CFE9D8] text-[#17251E] hover:bg-[#DDF3E4]'
                  }`}
                >
                  {c || bi('All Pakistan', 'پورا پاکستان')}
                </button>
              ))}
            </div>
          </div>

          {loadingWorkers ? (
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-60 rounded-3xl bg-white/80 animate-pulse" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="mt-8 rounded-3xl bg-white border border-[#CFE9D8] p-8 text-center text-sm text-[#4D6357]">
              {bi(
                'No public worker profiles listed in this city yet. Clear city filter or explore all workers.',
                'اس شہر میں ابھی کوئی عوامی پروفائل موجود نہیں۔ تمام شہر دیکھنے کے لیے فلٹر تبدیل کریں۔'
              )}
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {leaderboard.slice(0, 6).map((w) => (
                <div
                  key={w.workerProfileId}
                  className="rounded-3xl kc-beige-surface p-6 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start gap-3.5">
                      <div className="h-14 w-14 rounded-2xl bg-[#DDF3E4] overflow-hidden flex items-center justify-center font-bold text-[#176B4A] shrink-0">
                        {w.avatarUrl ? (
                          <img src={w.avatarUrl} alt={w.fullName} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                        ) : (
                          w.fullName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-extrabold text-[#11221B] truncate">{w.fullName}</h3>
                          <TrustScoreBadge score={w.trustScore} compact />
                        </div>
                        <p className="text-xs font-semibold text-[#176B4A] mt-0.5 truncate">
                          {isUr && w.tradeUrduName ? w.tradeUrduName : w.tradeName}
                          {w.yearsExperience ? ` · ${w.yearsExperience} ${bi('yrs exp', 'سال تجربہ')}` : ''}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-[#4D6357]">
                          <MapPin className="h-3.5 w-3.5 text-[#399B6B] shrink-0" />
                          <span>{w.city}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                      <TierPill tier={w.tier} compact />
                      <StarRatingInline rating={w.bayesianRating} count={w.totalReviews} />
                    </div>

                    <div className="mt-4 rounded-2xl bg-[#F2FBF6] border border-[#DCEFE3] p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-[#176B4A]">
                        <span className="inline-flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5 shrink-0" />
                          <span className="tabular-nums">
                            {w.verifiedCount} {bi('Verified Badges', 'تصدیق شدہ بیجز')}
                          </span>
                        </span>
                        <span className="text-[11px] text-[#4D6357] tabular-nums">
                          {w.completedJobsCount} {bi('completed jobs', 'مکمل کام')}
                        </span>
                      </div>
                      {w.verifiedBadges && w.verifiedBadges.length > 0 ? (
                        <ul className="space-y-1 text-xs text-[#17251E]">
                          {w.verifiedBadges.slice(0, 2).map((b: any) => (
                            <li key={b.id} className="flex items-center justify-between gap-2">
                              <span className="truncate font-medium">
                                • {isUr && b.competencyUrduTitle ? b.competencyUrduTitle : b.competencyTitle}
                              </span>
                              <span className="shrink-0 rounded-md bg-[#DDF3E4] px-1.5 py-0.5 text-[10px] font-bold text-[#176B4A] whitespace-nowrap">
                                {formatLevelLabel(b.level, lang)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-[#4D6357]">
                          {bi('Building rubric evidence portfolio', 'عملی ثبوت کا پورٹ فولیو تیار ہو رہا ہے')}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/workers/${w.publicId}`}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#176B4A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#11221B] transition-colors"
                  >
                    <span>{bi('View portfolio', 'پورٹ فولیو دیکھیں')}</span>
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. POPULAR VERIFIED CATEGORIES (Crisp white canvas) */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#176B4A]">
                {bi('Featured Core Trades', 'نمایاں بنیادی پیشے')}
              </p>
              <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11221B]">
                {bi('Popular Verified Categories', 'مقبول تصدیق شدہ پیشے')}
              </h2>
            </div>
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#176B4A] hover:underline whitespace-nowrap"
            >
              <span>{bi('Browse all 48+ categories', 'تمام ۴۸+ پیشے دیکھیں')}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-7 md:grid-cols-3">
            {trades.map((trade) => {
              const Icon = trade.icon;
              return (
                <Link
                  key={trade.slug}
                  to={`/explore?trade=${trade.slug}`}
                  className="group flex flex-col overflow-hidden rounded-3xl kc-beige-surface"
                >
                  <div className="h-52 w-full overflow-hidden bg-[#DDF3E4]">
                    <img
                      src={trade.img}
                      alt={trade.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-bold text-[#11221B]">{trade.name}</h3>
                      <span className="text-sm text-[#5B6D63]">{trade.secondary}</span>
                    </div>
                    <p className="mt-2 flex-1 text-sm text-[#4D6357] leading-relaxed">{trade.description}</p>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#176B4A] group-hover:text-[#11221B]">
                      <Icon className="h-4 w-4" />
                      <span>{bi(`Explore ${trade.name}s`, `${trade.name} تلاش کریں`)}</span>
                      <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. SKILL DEMAND INSIGHTS (Interactive Marketplace Telemetry & 6 Real-Data Charts) */}
      <section id="skill-demand-insights" className="bg-[#F2FBF6] border-y border-[#CFE9D8] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#176B4A]">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>{bi('Live Skill Demand Analytics', 'لائیو اسکل ڈیمانڈ تجزیات')}</span>
              </p>
              <h2 className="mt-1.5 text-2xl sm:text-4xl font-extrabold tracking-tight text-[#11221B]">
                {bi('Skill Demand Insights', 'مہارتوں کی طلب اور رجحانات (Skill Demand Insights)')}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[#4D6357]">
                {bi(
                  'Help Hirers identify available talent and help Karigars discover which skills and cities currently have the strongest demand.',
                  'ہائررز کو دستیاب ہنرمندوں اور کاریگروں کو زیادہ طلب والی مہارتوں اور شہروں کو پہچاننے میں مدد۔'
                )}
              </p>
            </div>
            <Link
              to="/demand-insights"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#11221B] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#176B4A] transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <span>{bi('Open Full Insights View', 'مکمل ڈیمانڈ تجزیات کھولیں')}</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </div>

          <SkillDemandInsightsSection embedded />
        </div>
      </section>

      {/* 5. CLEAN HAIRLINE BILINGUAL FAQ + OPEN CLOSING CTA (Pure White Canvas) */}
      <section id="faq" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#CFE9D8] pb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#176B4A] inline-flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>{bi('Frequently Asked Questions', 'اکثر پوچھے جانے والے سوالات')}</span>
              </p>
              <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-[#11221B]">
                {bi('Quick Answers in English & Urdu', 'انگریزی اور اردو میں مختصر سوالات و جوابات')}
              </h2>
            </div>
            <a
              href={WHATSAPP_WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#176B4A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#11221B] transition-colors shrink-0"
            >
              <MessageCircle className="h-4 w-4 text-[#B8E4C7]" />
              <span>{bi('Ask on WhatsApp Help', 'واٹس ایپ پر مدد لیں')}</span>
            </a>
          </div>

          <div className="divide-y divide-[#DCEFE3]">
            {faqs.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 py-5 text-start font-bold text-sm sm:text-base text-[#11221B] hover:text-[#176B4A] transition-colors"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-[#176B4A] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
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
                        <p className="pb-5 text-xs sm:text-sm text-[#4D6357] leading-relaxed">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Open Editorial Closing CTA (Mint & White Harmony) */}
          <div className="mt-16 rounded-3xl bg-gradient-to-br from-[#DDF3E4] via-[#ECF8F1] to-white border border-[#B8E4C7] px-6 py-12 sm:px-12 text-center shadow-xs">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#11221B] text-balance">
              {bi('Hire with proof, not guesswork.', 'اندازے پر نہیں، مصدقہ ثبوت پر بھرتی اور بکنگ کریں۔')}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-[#3E5247]">
              {bi(
                'Join skilled Karigars, approved assessors, homeowners, and businesses across Pakistan.',
                'پاکستان بھر کے ہنرمندوں، ماہرین، گھریلو صارفین اور کاروباری اداروں کے نیٹ ورک میں شامل ہوں۔'
              )}
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#176B4A] px-7 py-3.5 text-sm font-bold text-white hover:bg-[#11221B] transition-colors shadow-sm"
              >
                <span>{bi('Get Started', 'ابھی شروع کریں')}</span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link
                to="/verify-badge"
                className="inline-flex items-center justify-center rounded-full bg-white border border-[#B8E4C7] px-7 py-3.5 text-sm font-semibold text-[#11221B] hover:bg-[#DDF3E4] transition-colors shadow-xs"
              >
                {bi('Verify a Badge or Passport', 'بیج یا پاسپورٹ کی تصدیق')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
