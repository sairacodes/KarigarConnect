import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { PublicLayout } from '../../components/layouts/PublicLayout';
import { EmptyState, LoadingSkeleton, formatDate, formatLevelLabel } from '../../components/ui/Components';
import { PageTransition } from '../../components/ui/MotionPrimitives';
import { TierPill, TrustScoreBadge } from '../../components/ui/RatingDisplay';
import { VoiceMicButton } from '../../components/ui/VoiceMicButton';
import { useI18n } from '../../i18n/translations';
import { api, getApiErrorMessage } from '../../services/api';
import { ProblemFinderAnalysis, analyzeHomeProblem } from '../../services/aiProblemFinder';
import { TradeRecord } from '../../services/storage/types';

// ==================== 1. WHY KARIGAR CONNECT PAGE ====================
export function WhyKarigarConnectPage() {
  const { bi } = useI18n();

  const trustLayers: Array<{ num: string; title: string; desc: string; icon: any }> = [
    {
      num: '01',
      title: bi('Assessor-Verified Practical Skills', 'ماہرین سے تصدیق شدہ عملی مہارتیں'),
      desc: bi(
        'Workers upload real photos and videos of completed tasks. Admin-approved trade assessors score every competency on a strict 0–3 rubric — a safety-critical 0 blocks verification automatically.',
        'ہنرمند اپنے اصل کام کی تصاویر اور ویڈیوز اپ لوڈ کرتے ہیں۔ منظور شدہ ٹریڈ ماہرین ۰ تا ۳ معیار پر جانچ کرتے ہیں اور حفاظتی اصول پر صفر نمبر آنے پر تصدیق روک دی جاتی ہے۔'
      ),
      icon: ClipboardCheck,
    },
    {
      num: '02',
      title: bi('Customer Ratings from Real Completed Jobs', 'مکمل شدہ کاموں پر صارفین کی درجہ بندی'),
      desc: bi(
        'Only customers who complete a real job through KARIGAR CONNECT can leave a Verified Hire review across Quality, Punctuality, Behaviour, and Value — preventing fake anonymous spam.',
        'صرف وہی صارفین ریویو دے سکتے ہیں جن کا کام واقعی کاریگر کنیکٹ پر مکمل ہوا ہو، تاکہ جعلی ریویوز سے بچا جا سکے۔'
      ),
      icon: Star,
    },
    {
      num: '03',
      title: bi('Customer-Confirmed Proof of Work', 'صارف سے تصدیق شدہ کام کا ثبوت'),
      desc: bi(
        'Before-and-after job photos are confirmed directly by the homeowner or facility manager after completion, building an authentic visual record on the worker’s portfolio.',
        'کام مکمل ہونے کے بعد پہلے اور بعد کی تصاویر کی براہِ راست صارف تصدیق کرتا ہے جو پورٹ فولیو میں شامل ہوتی ہیں۔'
      ),
      icon: UserCheck,
    },
  ];

  const comparisonRows: Array<{ feature: string; traditional: string; karigar: string }> = [
    {
      feature: bi('Skill verification', 'مہارت کی تصدیق'),
      traditional: bi('Self-declared profile text only', 'صرف خود لکھے گئے دعوے'),
      karigar: bi('Practical evidence scored 0–3 by approved trade assessors', 'ماہرین کی جانب سے ۰ تا ۳ معیار پر عملی ثبوت کی جانچ'),
    },
    {
      feature: bi('Safety accountability', 'حفاظتی ذمہ داری'),
      traditional: bi('No structured safety criteria checks', 'کوئی منظم حفاظتی معیار نہیں'),
      karigar: bi('Safety-critical score 0 automatically blocks badge', 'حفاظتی معیار پر صفر نمبر بیج جاری ہونے سے روک دیتا ہے'),
    },
    {
      feature: bi('Reviews integrity', 'ریویوز کا معیار'),
      traditional: bi('Unverified stars without job tracking', 'بغیر مکمل کام کے غیر مصدقہ ستارے'),
      karigar: bi('Verified Hire reviews tied to real completed jobs + photos', 'حقیقی مکمل کام اور تصاویر سے منسلک تصدیق شدہ ریویوز'),
    },
    {
      feature: bi('Pricing clarity', 'قیمتوں کی شفافیت'),
      traditional: bi('Guesswork negotiation on arrival', 'موقع پر غیر واضح قیمت اور بحث'),
      karigar: bi('PKR Fair Price Guide visible before booking + quote comparison', 'بکنگ سے پہلے پاکستانی روپے میں مناسب نرخ نامہ اور موازنہ'),
    },
    {
      feature: bi('Post-job reassurance', 'کام کے بعد تحفظ'),
      traditional: bi('No structured rework path', 'کام خراب ہونے پر کوئی باضابطہ حل نہیں'),
      karigar: bi('7-Day Karigar Guarantee rework review & Admin resolution', '۷ دن کی کاریگر گارنٹی اور ایڈمن نظرِ ثانی'),
    },
    {
      feature: bi('Phone & email privacy', 'ذاتی رابطے کی رازداری'),
      traditional: bi('Numbers exposed openly to scrapers', 'فون نمبر کھلے عام ہر کسی کو نظر آتے ہیں'),
      karigar: bi('Phone & email stay hidden until worker accepts request or job', 'منظوری تک فون نمبر اور ای میل پوشیدہ رہتے ہیں'),
    },
  ];

  return (
    <PublicLayout>
      <PageTransition className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
        <div className="rounded-3xl border border-[#D8D0BE] kc-hero-surface p-7 sm:p-11">
          <p className="text-xs font-bold uppercase tracking-wider text-[#176B4A]">
            {bi('Why Karigar Connect', 'کاریگر کنیکٹ ہی کیوں؟')}
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#17251E] text-balance">
            {bi(
              'Other apps tell you who is available. Karigar Connect tells you who is proven.',
              'دوسری ایپس صرف یہ بتاتی ہیں کہ کون دستیاب ہے۔ کاریگر کنیکٹ بتاتا ہے کہ کون ثابت شدہ ہنرمند ہے۔'
            )}
          </h1>
          <p className="mt-4 max-w-3xl text-base text-[#17251E]/80 leading-relaxed">
            {bi(
              'Across Pakistan, skilled electricians, plumbers, AC technicians, beauty professionals, mechanics, and craftsmen rarely have formal certificates — yet homeowners and businesses need confidence before inviting someone inside. Karigar Connect solves that gap with three independent layers of proof.',
              'پاکستان بھر میں لاکھوں ماہر الیکٹریشن، پلمبر، اے سی ٹیکنیشن، بیوٹی پروفیشنلز اور مکینک کاغذی ڈگری نہیں رکھتے، جبکہ صارفین کو گھر بلانے سے پہلے اعتماد درکار ہوتا ہے۔ کاریگر کنیکٹ اعتماد کی تین مضبوط تہوں کے ساتھ اس خلا کو پُر کرتا ہے۔'
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 rounded-full bg-[#176B4A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#13563B]"
            >
              <span>{bi('Explore Proven Workers', 'تصدیق شدہ ہنرمند دیکھیں')}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-extrabold text-[#17251E]">
            {bi('Three Independent Layers of Trust', 'اعتماد کی تین آزاد تہیں')}
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            {trustLayers.map((layer) => {
              const Icon = layer.icon;
              return (
                <div key={layer.num} className="rounded-3xl kc-glass-card kc-hover-lift p-6">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECE6D7] text-[#176B4A]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-sm font-bold text-[#399B6B]">{layer.num}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#17251E]">{layer.title}</h3>
                  <p className="mt-2 text-sm text-[#69726B] leading-relaxed">{layer.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl kc-glass-card p-6 sm:p-8 overflow-x-auto">
          <h2 className="text-xl font-extrabold text-[#17251E]">
            {bi('How Proof-First Hiring Compares', 'روایتی ڈائریکٹری بمقابلہ کاریگر کنیکٹ')}
          </h2>
          <table className="mt-5 w-full text-start text-sm">
            <thead>
              <tr className="border-b border-[#E6E0D2] text-xs uppercase text-[#69726B]">
                <th className="py-3 pe-4">{bi('Area', 'پہلو')}</th>
                <th className="py-3 pe-4">{bi('Traditional Apps / Directories', 'روایتی ایپس / ڈائریکٹریز')}</th>
                <th className="py-3 text-[#176B4A]">{bi('KARIGAR CONNECT', 'کاریگر کنیکٹ')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E0D2]">
              {comparisonRows.map((row) => (
                <tr key={row.feature}>
                  <td className="py-3.5 pe-4 font-semibold text-[#17251E]">{row.feature}</td>
                  <td className="py-3.5 pe-4 text-[#69726B]">{row.traditional}</td>
                  <td className="py-3.5 font-medium text-[#176B4A]">
                    <span className="inline-flex items-start gap-1.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#399B6B]" />
                      <span>{row.karigar}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="rounded-2xl border border-[#D8D0BE] bg-[#F7F4EC] p-5 text-xs text-[#69726B] flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-[#176B4A] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-[#17251E]">{bi('Verification Scope Disclosure:', 'تصدیق کی وضاحت:')}</strong>{' '}
            {bi(
              'A verified badge means a competency was assessed by an authorized KARIGAR CONNECT assessor with a defined rubric. It is NOT government accreditation.',
              'تصدیق شدہ بیج کا مطلب یہ ہے کہ مہارت کو منظور شدہ کاریگر کنیکٹ ماہرِ جائزہ نے طے شدہ معیار کے مطابق پرکھا ہے۔ یہ سرکاری سند یا لائسنس نہیں ہے۔'
            )}
          </p>
        </div>
      </PageTransition>
    </PublicLayout>
  );
}

// ==================== 2. TRUST SCORE & TIERS GUIDE ====================
export function TrustScoreGuidePage() {
  const { bi } = useI18n();

  const scoreWeights: Array<{ title: string; weight: string; detail: string }> = [
    {
      title: bi('Verified Competency Badges', 'تصدیق شدہ مہارتوں کے بیج'),
      weight: '40%',
      detail: bi(
        'Number and rubric level (Basic, Competent, Advanced) of active 12-month badges awarded by approved assessors.',
        'منظور شدہ ماہرین کی جانب سے دیے گئے فعال ۱۲ ماہ کے بیجز کی تعداد اور معیاری درجہ۔'
      ),
    },
    {
      title: bi('Bayesian Customer Rating', 'صارفین کی متوازن درجہ بندی'),
      weight: '30%',
      detail: bi(
        'Weighted 1–5 rating from real completed Verified Hire jobs so a worker with 1 review does not outrank someone with 20 reliable jobs.',
        'حقیقی مکمل کاموں پر مبنی متوازن ۱ تا ۵ ریٹنگ تاکہ صرف ایک ریویو سے رینکنگ متاثر نہ ہو۔'
      ),
    },
    {
      title: bi('Completed Jobs & Repeat Customers', 'مکمل کام اور دوبارہ بکنگ'),
      weight: '15%',
      detail: bi(
        'Consistent delivery across verified jobs plus customers who hire the same karigar more than once.',
        'مکمل کیے گئے کاموں کی تعداد اور وہ صارفین جو بار بار اسی کاریگر کو بلاتے ہیں۔'
      ),
    },
    {
      title: bi('Response & Low Cancellation', 'فوری جواب اور کم منسوخی'),
      weight: '10%',
      detail: bi(
        'Accepting requests smoothly and keeping scheduled appointments without worker-side cancellations.',
        'درخواستوں پر بروقت ردِ عمل اور طے شدہ وقت کی پابندی۔'
      ),
    },
    {
      title: bi('Safety & Guarantee Record', 'حفاظتی اور گارنٹی ریکارڈ'),
      weight: '5%',
      detail: bi(
        'Clean safety-critical rubric record, zero unresolved moderation reports, and upheld guarantee discipline.',
        'حفاظتی اصولوں کی پاسداری، کوئی زیرِ التوا شکایت نہ ہونا اور ۷ دن کی گارنٹی کا صاف ریکارڈ۔'
      ),
    },
  ];

  const tierLevels: Array<{ tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'; req: string; benefit: string }> = [
    {
      tier: 'BRONZE',
      req: bi('1+ Verified Competency · Rating 3.8+ · 2+ Completed Jobs · 0 Unresolved Reports', '۱+ تصدیق شدہ مہارت · ریٹنگ ۳.۸+ · ۲+ مکمل کام · ۰ زیرِ التوا شکایات'),
      benefit: bi('Entry verified Karigar status on public directory & Karigar Passport.', 'عوامی ڈائریکٹری اور کاریگر پاسپورٹ پر ابتدائی تصدیق شدہ درجہ۔'),
    },
    {
      tier: 'SILVER',
      req: bi('2+ Verified Competencies · Rating 4.2+ · 8+ Completed Jobs · 3+ Months Active', '۲+ تصدیق شدہ مہارتیں · ریٹنگ ۴.۲+ · ۸+ مکمل کام · ۳+ ماہ فعال'),
      benefit: bi('Priority visibility in city search & Verified Work Proof spotlight.', 'شہر کی تلاش میں بہتر نمائش اور تصدیق شدہ کام کے ثبوت کی نمایاں جگہ۔'),
    },
    {
      tier: 'GOLD',
      req: bi('3+ Verified Competencies · Rating 4.6+ · 20+ Completed Jobs · 6+ Months Active', '۳+ تصدیق شدہ مہارتیں · ریٹنگ ۴.۶+ · ۲۰+ مکمل کام · ۶+ ماہ فعال'),
      benefit: bi('Featured Gold Karigar badge on City Leaderboard & higher trust score ceiling.', 'شہر کے ٹاپ کاریگر لیڈربورڈ میں نمایاں گولڈ بیج۔'),
    },
    {
      tier: 'PLATINUM',
      req: bi('4+ Verified Competencies · Rating 4.8+ · 45+ Completed Jobs · 12+ Months Active', '۴+ تصدیق شدہ مہارتیں · ریٹنگ ۴.۸+ · ۴۵+ مکمل کام · ۱۲+ ماہ فعال'),
      benefit: bi('Top-tier mastery status reviewed and approved by Platform Administrators.', 'پلیٹ فارم ایڈمن کی جانب سے منظور شدہ اعلیٰ ترین مہارت کا درجہ۔'),
    },
  ];

  return (
    <PublicLayout>
      <PageTransition className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        <div className="rounded-3xl kc-glass-card p-6 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-wider text-[#399B6B]">
            {bi('Transparent Scoring Formula', 'شفاف اسکورنگ فارمولا')}
          </p>
          <h1 className="mt-1.5 text-3xl font-extrabold text-[#17251E]">
            {bi('How the Karigar Trust Score & Tiers Work', 'کاریگر ٹرسٹ اسکور اور درجات کیسے کام کرتے ہیں')}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#69726B] leading-relaxed">
            {bi(
              'Every public worker portfolio displays a 0–100 Trust Score calculated from objective rubric results, real completed jobs, and verified customer feedback — never paid boosts.',
              'ہر عوامی پروفائل پر ۰ تا ۱۰۰ ٹرسٹ اسکور نظر آتا ہے جو عملی جانچ کے نتائج، مکمل کاموں اور صارفین کے مصدقہ فیڈبیک سے بنتا ہے — پیسے دے کر رینکنگ نہیں خریدی جا سکتی۔'
            )}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scoreWeights.map((w) => (
              <div key={w.title} className="rounded-2xl border border-[#E6E0D2] bg-[#F7F4EC] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[#17251E]">{w.title}</span>
                  <span className="font-mono text-base font-extrabold text-[#176B4A]">{w.weight}</span>
                </div>
                <p className="mt-2 text-xs text-[#69726B] leading-relaxed">{w.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl kc-glass-card p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-extrabold text-[#17251E]">
            {bi('Karigar Tier Badges (12-Month Validity & Auto Review)', 'کاریگر درجات (۱۲ ماہ کی معیاد اور خودکار نظرِ ثانی)')}
          </h2>
          <p className="text-sm text-[#69726B]">
            {bi(
              'Eligible workers are queued for Admin approval once thresholds are met. If a worker’s average rating later drops below their tier’s minimum, their tier automatically switches to Under Review.',
              'مطلوبہ معیار پورا ہونے پر ہنرمند ایڈمن منظوری کے لیے قطار میں شامل ہو جاتے ہیں۔ اگر بعد میں ریٹنگ کم ہو جائے تو درجہ خودکار طور پر زیرِ جائزہ ہو جاتا ہے۔'
            )}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {tierLevels.map((item) => (
              <div key={item.tier} className="rounded-2xl border border-[#E6E0D2] bg-white p-5">
                <TierPill tier={item.tier} />
                <p className="mt-3 text-xs font-semibold text-[#17251E]">{item.req}</p>
                <p className="mt-1.5 text-xs text-[#69726B]">{item.benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </PageTransition>
    </PublicLayout>
  );
}

// ==================== 3. PUBLIC BADGE & PASSPORT VERIFICATION ====================
export function VerifyBadgePage() {
  const { bi, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const runLookup = async (lookupCode: string) => {
    const trimmed = lookupCode.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.get(`/public/verify/${encodeURIComponent(trimmed)}`);
      setResult(res.data.data);
    } catch (err) {
      setError(getApiErrorMessage(err, bi('No matching Badge ID or Karigar Passport found.', 'کوئی مطابق بیج آئی ڈی یا کاریگر پاسپورٹ نہیں ملا۔')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      runLookup(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSearchParams({ code: code.trim() });
    runLookup(code);
  };

  const sampleCodes = ['badge_bilal_safety', 'KC-PASS-BILAL1', 'badge_nadia_ac_1', 'zainab-fatima-beauty'];

  return (
    <PublicLayout>
      <PageTransition className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        <div className="rounded-3xl kc-glass-card p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-[#399B6B]">
            {bi('Public Verification Registry', 'عوامی تصدیقی ریکارڈ')}
          </p>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-[#17251E]">
            {bi('Verify a Karigar Badge or Passport', 'کاریگر بیج یا پاسپورٹ کی تصدیق کریں')}
          </h1>
          <p className="mt-1.5 text-sm text-[#69726B]">
            {bi(
              'Enter a Competency Badge ID, Karigar Passport ID (e.g. KC-PASS-BILAL1), or public portfolio handle to check authenticity and 12-month validity.',
              'اصلیت اور ۱۲ ماہ کی معیاد جانچنے کے لیے بیج آئی ڈی، کاریگر پاسپورٹ آئی ڈی یا پروفائل ہینڈل درج کریں۔'
            )}
          </p>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3.5 top-3 h-4 w-4 text-[#69726B]" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={bi('e.g. KC-PASS-BILAL1 or badge_bilal_safety', 'مثلاً KC-PASS-BILAL1 یا badge_bilal_safety')}
                className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] ps-10 pe-3.5 py-2.5 text-sm text-[#17251E] focus:border-[#399B6B] focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#176B4A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#13563B] disabled:opacity-60 whitespace-nowrap"
            >
              {loading ? bi('Checking...', 'جانچ جاری ہے...') : bi('Verify Now', 'تصدیق کریں')}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#69726B]">
            <span>{bi('Quick demo IDs:', 'نمونہ آئی ڈیز:')}</span>
            {sampleCodes.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setCode(sample);
                  setSearchParams({ code: sample });
                  runLookup(sample);
                }}
                className="rounded-lg border border-[#E6E0D2] bg-[#F7F4EC] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#176B4A] hover:bg-[#ECE6D7]"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {loading && <LoadingSkeleton rows={3} />}

        {error && !loading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex items-start gap-3 text-red-800">
            <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">{bi('Record Not Found', 'ریکارڈ نہیں ملا')}</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="rounded-3xl kc-glass-card p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E0D2] pb-4">
              <div>
                <p className="font-mono text-xs font-bold text-[#69726B]">{result.code}</p>
                <h2 className="mt-1 text-xl font-extrabold text-[#17251E]">{result.workerName}</h2>
                <p className="text-sm text-[#69726B]">
                  {result.tradeName} · {result.workerCity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {result.status === 'VALID' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8D0BE] bg-[#ECE6D7] px-3.5 py-2 text-xs font-bold text-[#176B4A]">
                    <CheckCircle2 className="h-4 w-4" />
                    {bi('VALID & ACTIVE', 'مصدقہ اور فعال')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700">
                    <ShieldAlert className="h-4 w-4" />
                    {result.status}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <TierPill tier={result.tier} />
              {typeof result.trustScore === 'number' && <TrustScoreBadge score={result.trustScore} />}
              {result.passportId && (
                <span className="rounded-lg border border-[#E6E0D2] bg-[#F7F4EC] px-2.5 py-1 font-mono text-xs font-bold text-[#17251E]">
                  {result.passportId}
                </span>
              )}
            </div>

            {result.lookupType === 'BADGE' ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-[#E6E0D2] bg-[#F7F4EC] p-4 text-sm">
                <div>
                  <dt className="text-xs text-[#69726B]">{bi('Competency Verified', 'تصدیق شدہ مہارت')}</dt>
                  <dd className="font-bold text-[#17251E]">{result.competencyTitle}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#69726B]">{bi('Verification Level', 'تصدیقی درجہ')}</dt>
                  <dd className="font-bold text-[#176B4A]">{formatLevelLabel(result.level, lang)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#69726B]">{bi('Authorized Assessor', 'مجاز ماہرِ جائزہ')}</dt>
                  <dd className="font-semibold text-[#17251E]">{result.assessorName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#69726B]">{bi('Issued / Valid Until', 'تاریخِ اجراء / معیاد')}</dt>
                  <dd className="font-mono text-xs text-[#17251E]">
                    {formatDate(result.issuedAt, lang)} — {formatDate(result.expiresAt, lang)}
                  </dd>
                </div>
              </dl>
            ) : (
              <div>
                <h3 className="text-sm font-bold text-[#17251E] mb-3">
                  {bi('Issued Competency Badges', 'جاری کردہ مہارتوں کے بیج')} ({result.badges?.length || 0})
                </h3>
                {result.badges?.length > 0 ? (
                  <div className="space-y-2.5">
                    {result.badges.map((b: any) => (
                      <div
                        key={b.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] p-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-[#17251E]">{b.competencyTitle}</p>
                          <p className="text-[#69726B]">
                            {formatLevelLabel(b.level, lang)} · {bi('Assessor:', 'ماہر:')} {b.assessorName}
                          </p>
                        </div>
                        <div className="text-end font-mono">
                          <span className={b.status === 'VALID' ? 'text-[#176B4A] font-bold' : 'text-red-700 font-bold'}>
                            {b.status}
                          </span>
                          <p className="text-[11px] text-[#69726B]">
                            {bi('Exp:', 'میعاد:')} {formatDate(b.expiresAt, lang)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#69726B]">{bi('No active competency badges on file.', 'کوئی فعال بیج موجود نہیں۔')}</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs text-[#69726B] max-w-lg">
                {bi(
                  'A verified badge means a competency was assessed by an authorized assessor with a defined rubric. It is NOT government accreditation.',
                  'تصدیقی بیج منظور شدہ ماہرِ جائزہ کی جانچ کی بنیاد پر جاری ہوتا ہے اور یہ سرکاری سند نہیں ہے۔'
                )}
              </p>
              {result.workerPublicId && (
                <Link
                  to={`/workers/${result.workerPublicId}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-5 py-2 text-xs font-semibold text-white hover:bg-[#13563B]"
                >
                  <span>{bi('View Full Portfolio', 'مکمل پورٹ فولیو دیکھیں')}</span>
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              )}
            </div>
          </div>
        )}

        {!result && !error && !loading && (
          <EmptyState
            title={bi('Check any worker credential before hiring', 'بھرتی سے پہلے سند کی تصدیق کریں')}
            description={bi(
              'Scan a worker’s QR Karigar Passport or paste a Badge ID above to confirm its authenticity.',
              'اصلیت کی تصدیق کے لیے ورکر کا کیو آر پاسپورٹ اسکین کریں یا بیج آئی ڈی درج کریں۔'
            )}
          />
        )}
      </PageTransition>
    </PublicLayout>
  );
}

// ==================== 4. AI PROBLEM FINDER PAGE ====================
export function AiProblemFinderPage() {
  const { bi, isUr, lang } = useI18n();
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ProblemFinderAnalysis | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/public/trades').then((res) => setTrades(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (description.trim().length < 5 && !imageFile) {
      setError(bi('Describe the issue or upload a photo of the problem.', 'مسئلے کی تفصیل لکھیں یا تصویر اپ لوڈ کریں۔'));
      return;
    }
    setAnalyzing(true);
    try {
      const res = await analyzeHomeProblem({ description, imageFile, lang, trades });
      setAnalysis(res);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  const quickExamples: Array<{ label: string; text: string }> = [
    {
      label: bi('Breaker tripping', 'بریکر بار بار گرنا'),
      text: bi(
        'Main breaker trips whenever AC and water motor run together, burning smell near DB box.',
        'جب اے سی اور پانی کی موٹر اکٹھے چلتے ہیں تو مین بریکر ٹرپ ہو جاتا ہے اور ڈسٹری بیوشن باکس سے بو آتی ہے۔'
      ),
    },
    {
      label: bi('AC not cooling', 'اے سی ٹھنڈک نہیں دے رہا'),
      text: bi(
        'Inverter split AC indoor unit is dripping water on the wall and blowing warm air.',
        'انورٹر سپلیٹ اے سی کے انڈور یونٹ سے پانی ٹپک رہا ہے اور ہوا گرم آ رہی ہے۔'
      ),
    },
    {
      label: bi('Kitchen sink leak', 'کچن سنک سے پانی لیک'),
      text: bi(
        'Kitchen sink P-trap pipe is leaking water under the cabinet.',
        'کچن سنک کے نیچے پائپ جوائنٹ سے پانی لیک ہو رہا ہے۔'
      ),
    },
    {
      label: bi('Wall seepage', 'دیوار میں سیم اور پینٹ خراب'),
      text: bi(
        'Bathroom adjacent bedroom wall has dampness and paint is peeling off.',
        'باتھ روم کے ساتھ والے کمرے کی دیوار میں سیم ہے اور پینٹ اکھڑ رہا ہے۔'
      ),
    },
  ];

  const urgencyColors: Record<string, string> = {
    EMERGENCY: 'border-red-300 bg-red-50 text-red-800',
    HIGH: 'border-orange-300 bg-orange-50 text-orange-800',
    MEDIUM: 'border-amber-300 bg-amber-50 text-amber-800',
    LOW: 'border-[#D8D0BE] bg-[#ECE6D7] text-[#176B4A]',
  };

  return (
    <PublicLayout>
      <PageTransition className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        <div className="rounded-3xl border border-[#D8D0BE] kc-hero-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#176B4A]">
              <Sparkles className="h-4 w-4" />
              {bi('AI Problem Finder', 'اے آئی پرابلم فائنڈر')}
            </span>
            <span className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900">
              {bi('AI estimate only — confirm final rate after inspection', 'صرف اے آئی اندازہ — حتمی نرخ معائنے کے بعد طے ہوں گے')}
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#17251E]">
            {bi('Describe Your Home Issue in English, Urdu, or Roman Urdu', 'گھر کا مسئلہ انگریزی، اردو یا رومن اردو میں بیان کریں')}
          </h1>
          <p className="mt-1.5 text-sm text-[#69726B]">
            {bi(
              'Not sure which trade you need? Tell us what went wrong or attach a photo. We will suggest the right service category, urgency level, rough PKR cost range, and matching verified Karigars.',
              'سمجھ نہیں آ رہا کس ماہر کو بلائیں؟ مسئلہ لکھیں یا تصویر لگائیں۔ ہم درست کیٹیگری، ہنگامی نوعیت، پاکستانی روپے میں اندازاً خرچ اور متعلقہ ہنرمند دکھائیں گے۔'
            )}
          </p>

          <form onSubmit={handleAnalyze} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-[#17251E]">
                  {bi('What needs fixing or servicing?', 'کس چیز کی مرمت یا سروس درکار ہے؟')}
                </label>
                <VoiceMicButton onTranscript={(spoken) => setDescription((prev) => `${prev} ${spoken}`.trim())} />
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={bi(
                  'e.g. Geyser pilot keeps going off, or AC thanda nahi kar raha...',
                  'مثلاً: گیزر کا پائلٹ بند ہو جاتا ہے، یا اے سی ٹھنڈا نہیں کر رہا...'
                )}
                className="w-full rounded-2xl border border-[#D8D0BE] bg-white px-4 py-3 text-sm text-[#17251E] focus:border-[#176B4A] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#69726B]">{bi('Examples:', 'مثالیں:')}</span>
              {quickExamples.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => setDescription(ex.text)}
                  className="rounded-lg border border-[#E6E0D2] bg-white px-2.5 py-1 font-medium text-[#17251E] hover:border-[#399B6B]"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <label className="inline-flex items-center gap-2 rounded-xl border border-[#E6E0D2] bg-white px-4 py-2.5 text-xs font-semibold text-[#17251E] cursor-pointer hover:bg-[#F7F4EC]">
                <Camera className="h-4 w-4 text-[#176B4A]" />
                <span>{imageFile ? imageFile.name : bi('Attach Optional Photo', 'مسئلے کی تصویر شامل کریں (اختیاری)')}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </label>

              <button
                type="submit"
                disabled={analyzing}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#176B4A] px-7 py-3 text-sm font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
              >
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>{analyzing ? bi('Analyzing Issue...', 'تجزیہ جاری ہے...') : bi('Find Trade & Cost Estimate', 'درست ماہر اور اندازہ دیکھیں')}</span>
              </button>
            </div>

            {previewUrl && (
              <div className="flex items-center gap-3 pt-2">
                <img src={previewUrl} alt="Problem preview" className="h-16 w-20 rounded-xl object-cover border border-[#E6E0D2]" />
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="text-xs font-semibold text-red-700 hover:underline"
                >
                  {bi('Remove photo', 'تصویر ہٹائیں')}
                </button>
              </div>
            )}
          </form>
        </div>

        {analysis && (
          <div className="rounded-3xl kc-glass-card p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E6E0D2] pb-4">
              <div>
                <p className="text-xs font-semibold text-[#399B6B]">
                  {isUr ? analysis.groupUrduName : analysis.groupName}
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#17251E]">
                  {bi('Suggested Category:', 'تجویز کردہ شعبہ:')}{' '}
                  <span className="text-[#176B4A]">
                    {isUr ? analysis.categoryUrduName : analysis.categoryName}
                  </span>
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-lg border px-3 py-1 text-xs font-bold ${urgencyColors[analysis.urgency]}`}>
                  {bi('Urgency:', 'نوعیت:')} {analysis.urgency}
                </span>
                <span className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900">
                  {bi('AI estimate only', 'صرف اے آئی اندازہ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#E6E0D2] bg-[#F7F4EC] p-4">
                <p className="text-xs font-bold uppercase text-[#69726B]">{bi('Likely Cause', 'ممکنہ وجہ')}</p>
                <p className="mt-1.5 text-sm text-[#17251E] leading-relaxed">
                  {isUr ? analysis.likelyCauseUrdu : analysis.likelyCause}
                </p>
              </div>
              <div className="rounded-2xl border border-[#D8D0BE] bg-[#ECE6D7]/40 p-4">
                <p className="text-xs font-bold uppercase text-[#176B4A]">
                  {bi('Rough Fair Price Range (AI estimate only)', 'اندازاً مناسب قیمت (صرف اے آئی اندازہ)')}
                </p>
                <p className="mt-1.5 font-mono text-2xl font-extrabold text-[#17251E] tabular-nums">
                  PKR {analysis.roughMinPkr.toLocaleString()} – {analysis.roughMaxPkr.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-[#69726B]">
                  {bi(
                    'Excludes major spare parts; compare worker quote against Fair Price Guide before hiring.',
                    'بڑے پرزہ جات شامل نہیں؛ بکنگ سے پہلے فیئر پرائس گائیڈ سے موازنہ کریں۔'
                  )}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3 text-sm text-amber-950">
              <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs uppercase">{bi('Safety Tip While Waiting', 'انتظار کے دوران حفاظتی ہدایت')}</p>
                <p className="mt-1 text-xs leading-relaxed">
                  {isUr ? analysis.safetyTipUrdu : analysis.safetyTip}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-xs text-[#69726B]">
                {analysis.source === 'gemini'
                  ? bi('Analyzed via Gemini Vision/Text Problem Finder (AI estimate only).', 'جیمینائی اے آئی سے تجزیہ کردہ (صرف اندازہ)۔')
                  : bi('Analyzed with built-in Urdu & English Fair Price Estimator (AI estimate only).', 'مقامی اردو/انگریزی پرائس ایسٹیمیٹر سے تجزیہ (صرف اندازہ)۔')}
              </p>
              <Link
                to={`/explore?trade=${encodeURIComponent(analysis.categorySlug)}`}
                className="inline-flex items-center gap-2 rounded-full bg-[#176B4A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#13563B]"
              >
                <Award className="h-4 w-4" />
                <span>
                  {bi(
                    `Find Verified ${analysis.categoryName}s`,
                    `تصدیق شدہ ${analysis.categoryUrduName} تلاش کریں`
                  )}
                </span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        )}
      </PageTransition>
    </PublicLayout>
  );
}
