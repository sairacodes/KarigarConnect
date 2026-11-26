import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  EyeOff,
  Hammer,
} from 'lucide-react';
import { PublicLayout } from '../../components/layouts/PublicLayout';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { CityCombobox } from '../../components/ui/CityCombobox';
import { PageTransition } from '../../components/ui/MotionPrimitives';
import { getDashboardPathForRole, useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SERVICE_GROUPS } from '../../data/serviceCatalog';
import { api, getApiErrorMessage } from '../../services/api';
import { useI18n } from '../../i18n/translations';

export type RegisterPortalRole = 'WORKER' | 'EMPLOYER' | 'ASSESSOR';

interface RegisterPageProps {
  portalRole?: RegisterPortalRole;
}

export function RegisterPage({ portalRole = 'WORKER' }: RegisterPageProps) {
  const { register } = useAuth();
  const { showToast } = useToast();
  const { bi, isUr } = useI18n();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Islamabad');
  const [accountType, setAccountType] = useState<'INDIVIDUAL' | 'BUSINESS'>('INDIVIDUAL');
  const [companyName, setCompanyName] = useState('');
  const [selectedTradeId, setSelectedTradeId] = useState('');
  const [isFemaleProfessional, setIsFemaleProfessional] = useState(false);
  const [trades, setTrades] = useState<any[]>([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (portalRole === 'WORKER') {
      api.get('/public/trades').then((res) => setTrades(res.data.data || [])).catch(() => {});
    }
  }, [portalRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(bi('Passwords do not match.', 'پاس ورڈ آپس میں مطابقت نہیں رکھتے۔'));
      return;
    }
    if (!acceptedTerms) {
      setError(bi('Please accept the Terms and Privacy Policy to continue.', 'آگے بڑھنے کے لیے شرائط و رازداری کی پالیسی قبول کریں۔'));
      return;
    }

    setSubmitting(true);
    try {
      const createdUser = await register({
        fullName,
        email,
        phone,
        city,
        role: portalRole,
        password,
        confirmPassword,
        acceptedTerms,
        ...(portalRole === 'EMPLOYER' ? { accountType, companyName } : {}),
        ...(portalRole === 'WORKER' ? { selectedTradeId: selectedTradeId || undefined, isFemaleProfessional } : {}),
      });
      showToast(bi('Account created successfully.', 'اکاؤنٹ کامیابی سے بن گیا ہے۔'), 'success');
      navigate(getDashboardPathForRole(createdUser.role), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const roleShowcase = {
    WORKER: {
      icon: Hammer,
      kicker: bi('Karigar Sign Up', 'کاریگر سائن اپ'),
      title: bi('Join as a Karigar', 'بطور کاریگر شامل ہوں'),
      subtitle: bi(
        'I want to showcase my skills and find work opportunities.',
        'میں اپنا ہنر پیش کرنا اور کام کے مواقع تلاش کرنا چاہتا ہوں۔'
      ),
      formTitle: bi('Create Your Karigar Account', 'اپنا کاریگر اکاؤنٹ بنائیں'),
      formSub: bi(
        'Set up your skilled Karigar profile and enter your Karigar Dashboard.',
        'اپنا ہنرمندی پروفائل بنائیں اور کاریگر ڈیش بورڈ تک رسائی حاصل کریں۔'
      ),
      loginPath: '/login/karigar',
      loginPrompt: bi('Already have a Karigar account?', 'پہلے سے کاریگر اکاؤنٹ موجود ہے؟'),
      loginLabel: bi('Sign in as Karigar', 'کاریگر لاگ ان کریں'),
      bullets: [
        bi('48+ home, automotive & tech service categories', '۴۸ سے زائد سروس کیٹیگریز'),
        bi('Upload work proof & earn 12-month verified badges', 'کام کا ثبوت اپ لوڈ کریں اور ۱۲ ماہ کے بیجز حاصل کریں'),
        bi('Phone number stays hidden until you accept requests', 'درخواست قبول کرنے تک فون نمبر پوشیدہ رہتا ہے'),
      ],
    },
    EMPLOYER: {
      icon: Briefcase,
      kicker: bi('Hirer Sign Up', 'ہائرر سائن اپ'),
      title: bi('Join as a Hirer', 'بطور ہائرر شامل ہوں'),
      subtitle: bi(
        'I want to discover and hire skilled Karigars.',
        'میں ماہر کاریگروں کو تلاش کرنا اور کام پر رکھنا چاہتا ہوں۔'
      ),
      formTitle: bi('Create Your Hirer Account', 'اپنا ہائرر اکاؤنٹ بنائیں'),
      formSub: bi(
        'Create your Hirer account to discover verified Karigars and manage jobs from your Hirer Dashboard.',
        'مصدقہ کاریگروں کو تلاش کرنے اور کام بک کرنے کے لیے ہائرر اکاؤنٹ بنائیں۔'
      ),
      loginPath: '/login/hirer',
      loginPrompt: bi('Already have a Hirer account?', 'پہلے سے ہائرر اکاؤنٹ موجود ہے؟'),
      loginLabel: bi('Sign in as Hirer', 'ہائرر لاگ ان کریں'),
      bullets: [
        bi('Filter by trade, Pakistan city, or Female professional', 'پیشے، شہر یا خاتون پروفیشنل کے لحاظ سے تلاش'),
        bi('Compare PKR Fair Price Guides before booking', 'بکنگ سے پہلے PKR مناسب نرخ نامے کا موازنہ'),
        bi('Protected by 7-Day Karigar Guarantee & completion proof', '۷ دن کی کاریگر گارنٹی اور مکمل کام کا ثبوت'),
      ],
    },
    ASSESSOR: {
      icon: ClipboardCheck,
      kicker: bi('Trade Assessor Sign Up', 'ماہرِ جائزہ سائن اپ'),
      title: bi('Join as a Trade Assessor', 'بطور ماہرِ جائزہ شامل ہوں'),
      subtitle: bi(
        'Evaluate practical skill evidence with structured 0–3 rubrics and safety safeguards.',
        '۰ تا ۳ معیار اور حفاظتی اصولوں کے مطابق عملی مہارتوں کا جائزہ لیں۔'
      ),
      formTitle: bi('Create Your Assessor Account', 'ماہرِ جائزہ اکاؤنٹ بنائیں'),
      formSub: bi(
        'Register and complete your trade credentials application from your Assessor Dashboard.',
        'رجسٹریشن کے بعد ماہرِ جائزہ ڈیش بورڈ سے اپنی درخواست مکمل کریں۔'
      ),
      loginPath: '/login/staff',
      loginPrompt: bi('Already an Assessor?', 'پہلے سے ماہرِ جائزہ اکاؤنٹ ہے؟'),
      loginLabel: bi('Sign in to Assessor portal', 'ماہرِ جائزہ لاگ ان کریں'),
      bullets: [
        bi('Trade-scoped assessment queue & checklists', 'متعلقہ پیشے کی درخواستیں اور چیک لسٹ'),
        bi('Safety-critical zero safeguard enforcement', 'لازمی حفاظتی اصولوں کی خودکار پابندی'),
        bi('Issue 12-month competency badges with feedback', 'تعمیری رہنمائی کے ساتھ ۱۲ ماہ کے بیجز جاری کریں'),
      ],
    },
  }[portalRole];

  const RoleIcon = roleShowcase.icon;

  return (
    <PublicLayout>
      <PageTransition className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link
            to="/select-role?mode=register"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#176B4A] hover:text-[#11221B] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            <span>{bi('Back to Role Selection', 'کردار کے انتخاب پر واپس جائیں')}</span>
          </Link>

          <div className="flex items-center gap-3 text-xs font-semibold">
            {portalRole !== 'WORKER' && (
              <Link to="/register/karigar" className="text-[#4D6357] hover:text-[#176B4A] hover:underline">
                {bi('Join as Karigar →', 'بطور کاریگر شامل ہوں →')}
              </Link>
            )}
            {portalRole !== 'EMPLOYER' && (
              <Link to="/register/hirer" className="text-[#4D6357] hover:text-[#176B4A] hover:underline">
                {bi('Join as Hirer →', 'بطور ہائرر شامل ہوں →')}
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-3xl shadow-[0_24px_64px_-24px_rgba(17,34,27,0.22)] lg:grid-cols-12">
          {/* Left Role-Dedicated Dark Green Showcase Panel */}
          <div className="kc-dark-surface text-white p-8 sm:p-10 lg:col-span-5 flex flex-col justify-between gap-10">
            <div>
              <BrandLogo variant="dark" sizeClass="h-10" />

              <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#399B6B]/25 border border-[#73C99B]/40 px-3.5 py-1 text-xs font-bold text-[#B8E4C7]">
                <RoleIcon className="h-3.5 w-3.5" />
                <span>{roleShowcase.kicker}</span>
              </div>

              <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-balance leading-snug">
                {roleShowcase.title}
              </h2>
              <p className="mt-3 text-sm text-[#DDF3E4]/85 leading-relaxed">
                {roleShowcase.subtitle}
              </p>

              <ul className="mt-8 space-y-3">
                {roleShowcase.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#DDF3E4]">
                    <CheckCircle2 className="h-4 w-4 text-[#73C99B] shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-white/12 pt-5 text-[11px] text-[#B8E4C7]/75 leading-relaxed">
              {bi(
                'Verification badges reflect rubric-based assessment by approved assessors and do not represent government accreditation.',
                'تصدیق شدہ بیجز منظور شدہ ماہرین کی جانچ پر مبنی ہیں اور سرکاری سند یا لائسنس نہیں ہیں۔'
              )}
            </div>
          </div>

          {/* Right Crisp White Registration Form Panel */}
          <div className="bg-white p-7 sm:p-10 lg:col-span-7">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11221B]">
              {roleShowcase.formTitle}
            </h1>
            <p className="mt-1.5 text-sm text-[#4D6357]">{roleShowcase.formSub}</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              {portalRole === 'EMPLOYER' && (
                <div className="rounded-2xl border border-[#CFE9D8] bg-[#F5FBF7] p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#17251E] mb-1.5">
                      {bi('Hirer Account Type', 'ہائرر اکاؤنٹ کی نوعیت')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAccountType('INDIVIDUAL')}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                          accountType === 'INDIVIDUAL'
                            ? 'border-[#176B4A] bg-white text-[#176B4A]'
                            : 'border-[#CFE9D8] bg-[#E8F6EE]/70 text-[#4D6357]'
                        }`}
                      >
                        {bi('Homeowner / Individual', 'گھریلو صارف / فرد')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType('BUSINESS')}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                          accountType === 'BUSINESS'
                            ? 'border-[#176B4A] bg-white text-[#176B4A]'
                            : 'border-[#CFE9D8] bg-[#E8F6EE]/70 text-[#4D6357]'
                        }`}
                      >
                        {bi('Business / Facility', 'کاروبار / ادارہ')}
                      </button>
                    </div>
                  </div>
                  {accountType === 'BUSINESS' && (
                    <div>
                      <label className="block text-xs font-semibold text-[#17251E] mb-1">
                        {bi('Company / Organization Name (optional)', 'کمپنی یا ادارے کا نام (اختیاری)')}
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder={bi('e.g. Margalla Facility Services', 'مثلاً مارگلہ فیسیلٹی سروسز')}
                        className="w-full rounded-xl border border-[#CFE9D8] bg-white px-3 py-2 text-sm text-[#17251E] focus:border-[#176B4A] focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {portalRole === 'WORKER' && (
                <div className="rounded-2xl border border-[#CFE9D8] bg-[#F5FBF7] p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#17251E] mb-1">
                      {bi('Primary Service Category (optional now)', 'بنیادی سروس کیٹیگری (ابھی یا بعد میں منتخب کریں)')}
                    </label>
                    <select
                      value={selectedTradeId}
                      onChange={(e) => setSelectedTradeId(e.target.value)}
                      className="w-full rounded-xl border border-[#CFE9D8] bg-white px-3 py-2 text-sm text-[#17251E] focus:border-[#176B4A] focus:outline-none"
                    >
                      <option value="">{bi('Choose later from Karigar Dashboard...', 'بعد میں منتخب کریں...')}</option>
                      {SERVICE_GROUPS.map((grp) => {
                        const items = trades.filter((t) => (t.group || '') === grp.group);
                        if (items.length === 0) return null;
                        return (
                          <optgroup key={grp.group} label={isUr ? grp.urduGroup : grp.group}>
                            {items.map((t) => (
                              <option key={t.id} value={t.id}>
                                {isUr && t.urduName ? t.urduName : t.name}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#176B4A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFemaleProfessional}
                      onChange={(e) => setIsFemaleProfessional(e.target.checked)}
                      className="h-4 w-4 rounded border-[#B8E4C7] accent-[#176B4A]"
                    />
                    <span>{bi('I am a Female professional (Women-Safe badge)', 'میں خاتون پروفیشنل ہوں (ویمن سیف بیج)')}</span>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#17251E] mb-1">
                    {bi('Full Name', 'مکمل نام')}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder={bi('e.g. Bilal Ahmed', 'مثلاً بلال احمد')}
                    className="w-full rounded-xl border border-[#CFE9D8] bg-[#F5FBF7] px-3 py-2.5 text-sm text-[#17251E] focus:border-[#176B4A] focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#17251E] mb-1">
                    {bi('City in Pakistan', 'پاکستان کا شہر')}
                  </label>
                  <CityCombobox value={city} onChange={setCity} required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#17251E] mb-1">
                    {bi('Email Address', 'ای میل ایڈریس')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-[#CFE9D8] bg-[#F5FBF7] px-3 py-2.5 text-sm text-[#17251E] focus:border-[#176B4A] focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#17251E] mb-1">
                    {bi('Phone Number', 'فون نمبر')}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+92-300-1234567"
                    className="w-full rounded-xl border border-[#CFE9D8] bg-[#F5FBF7] px-3 py-2.5 text-sm text-[#17251E] focus:border-[#176B4A] focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#17251E] mb-1">
                    {bi('Password', 'پاس ورڈ')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder={bi('8+ chars, 1 uppercase, 1 number', 'کم از کم ۸ حروف، ۱ بڑا حرف، ۱ نمبر')}
                      className="w-full rounded-xl border border-[#CFE9D8] bg-[#F5FBF7] ps-3 pe-9 py-2.5 text-sm text-[#17251E] focus:border-[#176B4A] focus:bg-white focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute end-2.5 top-2.5 text-[#5B6D63] hover:text-[#17251E]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#17251E] mb-1">
                    {bi('Confirm Password', 'پاس ورڈ کی تصدیق')}
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#CFE9D8] bg-[#F5FBF7] px-3 py-2.5 text-sm text-[#17251E] focus:border-[#176B4A] focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-[#4D6357] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#B8E4C7] accent-[#176B4A]"
                />
                <span>
                  {bi('I agree to the', 'میں اتفاق کرتا/کرتی ہوں')}{' '}
                  <Link to="/terms" className="font-semibold text-[#11221B] underline">
                    {bi('Terms & Conditions', 'شرائط و ضوابط')}
                  </Link>{' '}
                  {bi('and', 'اور')}{' '}
                  <Link to="/privacy" className="font-semibold text-[#11221B] underline">
                    {bi('Privacy Policy', 'رازداری کی پالیسی')}
                  </Link>
                  {bi(
                    ', and understand verified badges are rubric-based assessments rather than government accreditation.',
                    ' سے، اور سمجھتا/سمجھتی ہوں کہ تصدیق شدہ بیج معیاری جانچ پر مبنی ہیں اور سرکاری سند نہیں ہیں۔'
                  )}
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#176B4A] px-5 py-3 text-sm font-bold text-white hover:bg-[#11221B] transition-colors disabled:opacity-60 shadow-xs"
              >
                <span>
                  {submitting
                    ? bi('Creating Account...', 'اکاؤنٹ بن رہا ہے...')
                    : portalRole === 'WORKER'
                      ? bi('Create Karigar Account', 'کاریگر اکاؤنٹ بنائیں')
                      : portalRole === 'EMPLOYER'
                        ? bi('Create Hirer Account', 'ہائرر اکاؤنٹ بنائیں')
                        : bi('Create Assessor Account', 'ماہرِ جائزہ اکاؤنٹ بنائیں')}
                </span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </button>

              <p className="text-center text-sm text-[#4D6357]">
                {roleShowcase.loginPrompt}{' '}
                <Link to={roleShowcase.loginPath} className="font-bold text-[#176B4A] hover:underline">
                  {roleShowcase.loginLabel}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </PageTransition>
    </PublicLayout>
  );
}
