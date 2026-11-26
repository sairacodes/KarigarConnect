import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  EyeOff,
  Hammer,
  Lock,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { PublicLayout } from '../../components/layouts/PublicLayout';
import { PageTransition } from '../../components/ui/MotionPrimitives';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { getDashboardPathForRole, useAuth, UserRole } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api, getApiErrorMessage } from '../../services/api';
import { useI18n } from '../../i18n/translations';

export type LoginPortalRole = 'WORKER' | 'EMPLOYER' | 'STAFF';

interface LoginPageProps {
  portalRole?: LoginPortalRole;
}

export function LoginPage({ portalRole = 'WORKER' }: LoginPageProps) {
  const { login } = useAuth();
  const { showToast } = useToast();
  const { bi } = useI18n();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNotice, setResetNotice] = useState('');

  const allowedRoles: UserRole[] =
    portalRole === 'WORKER'
      ? ['WORKER']
      : portalRole === 'EMPLOYER'
        ? ['EMPLOYER']
        : ['ASSESSOR', 'ADMIN'];

  const portalMeta = {
    WORKER: {
      icon: Hammer,
      badge: bi('Karigar Login Portal', 'کاریگر لاگ ان پورٹل'),
      headline: bi('Showcase Your Skills & Find Work.', 'اپنا ہنر دکھائیں اور روزگار کے مواقع پائیں۔'),
      subcopy: bi(
        'Sign in to manage your verified skill badges, practical portfolio, QR Karigar Passport, and customer job requests.',
        'اپنے تصدیق شدہ بیجز، عملی پورٹ فولیو، کیو آر پاسپورٹ اور کام کی درخواستوں کا انتظام کرنے کے لیے سائن ان کریں۔'
      ),
      formTitle: bi('Karigar Sign In', 'کاریگر سائن ان'),
      formSub: bi(
        'Enter your Karigar account credentials to open your Karigar Dashboard.',
        'اپنا کاریگر ڈیش بورڈ کھولنے کے لیے اکاؤنٹ کی تفصیلات درج کریں۔'
      ),
      registerPath: '/register/karigar',
      registerPrompt: bi('New Karigar?', 'نئے کاریگر ہیں؟'),
      registerLinkLabel: bi('Join as a Karigar', 'بطور کاریگر شامل ہوں'),
      highlights: [
        { icon: Award, text: bi('Upload work evidence & earn 12-month badges', 'عملی ثبوت اپ لوڈ کریں اور ۱۲ ماہ کے بیج حاصل کریں') },
        { icon: Lock, text: bi('Your phone remains hidden until you accept a job', 'کام قبول کرنے تک آپ کا فون نمبر پوشیدہ رہتا ہے') },
        { icon: CheckCircle2, text: bi('Track PKR earnings & Trust Score progression', 'اپنی آمدنی اور ٹرسٹ اسکور کی پیش رفت دیکھیں') },
      ],
      demoAccounts: [
        { label: bi('Bilal · Electrician (Islamabad)', 'بلال · الیکٹریشن (اسلام آباد)'), email: 'bilal.worker@karigarconnect.pk' },
        { label: bi('Zainab · Female Pro (Multan)', 'زینب · خاتون ماہر (ملتان)'), email: 'zainab.beauty@karigarconnect.pk' },
      ],
    },
    EMPLOYER: {
      icon: Briefcase,
      badge: bi('Hirer Login Portal', 'ہائرر لاگ ان پورٹل'),
      headline: bi('Discover & Hire Proven Karigars.', 'مصدقہ اور ماہر کاریگروں کو تلاش کریں۔'),
      subcopy: bi(
        'Sign in to browse verified portfolios, compare PKR Fair Price Guides, manage shortlists, and track active bookings.',
        'مصدقہ پورٹ فولیوز دیکھنے، مناسب نرخ نامے کا موازنہ کرنے اور اپنی بکنگز دیکھنے کے لیے سائن ان کریں۔'
      ),
      formTitle: bi('Hirer Sign In', 'ہائرر / صارف سائن ان'),
      formSub: bi(
        'Enter your Hirer account credentials to open your Hirer Dashboard.',
        'اپنا ہائرر ڈیش بورڈ کھولنے کے لیے اکاؤنٹ کی تفصیلات درج کریں۔'
      ),
      registerPath: '/register/hirer',
      registerPrompt: bi('New Hirer?', 'نئے ہائرر / صارف ہیں؟'),
      registerLinkLabel: bi('Join as a Hirer', 'بطور ہائرر شامل ہوں'),
      highlights: [
        { icon: Search, text: bi('Filter by assessor-scored badges, trade & city', 'ماہرین کے بیج، پیشے اور شہر کے لحاظ سے تلاش کریں') },
        { icon: ShieldCheck, text: bi('Compare PKR Fair Price Guides before booking', 'بکنگ سے پہلے PKR مناسب نرخ نامہ دیکھیں') },
        { icon: CheckCircle2, text: bi('7-Day Karigar Guarantee & confirmed completion proof', '۷ دن کی کاریگر گارنٹی اور تصدیق شدہ تصویری ثبوت') },
      ],
      demoAccounts: [
        { label: bi('Ahmed · Homeowner (Karachi)', 'احمد · گھریلو صارف (کراچی)'), email: 'ahmed.customer@karigarconnect.pk' },
        { label: bi('Sana · Business Hirer (Islamabad)', 'ثناء · کاروباری ہائرر (اسلام آباد)'), email: 'sana.employer@karigarconnect.pk' },
      ],
    },
    STAFF: {
      icon: ClipboardCheck,
      badge: bi('Assessor & Admin Portal', 'ماہرِ جائزہ اور ایڈمن پورٹل'),
      headline: bi('Structured Rubric Verification.', 'منظم معیار پر مبنی تصدیق۔'),
      subcopy: bi(
        'Sign in to review verification evidence queues, score 0–3 criteria, or manage platform governance.',
        'تصدیقی درخواستوں کا جائزہ لینے اور پلیٹ فارم کا انتظام کرنے کے لیے سائن ان کریں۔'
      ),
      formTitle: bi('Assessor / Admin Sign In', 'ماہرِ جائزہ / ایڈمن سائن ان'),
      formSub: bi(
        'Enter your approved Assessor or Administrator credentials.',
        'اپنے منظور شدہ ماہرِ جائزہ یا ایڈمن اکاؤنٹ کی تفصیلات درج کریں۔'
      ),
      registerPath: '/register/assessor',
      registerPrompt: bi('Trade expert?', 'ماہر ہیں؟'),
      registerLinkLabel: bi('Apply as Assessor', 'بطور ماہر درخواست دیں'),
      highlights: [
        { icon: ClipboardCheck, text: bi('Trade-scoped rubric assessment queue (0–3)', 'پیشے کے مطابق ۰ تا ۳ معیار کی جانچ') },
        { icon: ShieldCheck, text: bi('Safety-critical safeguards & 12-month badge issuance', 'حفاظتی اصولوں کی پابندی اور ۱۲ ماہ کے بیجز') },
        { icon: CheckCircle2, text: bi('Audit logs, categories & dispute resolution', 'آڈٹ ریکارڈ اور تنازعات کا حل') },
      ],
      demoAccounts: [
        { label: bi('Tariq · Assessor (Rawalpindi)', 'طارق · ماہرِ جائزہ (راولپنڈی)'), email: 'tariq.assessor@karigarconnect.pk' },
        { label: bi('Platform Admin', 'ایڈمن'), email: 'admin@karigarconnect.pk' },
      ],
    },
  }[portalRole];

  const PortalIcon = portalMeta.icon;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError(bi('Please enter both your email address and password.', 'براہِ کرم ای میل اور پاس ورڈ دونوں درج کریں۔'));
      return;
    }
    setSubmitting(true);
    try {
      const loggedUser = await login(email.trim(), password, allowedRoles);
      showToast(bi(`Welcome back, ${loggedUser.fullName}`, `خوش آمدید، ${loggedUser.fullName}`), 'success');
      navigate(getDashboardPathForRole(loggedUser.role), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, bi('Invalid email or password.', 'غلط ای میل یا پاس ورڈ۔')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetNotice('');
    try {
      const res = await api.post('/auth/forgot-password', { email: resetEmail });
      setResetNotice(res.data.message);
    } catch (err) {
      setResetNotice(getApiErrorMessage(err));
    }
  };

  return (
    <PublicLayout>
      <PageTransition className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link
            to="/select-role?mode=login"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#176B4A] hover:text-[#11221B] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            <span>{bi('Back to Role Selection', 'کردار کے انتخاب پر واپس جائیں')}</span>
          </Link>

          <div className="flex items-center gap-3 text-xs font-semibold">
            {portalRole !== 'WORKER' && (
              <Link to="/login/karigar" className="text-[#4D6357] hover:text-[#176B4A] hover:underline">
                {bi('Karigar Login →', 'کاریگر لاگ ان →')}
              </Link>
            )}
            {portalRole !== 'EMPLOYER' && (
              <Link to="/login/hirer" className="text-[#4D6357] hover:text-[#176B4A] hover:underline">
                {bi('Hirer Login →', 'ہائرر لاگ ان →')}
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-3xl shadow-[0_24px_64px_-24px_rgba(17,34,27,0.22)] lg:grid-cols-12">
          {/* Left Dark Green Role Showcase Panel */}
          <div className="kc-dark-surface text-white p-8 sm:p-10 lg:col-span-5 flex flex-col justify-between gap-10">
            <div>
              <BrandLogo variant="dark" sizeClass="h-10" />
              <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#399B6B]/25 border border-[#73C99B]/40 px-3.5 py-1 text-xs font-bold text-[#B8E4C7]">
                <PortalIcon className="h-3.5 w-3.5" />
                <span>{portalMeta.badge}</span>
              </div>

              <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-balance leading-snug">
                {portalMeta.headline}
              </h2>
              <p className="mt-3 text-sm text-[#DDF3E4]/85 leading-relaxed">
                {portalMeta.subcopy}
              </p>

              <ul className="mt-8 space-y-3.5">
                {portalMeta.highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.text} className="flex items-start gap-3 text-xs sm:text-sm text-[#DDF3E4]">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#399B6B]/30 text-[#B8E4C7] shrink-0">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="pt-0.5">{item.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-white/12 pt-5 text-xs text-[#B8E4C7]/80">
              {bi(
                'Each role has its own secure login and dedicated dashboard.',
                'ہر کردار کا اپنا علیحدہ محفوظ لاگ ان اور مخصوص ڈیش بورڈ ہے۔'
              )}
            </div>
          </div>

          {/* Right Crisp White Form Panel */}
          <div className="bg-white p-7 sm:p-10 lg:col-span-7 lg:p-12">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11221B]">
              {forgotMode ? bi('Reset Password', 'پاس ورڈ ری سیٹ کریں') : portalMeta.formTitle}
            </h1>
            <p className="mt-1.5 text-sm text-[#4D6357]">
              {forgotMode
                ? bi(
                    'Submit a password recovery request for administrator verification.',
                    'ایڈمن کی تصدیق کے لیے پاس ورڈ بحالی کی درخواست جمع کرائیں۔'
                  )
                : portalMeta.formSub}
            </p>

            {!forgotMode ? (
              <>
                <form onSubmit={handleLogin} className="mt-7 space-y-5">
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 space-y-1.5">
                      <p>{error}</p>
                      {error.toLowerCase().includes('hirer') && portalRole !== 'EMPLOYER' && (
                        <Link to="/login/hirer" className="inline-block font-bold underline">
                          {bi('Go to Hirer Login →', 'ہائرر لاگ ان پر جائیں →')}
                        </Link>
                      )}
                      {error.toLowerCase().includes('karigar') && portalRole !== 'WORKER' && (
                        <Link to="/login/karigar" className="inline-block font-bold underline">
                          {bi('Go to Karigar Login →', 'کاریگر لاگ ان پر جائیں →')}
                        </Link>
                      )}
                      {error.toLowerCase().includes('assessor') && portalRole !== 'STAFF' && (
                        <Link to="/login/staff" className="inline-block font-bold underline">
                          {bi('Go to Assessor / Admin Login →', 'ماہرِ جائزہ / ایڈمن لاگ ان پر جائیں →')}
                        </Link>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-[#17251E] mb-1.5">
                      {bi('Email Address', 'ای میل ایڈریس')}
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full rounded-xl border border-[#CFE9D8] bg-[#F5FBF7] px-3.5 py-2.5 text-sm text-[#17251E] focus:border-[#176B4A] focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-semibold text-[#17251E]">
                        {bi('Password', 'پاس ورڈ')}
                      </label>
                      <button
                        type="button"
                        onClick={() => setForgotMode(true)}
                        className="text-xs font-semibold text-[#176B4A] hover:underline"
                      >
                        {bi('Forgot password?', 'پاس ورڈ بھول گئے؟')}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full rounded-xl border border-[#CFE9D8] bg-[#F5FBF7] ps-3.5 pe-10 py-2.5 text-sm text-[#17251E] focus:border-[#176B4A] focus:bg-white focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? bi('Hide password', 'پاس ورڈ چھپائیں') : bi('Show password', 'پاس ورڈ دکھائیں')}
                        className="absolute end-3 top-2.5 text-[#5B6D63] hover:text-[#17251E]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#176B4A] px-5 py-3 text-sm font-bold text-white hover:bg-[#11221B] transition-colors disabled:opacity-60 shadow-xs"
                  >
                    <span>
                      {submitting
                        ? bi('Signing In...', 'سائن ان ہو رہا ہے...')
                        : portalRole === 'WORKER'
                          ? bi('Sign In as Karigar', 'بطور کاریگر سائن ان کریں')
                          : portalRole === 'EMPLOYER'
                            ? bi('Sign In as Hirer', 'بطور ہائرر سائن ان کریں')
                            : bi('Sign In', 'سائن ان کریں')}
                    </span>
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </button>

                  <p className="text-center text-sm text-[#4D6357] pt-1">
                    {portalMeta.registerPrompt}{' '}
                    <Link to={portalMeta.registerPath} className="font-bold text-[#176B4A] hover:underline">
                      {portalMeta.registerLinkLabel}
                    </Link>
                  </p>
                </form>

                <div className="mt-8 border-t border-[#E4F2EA] pt-5">
                  <p className="text-xs font-bold text-[#11221B] mb-2.5">
                    {bi('Quick-fill demo accounts for this role (Pass: KarigarDemo@2026):', 'اس کردار کے نمونہ اکاؤنٹس (پاس ورڈ: KarigarDemo@2026):')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {portalMeta.demoAccounts.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => {
                          setEmail(acc.email);
                          setPassword('KarigarDemo@2026');
                          setError('');
                        }}
                        className="rounded-xl border border-[#CFE9D8] bg-[#F5FBF7] px-3 py-2 text-start text-xs font-medium text-[#17251E] hover:border-[#176B4A] hover:bg-[#DDF3E4]/65 transition-colors truncate"
                      >
                        {acc.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleForgotSubmit} className="mt-7 space-y-5">
                {resetNotice && (
                  <div className="rounded-xl border border-[#73C99B] bg-[#DDF3E4]/65 px-3.5 py-2.5 text-sm text-[#176B4A]">
                    {resetNotice}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-[#17251E] mb-1.5">
                    {bi('Registered Email', 'رجسٹرڈ ای میل')}
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#CFE9D8] bg-[#F5FBF7] px-3.5 py-2.5 text-sm text-[#17251E] focus:border-[#176B4A] focus:bg-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-[#176B4A] px-5 py-3 text-sm font-bold text-white hover:bg-[#11221B] transition-colors"
                >
                  {bi('Submit Request', 'درخواست جمع کرائیں')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(false);
                    setResetNotice('');
                  }}
                  className="w-full text-sm font-semibold text-[#4D6357] hover:text-[#11221B]"
                >
                  {bi('← Back to Login', '→ لاگ ان پر واپس جائیں')}
                </button>
              </form>
            )}
          </div>
        </div>
      </PageTransition>
    </PublicLayout>
  );
}
