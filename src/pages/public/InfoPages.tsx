import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  GitBranch,
  Handshake,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  UploadCloud,
  UserPlus,
  Wrench,
} from 'lucide-react';
import { PublicLayout } from '../../components/layouts/PublicLayout';
import { ScrollReveal, StaggerGroup, StaggerItem } from '../../components/ui/MotionPrimitives';
import { useI18n } from '../../i18n/translations';
import { SUPPORT_EMAIL, hasWhatsApp, whatsappLink } from '../../config/site';

export function AboutPage() {
  const { bi } = useI18n();

  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <ScrollReveal>
          <p className="text-xs font-bold uppercase tracking-wider text-[#399B6B]">
            {bi('About KARIGAR CONNECT', 'کاریگر کنیکٹ کا تعارف')}
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#17251E]">
            {bi('Making Practical Skills Easier to Prove', 'عملی ہنر کو ثابت کرنا اب آسان')}
          </h1>
          <p className="mt-4 text-base text-[#69726B] leading-relaxed">
            {bi(
              'KARIGAR CONNECT bridges the trust gap between skilled tradespeople and employers. Instead of relying solely on paper resumes or word of mouth, workers organize practical photos and videos against trade competencies, request structured rubric reviews from approved assessors, and share verifiable portfolios.',
              'کاریگر کنیکٹ ہنرمند افراد اور آجروں کے درمیان اعتماد کا پل قائم کرتا ہے۔ محض کاغذی سی وی یا زبانی دعووں کے بجائے، ہنرمند اپنے عملی کام کی تصاویر اور ویڈیوز کو پیشہ ورانہ مہارتوں کے مطابق ترتیب دیتے ہیں، منظور شدہ ماہرین سے منظم جانچ کی درخواست کرتے ہیں اور قابلِ تصدیق پورٹ فولیو شیئر کرتے ہیں۔'
            )}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <div className="rounded-3xl kc-glass-card kc-hover-lift p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-[#17251E]">
              {bi('What a Verified Badge Means', 'تصدیق شدہ بیج کا کیا مطلب ہے؟')}
            </h2>
            <div className="space-y-3 text-sm text-[#69726B]">
              <p className="flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 text-[#176B4A] shrink-0 mt-0.5" />
                <span>
                  {bi(
                    'A verified badge confirms that an authorized, Admin-approved assessor reviewed submitted practical evidence against defined rubric criteria for that specific competency.',
                    'تصدیق شدہ بیج اس بات کی تصدیق کرتا ہے کہ ایڈمن کے منظور شدہ ماہر نے اس مخصوص مہارت کے طے شدہ معیارات کے تحت جمع کرائے گئے عملی ثبوت کا جائزہ لیا ہے۔'
                  )}
                </span>
              </p>
              <p className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-[#399B6B] shrink-0 mt-0.5" />
                <span>
                  {bi(
                    'It does not represent government accreditation, formal vocational board certification, or an automatic trade license.',
                    'یہ سرکاری منظوری، رسمی ووکیشنل بورڈ سرٹیفکیٹ، یا کسی خودکار تجارتی لائسنس کی نمائندگی نہیں کرتا۔'
                  )}
                </span>
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full bg-[#176B4A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#13563B] transition-colors"
          >
            <span>{bi('Create an Account', 'نیا اکاؤنٹ بنائیں')}</span>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <Link
            to="/explore"
            className="rounded-full border border-[#E6E0D2] kc-glass-card px-6 py-3 text-sm font-semibold text-[#17251E] hover:bg-[#ECE6D7]/50 transition-colors"
          >
            {bi('Explore Verified Workers', 'تصدیق شدہ ہنرمند دیکھیں')}
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}

interface ProcessStep {
  num: string;
  actor: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}

export function HowItWorksPage() {
  const { bi } = useI18n();

  const row1Steps: ProcessStep[] = [
    {
      num: '01',
      actor: bi('Worker', 'ہنرمند'),
      icon: UserPlus,
      title: bi('Create Profile & Privacy Controls', 'پروفائل اور پرائیویسی سیٹ اپ'),
      desc: bi(
        'Register your city, experience, bio, and set portfolio visibility. Contact details stay hidden by default.',
        'اپنا شہر، تجربہ اور تعارف درج کریں اور پورٹ فولیو کی رازداری منتخب کریں۔ رابطہ نمبر ابتدا میں پوشیدہ رہتا ہے۔'
      ),
    },
    {
      num: '02',
      actor: bi('Worker', 'ہنرمند'),
      icon: Wrench,
      title: bi('Select Trade & Skill Matrix', 'پیشہ اور مہارتوں کی فہرست'),
      desc: bi(
        'Choose Electrician, Carpenter, or Mechanic to unlock structured practical competencies and rubric criteria.',
        'الیکٹریشن، کارپینٹر یا مکینک منتخب کر کے ہر مہارت کے عملی معیارات اور چیک لسٹ دیکھیں۔'
      ),
    },
    {
      num: '03',
      actor: bi('Worker', 'ہنرمند'),
      icon: UploadCloud,
      title: bi('Upload Practical Evidence', 'عملی کام کا ثبوت اپ لوڈ کریں'),
      desc: bi(
        'Attach real work photos and short demonstration videos stored privately in browser IndexedDB.',
        'اصلی کام کی تصاویر اور مختصر ویڈیوز محفوظ پرائیویٹ اسٹوریج (IndexedDB) میں شامل کریں۔'
      ),
    },
  ];

  const row2Steps: ProcessStep[] = [
    {
      num: '04',
      actor: bi('Assessor', 'ماہرِ جائزہ'),
      icon: ClipboardCheck,
      title: bi('Submit & Rubric Review', 'تصدیق کی درخواست اور جانچ'),
      desc: bi(
        'Approved trade assessors review private evidence and score each criterion from 0–3, checking safety-critical rules.',
        'منظور شدہ ٹریڈ ماہرین ثبوت کا جائزہ لے کر ۰ تا ۳ اسکور دیتے ہیں اور حفاظتی نکات کی جانچ کرتے ہیں۔'
      ),
    },
    {
      num: '05',
      actor: bi('Platform Rubric', 'تصدیقی نظام'),
      icon: Award,
      title: bi('Earn Level 1–3 Badge', 'درجہ ۱ تا ۳ کا تصدیق شدہ بیج'),
      desc: bi(
        'Passing scores with zero safety failures earn a Basic, Competent, or Advanced badge valid for 12 months.',
        'حفاظتی کامیابی اور مطلوبہ فیصد پر ۱۲ ماہ کی معیاد والا بنیادی، ماہر یا اعلیٰ بیج جاری ہوتا ہے۔'
      ),
    },
    {
      num: '06',
      actor: bi('Employer + Worker', 'آجِر اور ہنرمند'),
      icon: Handshake,
      title: bi('Discover & Consent-First Hire', 'تلاش اور باہمی رضامندی سے رابطہ'),
      desc: bi(
        'Employers filter verified workers, shortlist talent, and send contact requests that workers choose to accept.',
        'آجِر تصدیق شدہ ہنرمند تلاش کر کے شارٹ لسٹ کرتے ہیں اور صرف ورکر کی منظوری پر رابطہ معلومات دیکھتے ہیں۔'
      ),
    },
  ];

  const renderProcessCard = (step: ProcessStep) => {
    const Icon = step.icon;
    return (
      <div className="h-full rounded-3xl kc-glass-card kc-hover-lift p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECE6D7] text-[#176B4A]">
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#399B6B]">{step.actor}</span>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#176B4A] font-mono text-xs font-bold text-white tabular-nums">
                {step.num}
              </span>
            </div>
          </div>
          <h2 className="mt-4 text-base font-bold text-[#17251E]">{step.title}</h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#69726B] leading-relaxed">{step.desc}</p>
        </div>
      </div>
    );
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        <ScrollReveal>
          <p className="text-xs font-bold uppercase tracking-wider text-[#399B6B]">
            {bi('Connected Verification Process Map', 'مربوط تصدیقی عمل کا نقشہ')}
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#17251E]">
            {bi('How KARIGAR CONNECT Works', 'کاریگر کنیکٹ کیسے کام کرتا ہے')}
          </h1>
          <p className="mt-3 max-w-3xl text-base text-[#69726B]">
            {bi(
              'Follow the end-to-end journey from skill registration to rubric evaluation and privacy-safe employer hiring.',
              'ہنرمند کے پروفائل سے لے کر عملی ثبوت، ماہرین کی جانچ اور آجروں سے بااعتماد رابطے تک کا مکمل مربوط سفر دیکھیں۔'
            )}
          </p>
        </ScrollReveal>

        {/* Visual Connected Process Map */}
        <ScrollReveal delay={0.05}>
          <div className="rounded-3xl border border-[#D8D0BE] bg-gradient-to-br from-[#F3EFE4]/85 via-white/90 to-[#F3EFE4]/85 backdrop-blur-md p-5 sm:p-8 kc-card-shadow">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E0D2] pb-4 mb-6">
              <div>
                <h2 className="text-lg font-extrabold text-[#17251E]">
                  {bi('End-to-End Verification Flow (Steps 01 → 06)', 'مکمل تصدیقی عمل (مرحلہ ۰۱ تا ۰۶)')}
                </h2>
                <p className="text-xs text-[#69726B]">
                  {bi(
                    'Each stage passes validated inputs directly to the next stage with full audit logging.',
                    'ہر مرحلہ مکمل جانچ اور محفوظ ریکارڈ کے ساتھ اگلے مرحلے سے جڑا ہوا ہے۔'
                  )}
                </p>
              </div>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B] transition-colors"
              >
                <span>{bi('Start Step 01', 'مرحلہ ۰۱ شروع کریں')}</span>
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </Link>
            </div>

            {/* Row 1: Steps 01 -> 02 -> 03 */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-3">
              {row1Steps.map((step, idx) => (
                <React.Fragment key={step.num}>
                  {renderProcessCard(step)}
                  {idx < row1Steps.length - 1 && (
                    <div className="flex items-center justify-center py-1 lg:py-0 lg:px-1">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8D0BE] bg-white text-[#176B4A] shadow-xs">
                        <ArrowRight className="hidden lg:block h-4 w-4 rtl:rotate-180" />
                        <ArrowDown className="lg:hidden h-4 w-4" />
                      </span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Connector from Step 03 down to Step 04 */}
            <div className="my-4 flex items-center justify-center lg:justify-end lg:pe-14">
              <div className="flex items-center gap-2.5 rounded-full border border-[#D8D0BE] bg-white/95 px-4 py-1.5 text-xs font-semibold text-[#176B4A] shadow-xs">
                <ArrowDown className="h-4 w-4 text-[#399B6B]" />
                <span>
                  {bi(
                    'Step 03 feeds private evidence into Assessor Verification Queue (Step 04)',
                    'مرحلہ ۰۳ کے ثبوت ماہرین کی تصدیقی قطار (مرحلہ ۰۴) میں شامل ہوتے ہیں'
                  )}
                </span>
              </div>
            </div>

            {/* Row 2: Steps 04 -> 05 -> 06 */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-3">
              {row2Steps.map((step, idx) => (
                <React.Fragment key={step.num}>
                  {renderProcessCard(step)}
                  {idx < row2Steps.length - 1 && (
                    <div className="flex items-center justify-center py-1 lg:py-0 lg:px-1">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8D0BE] bg-white text-[#176B4A] shadow-xs">
                        <ArrowRight className="hidden lg:block h-4 w-4 rtl:rotate-180" />
                        <ArrowDown className="lg:hidden h-4 w-4" />
                      </span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Rubric Decision Gate & Feedback Loop */}
            <div className="mt-8 rounded-2xl border border-[#D8D0BE] bg-white/80 backdrop-blur-sm p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#176B4A]">
                <GitBranch className="h-4 w-4 text-[#399B6B]" />
                <span>{bi('Step 04 Decision Gate & Feedback Loop', 'مرحلہ ۰۴ کا فیصلہ اور اصلاحی چکر')}</span>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                <div className="rounded-2xl border border-[#D8D0BE] bg-[#F3EFE4] p-4 kc-hover-lift">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#17251E]">
                    <FileCheck2 className="h-4 w-4 text-[#176B4A]" />
                    <span>{bi('Assessor Rubric Evaluation', 'ماہر کا معیاری جائزہ')}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#69726B]">
                    {bi(
                      'Each criterion is scored 0–3; weighted percentage is calculated automatically.',
                      'ہر معیار کو ۰ تا ۳ نمبر ملتے ہیں اور مجموعی فیصد خودکار طور پر حساب ہوتا ہے۔'
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#C9973A] bg-[#ECE6D7]/65 p-4 kc-hover-lift">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#176B4A]">
                    <span>{bi('Pass Branch (≥50% & Safe)', 'کامیابی (50% یا زائد اور محفوظ)')}</span>
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </div>
                  <p className="mt-1.5 text-xs text-[#17251E]/85">
                    {bi(
                      'Issues Level 1, 2, or 3 Verified Competency Badge on the worker’s public portfolio.',
                      'عوامی پورٹ فولیو پر درجہ ۱، ۲ یا ۳ کا تصدیق شدہ بیج شائع ہو جاتا ہے۔'
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/85 p-4 kc-hover-lift">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-amber-800">
                    <span>{bi('Revision Loop (<50% / Safety Fail)', 'تجدید چکر (کم اسکور / حفاظتی ناکامی)')}</span>
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <p className="mt-1.5 text-xs text-amber-900/80">
                    {bi(
                      'Assessor writes clear feedback; worker returns to Step 03 to upload stronger evidence and resubmit.',
                      'ماہر رہنمائی تحریر کرتا ہے اور ہنرمند مرحلہ ۰۳ پر جا کر بہتر ثبوت کے ساتھ دوبارہ جمع کراتا ہے۔'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Three Participant Summary Cards */}
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: bi('1. Skilled Workers', '۱۔ ہنرمند افراد'),
              body: bi(
                'Create your profile, pick your trade (Electrician, Carpenter, Mechanic), upload photos/video evidence to private storage, and request verification.',
                'اپنا پروفائل بنائیں، پیشہ منتخب کریں، تصاویر یا ویڈیو ثبوت پرائیویٹ اسٹوریج میں اپ لوڈ کریں اور تصدیق کی درخواست کریں۔'
              ),
            },
            {
              title: bi('2. Approved Assessors', '۲۔ منظور شدہ ماہرین'),
              body: bi(
                'Submit qualifications for Admin approval. Review assigned trade requests privately and score 0–3 rubric criteria with clear feedback.',
                'ایڈمن کی منظوری کے لیے درخواست دیں۔ اپنے پیشے کی درخواستوں کا جائزہ لیں اور ۰ تا ۳ اسکور کے ساتھ واضح رائے دیں۔'
              ),
            },
            {
              title: bi('3. Employers', '۳۔ آجِر حضرات'),
              body: bi(
                'Search by trade, city, experience, and verified competency level. Shortlist candidates and send consent-based contact requests.',
                'پیشے، شہر، تجربے اور تصدیقی درجے کے مطابق تلاش کریں۔ امیدواروں کو شارٹ لسٹ کریں اور اجازت پر مبنی رابطہ درخواست بھیجیں۔'
              ),
            },
          ].map((card) => (
            <StaggerItem key={card.title}>
              <div className="h-full rounded-3xl kc-glass-card kc-hover-lift p-6 space-y-3">
                <h2 className="text-lg font-bold text-[#17251E]">{card.title}</h2>
                <p className="text-sm text-[#69726B] leading-relaxed">{card.body}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        {/* Rubric Thresholds */}
        <ScrollReveal delay={0.08}>
          <div className="rounded-3xl kc-glass-card p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[#17251E]">
              {bi('Competency Rubric Thresholds', 'مہارت کی جانچ کے درجات')}
            </h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-2xl border border-[#E6E0D2] bg-[#F7F4EC] p-4 kc-hover-lift">
                <p className="font-bold text-[#17251E]">{bi('Level 1 — Basic', 'درجہ ۱ — بنیادی')}</p>
                <p className="mt-1 font-mono font-semibold text-[#399B6B]">50% – 69.9%</p>
                <p className="mt-1 text-[#69726B]">
                  {bi(
                    'Core task demonstrated with zero safety failures.',
                    'بنیادی کام حفاظتی اصولوں کی مکمل پابندی کے ساتھ انجام دیا گیا۔'
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-[#D8D0BE] bg-[#F3EFE4] p-4 kc-hover-lift">
                <p className="font-bold text-[#17251E]">{bi('Level 2 — Competent', 'درجہ ۲ — ماہر')}</p>
                <p className="mt-1 font-mono font-semibold text-[#176B4A]">70% – 84.9%</p>
                <p className="mt-1 text-[#69726B]">
                  {bi(
                    'Reliable, consistent workmanship across criteria.',
                    'تمام معیارات پر قابلِ اعتماد اور مستقل معیاری کاریگری۔'
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-[#C9973A] bg-[#ECE6D7]/70 p-4 kc-hover-lift">
                <p className="font-bold text-[#17251E]">{bi('Level 3 — Advanced', 'درجہ ۳ — اعلیٰ')}</p>
                <p className="mt-1 font-mono font-semibold text-[#176B4A]">85% – 100%</p>
                <p className="mt-1 text-[#17251E]/80">
                  {bi(
                    'Strong demonstration across technical & safety checks.',
                    'تکنیکی اور حفاظتی جانچ کے تمام مراحل میں بہترین کارکردگی۔'
                  )}
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </PublicLayout>
  );
}

export function LegalPage({ type }: { type: 'contact' | 'privacy' | 'terms' }) {
  const { bi } = useI18n();

  const content = {
    contact: {
      title: bi('Contact KARIGAR CONNECT', 'کاریگر کنیکٹ سے رابطہ کریں'),
      body: bi(
        `For pilot partnerships, assessor onboarding, or platform questions, email the KARIGAR CONNECT team at ${SUPPORT_EMAIL}. We are based in Islamabad, Pakistan.`,
        `پائلٹ شراکت، ماہرین کی شمولیت، یا پلیٹ فارم سے متعلق سوالات کے لیے کاریگر کنیکٹ ٹیم کو ${SUPPORT_EMAIL} پر ای میل کریں۔ ہم اسلام آباد، پاکستان میں ہیں۔`
      ),
    },
    privacy: {
      title: bi('Privacy Policy', 'رازداری کی پالیسی'),
      body: bi(
        'Workers control their public portfolio visibility and contact details. Phone numbers and email addresses are withheld from customers until the worker explicitly accepts a contact or job request. Uploaded photos and videos are saved privately inside this browser using IndexedDB and are never exposed on public portfolios. Note: browser storage is self-contained on this device and is not shared across separate browsers or devices.',
        'ہنرمند اپنے عوامی پورٹ فولیو اور رابطہ معلومات پر مکمل اختیار رکھتے ہیں۔ فون نمبر اور ای میل ایڈریس صارفین سے اس وقت تک پوشیدہ رہتے ہیں جب تک ہنرمند خود درخواست قبول نہ کرے۔ اپ لوڈ کی گئی تصاویر اور ویڈیوز براؤزر کی پرائیویٹ IndexedDB اسٹوریج میں محفوظ رہتی ہیں اور عوامی پورٹ فولیو پر ظاہر نہیں ہوتیں۔'
      ),
    },
    terms: {
      title: bi('Terms and Conditions', 'شرائط و ضوابط'),
      body: bi(
        'KARIGAR CONNECT provides competency-based evidence portfolios and rubric assessments by approved assessors. Verified badges expire after 12 months and do not constitute government certification, police background checks, or formal licensing. Fraudulent evidence, impersonation, or unsafe conduct may result in account suspension.',
        'کاریگر کنیکٹ منظور شدہ ماہرین کے ذریعے مہارت پر مبنی عملی ثبوت کے پورٹ فولیو اور معیاری جانچ فراہم کرتا ہے۔ تصدیق شدہ بیج ۱۲ ماہ بعد ختم ہو جاتے ہیں اور یہ سرکاری سند یا رسمی لائسنس نہیں ہیں۔ جعلی ثبوت، غلط شناخت، یا غیر محفوظ رویے پر اکاؤنٹ معطل کیا جا سکتا ہے۔'
      ),
    },
  }[type];

  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="rounded-3xl kc-glass-card kc-hover-lift p-8 space-y-5">
            <h1 className="text-2xl font-extrabold text-[#17251E]">{content.title}</h1>
            <div className="rounded-2xl kc-info-box p-5">
              <p className="text-sm sm:text-base text-[#17251E]/85 leading-relaxed">{content.body}</p>
            </div>
            {type === 'contact' && (
              <div className="flex flex-wrap gap-3">
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Karigar Connect enquiry')}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#11221B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#176B4A]"
                >
                  <span>{bi('Email the team', 'ٹیم کو ای میل کریں')}</span>
                </a>
                {hasWhatsApp && (<a
                  href={whatsappLink('Assalam-o-Alaikum KARIGAR CONNECT Support, I need assistance.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#176B4A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#13563B]"
                >
                  <MessageCircle className="h-4 w-4 text-[#D8D0BE]" />
                  <span>{bi('Message on WhatsApp Support', 'واٹس ایپ پر رابطہ کریں')}</span>
                </a>)}
                <Link
                  to="/#faq"
                  className="inline-flex items-center rounded-full border border-[#C9973A] bg-[#ECE6D7] px-5 py-2.5 text-sm font-semibold text-[#176B4A] hover:bg-[#E3DCC9]"
                >
                  {bi('View Bilingual FAQ', 'سوالات و جوابات دیکھیں')}
                </Link>
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </PublicLayout>
  );
}
