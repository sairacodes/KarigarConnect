import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  Hammer,
  LayoutDashboard,
  Lock,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { PublicLayout } from '../../components/layouts/PublicLayout';
import { PageTransition } from '../../components/ui/MotionPrimitives';
import { getDashboardPathForRole, useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/translations';

interface RoleSelectionPageProps {
  defaultMode?: 'register' | 'login';
}

export function RoleSelectionPage({ defaultMode = 'register' }: RoleSelectionPageProps) {
  const { user } = useAuth();
  const { bi } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialMode =
    searchParams.get('mode') === 'login'
      ? 'login'
      : searchParams.get('mode') === 'register'
        ? 'register'
        : defaultMode;

  const [mode, setMode] = useState<'register' | 'login'>(initialMode);

  useEffect(() => {
    const paramMode = searchParams.get('mode');
    if (paramMode === 'login' || paramMode === 'register') {
      setMode(paramMode);
    } else {
      setMode(defaultMode);
    }
  }, [defaultMode, searchParams]);

  const karigarTarget = mode === 'login' ? '/login/karigar' : '/register/karigar';
  const hirerTarget = mode === 'login' ? '/login/hirer' : '/register/hirer';

  return (
    <PublicLayout>
      <PageTransition className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        {user && (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#73C99B]/60 bg-[#DDF3E4] px-5 py-4 text-sm">
            <div>
              <p className="font-bold text-[#11221B]">
                {bi(`Signed in as ${user.fullName}`, `آپ بطور ${user.fullName} سائن ان ہیں`)}
              </p>
              <p className="text-xs text-[#176B4A]">
                {bi('Continue straight to your active workspace or switch accounts below.', 'اپنے ڈیش بورڈ پر جائیں یا نیچے سے کردار منتخب کریں۔')}
              </p>
            </div>
            <Link
              to={getDashboardPathForRole(user.role)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#176B4A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#11221B] transition-colors shrink-0"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>{bi('Open Dashboard', 'ڈیش بورڈ کھولیں')}</span>
            </Link>
          </div>
        )}

        {/* Header & Mode Switcher */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center rounded-full bg-[#F2FBF6] p-1 border border-[#CFE9D8]">
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all ${
                mode === 'register'
                  ? 'bg-[#11221B] text-white shadow-xs'
                  : 'text-[#4D6357] hover:text-[#11221B]'
              }`}
            >
              {bi('Get Started (Sign Up)', 'نیا اکاؤنٹ (سائن اپ)')}
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all ${
                mode === 'login'
                  ? 'bg-[#11221B] text-white shadow-xs'
                  : 'text-[#4D6357] hover:text-[#11221B]'
              }`}
            >
              {bi('Login (Sign In)', 'لاگ ان (سائن ان)')}
            </button>
          </div>

          <h1 className="mt-6 text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#11221B] text-balance leading-tight">
            {mode === 'login'
              ? bi('Choose Your Portal to Sign In', 'سائن ان کے لیے اپنا پورٹل منتخب کریں')
              : bi('How Would You Like to Join?', 'آپ کس حیثیت سے شامل ہونا چاہتے ہیں؟')}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#4D6357] leading-relaxed">
            {mode === 'login'
              ? bi(
                  'Select whether you are signing in as a Karigar or as a Hirer to open your dedicated login page and dashboard.',
                  'اپنا متعلقہ لاگ ان صفحہ اور ڈیش بورڈ کھولنے کے لیے کاریگر یا ہائرر منتخب کریں۔'
                )
              : bi(
                  'Select your role below to enter your dedicated onboarding flow and personalized workspace.',
                  'اپنے مخصوص سائن اپ صفحے اور ڈیش بورڈ پر جانے کے لیے نیچے سے اپنا کردار منتخب کریں۔'
                )}
          </p>
        </div>

        {/* Clean Modern Two-Option White, Dark Green & Mint Board */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {/* Option 1: Join as a Karigar (Crisp White Surface + Dark Green & Mint Accents) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate(karigarTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(karigarTarget);
              }
            }}
            className="group cursor-pointer rounded-3xl bg-white border border-[#CFE9D8] p-7 sm:p-9 shadow-[0_18px_48px_-24px_rgba(17,34,27,0.16)] hover:border-[#176B4A] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between gap-7 focus:outline-none focus:ring-2 focus:ring-[#176B4A]"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DDF3E4] text-[#176B4A] group-hover:bg-[#176B4A] group-hover:text-white transition-colors">
                  <Hammer className="h-6 w-6" />
                </span>
                <span className="rounded-full bg-[#F2FBF6] border border-[#CFE9D8] px-3.5 py-1 text-xs font-bold text-[#176B4A]">
                  {bi('01 · Karigar Account', '۰۱ · کاریگر اکاؤنٹ')}
                </span>
              </div>

              <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-[#11221B]">
                {bi('Join as a Karigar', 'بطور کاریگر شامل ہوں')}
              </h2>
              <p className="mt-2.5 text-sm sm:text-base text-[#4D6357] leading-relaxed">
                {bi(
                  'I want to showcase my skills and find work opportunities.',
                  'میں اپنا ہنر پیش کرنا اور کام کے مواقع تلاش کرنا چاہتا ہوں۔'
                )}
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-[#E4F2EA] pt-5 text-xs sm:text-sm text-[#17251E]">
                <li className="flex items-center gap-2.5">
                  <Award className="h-4 w-4 text-[#176B4A] shrink-0" />
                  <span>{bi('Earn assessor-verified skill badges & Trust Score', 'ماہرین سے تصدیق شدہ مہارتی بیج اور ٹرسٹ اسکور')}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#176B4A] shrink-0" />
                  <span>{bi('Share QR Karigar Passport & receive job requests', 'کیو آر کاریگر پاسپورٹ شیئر کریں اور کام حاصل کریں')}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Lock className="h-4 w-4 text-[#176B4A] shrink-0" />
                  <span>{bi('Keep your phone number private until you accept', 'منظوری تک اپنا فون نمبر محفوظ اور پوشیدہ رکھیں')}</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#176B4A] px-6 py-3.5 text-sm font-bold text-white group-hover:bg-[#11221B] transition-colors shadow-xs">
                <span>
                  {mode === 'login'
                    ? bi('Continue to Karigar Login', 'کاریگر لاگ ان پر جائیں')
                    : bi('Join as a Karigar', 'بطور کاریگر سائن اپ کریں')}
                </span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:translate-x-0.5" />
              </div>
              <p
                className="text-center text-xs text-[#4D6357]"
                onClick={(e) => e.stopPropagation()}
              >
                {mode === 'login' ? (
                  <>
                    {bi('New Karigar?', 'نئے کاریگر ہیں؟')}{' '}
                    <Link to="/register/karigar" className="font-bold text-[#176B4A] hover:underline">
                      {bi('Create Karigar account', 'کاریگر اکاؤنٹ بنائیں')}
                    </Link>
                  </>
                ) : (
                  <>
                    {bi('Already have a Karigar account?', 'پہلے سے کاریگر اکاؤنٹ ہے؟')}{' '}
                    <Link to="/login/karigar" className="font-bold text-[#176B4A] hover:underline">
                      {bi('Sign in as Karigar', 'کاریگر لاگ ان کریں')}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Option 2: Join as a Hirer (Deep Forest Green Surface + Warm Beige & Mint Accents) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate(hirerTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(hirerTarget);
              }
            }}
            className="group cursor-pointer rounded-3xl kc-dark-surface text-white border border-[#1F3A2E] p-7 sm:p-9 shadow-[0_18px_48px_-24px_rgba(17,34,27,0.35)] hover:border-[#73C99B] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between gap-7 focus:outline-none focus:ring-2 focus:ring-[#73C99B]"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#399B6B]/25 text-[#B8E4C7] group-hover:bg-[#B8E4C7] group-hover:text-[#11221B] transition-colors">
                  <Briefcase className="h-6 w-6" />
                </span>
                <span className="rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-[#B8E4C7]">
                  {bi('02 · Hirer Account', '۰۲ · ہائرر / صارف اکاؤنٹ')}
                </span>
              </div>

              <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-white">
                {bi('Join as a Hirer', 'بطور ہائرر شامل ہوں')}
              </h2>
              <p className="mt-2.5 text-sm sm:text-base text-[#DDF3E4]/85 leading-relaxed">
                {bi(
                  'I want to discover and hire skilled Karigars.',
                  'میں ماہر کاریگروں کو تلاش کرنا اور کام پر رکھنا چاہتا ہوں۔'
                )}
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-white/12 pt-5 text-xs sm:text-sm text-[#DDF3E4]">
                <li className="flex items-center gap-2.5">
                  <Search className="h-4 w-4 text-[#73C99B] shrink-0" />
                  <span>{bi('Filter by verified badges, trade & city across Pakistan', 'تصدیق شدہ بیج، پیشے اور شہر کے لحاظ سے تلاش کریں')}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#73C99B] shrink-0" />
                  <span>{bi('Compare PKR Fair Price Guides before booking jobs', 'بکنگ سے پہلے مناسب نرخ نامے کا موازنہ کریں')}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#73C99B] shrink-0" />
                  <span>{bi('7-Day Karigar Guarantee & before/after work proof', '۷ دن کی گارنٹی اور مکمل کام کا تصویری ثبوت')}</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#DDF3E4] px-6 py-3.5 text-sm font-bold text-[#11221B] group-hover:bg-[#B8E4C7] transition-colors shadow-xs">
                <span>
                  {mode === 'login'
                    ? bi('Continue to Hirer Login', 'ہائرر لاگ ان پر جائیں')
                    : bi('Join as a Hirer', 'بطور ہائرر سائن اپ کریں')}
                </span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:translate-x-0.5" />
              </div>
              <p
                className="text-center text-xs text-[#B8E4C7]/85"
                onClick={(e) => e.stopPropagation()}
              >
                {mode === 'login' ? (
                  <>
                    {bi('New Hirer?', 'نئے ہائرر ہیں؟')}{' '}
                    <Link to="/register/hirer" className="font-bold text-white hover:underline">
                      {bi('Create Hirer account', 'ہائرر اکاؤنٹ بنائیں')}
                    </Link>
                  </>
                ) : (
                  <>
                    {bi('Already have a Hirer account?', 'پہلے سے ہائرر اکاؤنٹ ہے؟')}{' '}
                    <Link to="/login/hirer" className="font-bold text-white hover:underline">
                      {bi('Sign in as Hirer', 'ہائرر لاگ ان کریں')}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Discreet Secondary Portal Link for Assessors & Administrators */}
        <div className="mt-10 text-center text-xs text-[#4D6357]">
          {bi('Are you a Trade Assessor or Platform Administrator?', 'کیا آپ ٹریڈ ماہرِ جائزہ یا ایڈمنسٹریٹر ہیں؟')}{' '}
          <Link
            to={mode === 'login' ? '/login/staff' : '/register/assessor'}
            className="font-bold text-[#176B4A] hover:underline underline-offset-4"
          >
            {mode === 'login'
              ? bi('Sign in to Assessor / Admin portal →', 'ماہرِ جائزہ / ایڈمن لاگ ان →')
              : bi('Apply as a Trade Assessor →', 'بطور ماہرِ جائزہ درخواست دیں →')}
          </Link>
        </div>
      </PageTransition>
    </PublicLayout>
  );
}
