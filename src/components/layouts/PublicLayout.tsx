import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Languages,
  Menu,
  MessageCircle,
  X,
} from 'lucide-react';
import { getDashboardPathForRole, useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/translations';
import { BrandLogo } from '../ui/BrandLogo';

import { hasWhatsApp, whatsappLink } from '../../config/site';

const WHATSAPP_WA_URL = whatsappLink('Assalam-o-Alaikum KARIGAR CONNECT Support, I need help with:');

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { lang, toggleLang, bi } = useI18n();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/', label: bi('Home', 'ہوم') },
    { to: '/explore', label: bi('Explore', 'ہنرمند دیکھیں') },
    { to: '/demand-insights', label: bi('Skill Insights', 'اسکل ڈیمانڈ') },
    { to: '/verify-badge', label: bi('Verify Badge', 'بیج تصدیق') },
    ...(user ? [] : [{ to: '/login', label: bi('Login', 'لاگ ان') }]),
  ];

  const handlePrimaryCta = () => {
    setMobileOpen(false);
    if (user) {
      navigate(getDashboardPathForRole(user.role));
    } else {
      navigate('/register');
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-white text-[#17251E]">
      <header className="sticky top-0 z-40 bg-[#F7F4EC]/90 backdrop-blur-md text-[#11221B] border-b border-[#E2DBCB]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center shrink-0 focus:outline-none">
            <BrandLogo sizeClass="h-10 sm:h-11" />
          </Link>

          <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-xs lg:text-sm font-medium text-[#4D6357]">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-[#11221B] ${
                    isActive
                      ? 'text-[#11221B] font-semibold underline decoration-[#C9973A] decoration-2 underline-offset-8'
                      : ''
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleLang}
              aria-label={bi('Switch to Urdu', 'انگریزی میں تبدیل کریں')}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E2DBCB] px-3 py-1.5 text-xs font-semibold text-[#11221B] hover:border-[#176B4A] transition-colors whitespace-nowrap shrink-0"
            >
              <Languages className="h-3.5 w-3.5 text-[#C9973A]" />
              <span>{lang === 'en' ? 'اردو' : 'English'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrimaryCta}
              className="hidden sm:inline-flex items-center justify-center gap-2 rounded-full bg-[#11221B] px-5 py-2 text-sm font-semibold text-[#F7F4EC] hover:bg-[#176B4A] transition-colors whitespace-nowrap shrink-0"
            >
              <span>{user ? bi('Open Dashboard', 'ڈیش بورڈ کھولیں') : bi('Get Started', 'شروع کریں')}</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={bi('Toggle navigation menu', 'نیویگیشن مینو کھولیں')}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2DBCB] text-[#11221B] hover:border-[#176B4A]"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-[#E2DBCB] bg-[#F7F4EC] px-4 py-4 space-y-1.5">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#ECE6D7] text-[#11221B] font-semibold'
                      : 'text-[#4D6357] hover:bg-[#ECE6D7] hover:text-[#11221B]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="mt-2 w-full rounded-full bg-[#11221B] px-4 py-3 text-center text-sm font-semibold text-[#F7F4EC] hover:bg-[#176B4A]"
            >
              {user ? bi('Open Dashboard', 'ڈیش بورڈ کھولیں') : bi('Get Started', 'شروع کریں')}
            </button>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>


      <footer className="kc-dark-surface text-white border-t border-[#1F3A2E]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-5">
              <BrandLogo variant="dark" sizeClass="h-11" />
              <p className="mt-4 text-sm text-[#D8D0BE] max-w-sm leading-relaxed">
                {bi(
                  'Make practical skills easier to prove. Built to connect skilled tradespeople with trusted customers through rubric-assessed evidence.',
                  'عملی مہارتوں کا ثبوت پیش کرنا آسان بنائیں۔ ہنرمند افراد کو مستند ثبوت کے ذریعے قابلِ اعتماد صارفین سے جوڑنے کا پلیٹ فارم۔'
                )}
              </p>
              <p className="mt-3 text-xs text-[#D8D0BE]/75 max-w-md leading-relaxed">
                {bi(
                  'Verification badges reflect rubric-based evidence review by approved assessors and do not represent government accreditation.',
                  'تصدیقی بیجز منظور شدہ ماہرین کی جانچ کی عکاسی کرتے ہیں اور یہ سرکاری سند یا لائسنس نہیں ہیں۔'
                )}
              </p>
            </div>

            <div className="md:col-span-4 grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-2.5">
                <p className="font-semibold text-white">{bi('Platform', 'پلیٹ فارم')}</p>
                <Link to="/why-karigar-connect" className="block text-[#D8D0BE]/85 hover:text-white transition-colors">
                  {bi('Why It Matters', 'اہمیت اور اعتماد')}
                </Link>
                <Link to="/how-it-works" className="block text-[#D8D0BE]/85 hover:text-white transition-colors">
                  {bi('Full Visual Process Map', 'مکمل طریقہ کار کا نقشہ')}
                </Link>
                <Link to="/trust-score" className="block text-[#D8D0BE]/85 hover:text-white transition-colors">
                  {bi('How Trust Score Works', 'اعتماد اسکور کیسے بنتا ہے')}
                </Link>
                <Link to="/verify-badge" className="block text-[#D8D0BE]/85 hover:text-white transition-colors">
                  {bi('Verify a Badge / Passport', 'بیج یا پاسپورٹ تصدیق')}
                </Link>
                <Link to="/demand-insights" className="block text-[#D8D0BE]/85 hover:text-white transition-colors">
                  {bi('Skill Demand Insights', 'اسکل ڈیمانڈ بصیرت')}
                </Link>
              </div>
              <div className="space-y-2.5">
                <p className="font-semibold text-white">{bi('Company & Legal', 'تعارف اور قوانین')}</p>
                <Link to="/about" className="block text-[#D8D0BE]/85 hover:text-white transition-colors">
                  {bi('About', 'تعارف')}
                </Link>
                <Link to="/contact" className="block text-[#D8D0BE]/85 hover:text-white transition-colors">
                  {bi('Contact', 'رابطہ')}
                </Link>
                <Link to="/privacy" className="block text-[#D8D0BE]/85 hover:text-white transition-colors">
                  {bi('Privacy Policy', 'رازداری کی پالیسی')}
                </Link>
                <Link to="/terms" className="block text-[#D8D0BE]/85 hover:text-white transition-colors">
                  {bi('Terms and Conditions', 'شرائط و ضوابط')}
                </Link>
              </div>
            </div>

            <div className="md:col-span-3 text-sm">
              <p className="font-semibold text-white">{bi('Support & Coverage', 'مدد اور کوریج')}</p>
              <p className="mt-2.5 text-[#D8D0BE]/90 font-medium">
                {bi('Serving workers and customers across Pakistan', 'پاکستان بھر کے ہنرمندوں اور صارفین کی خدمت میں')}
              </p>
              {hasWhatsApp && (<div className="mt-3">
                <a
                  href={WHATSAPP_WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[#C9973A]/50 bg-[#176B4A]/70 px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#399B6B] transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-[#D8D0BE]" />
                  <span>{bi('WhatsApp Support', 'واٹس ایپ مدد')}</span>
                </a>
              </div>)}
              <div className="mt-4 flex flex-wrap items-center gap-3.5 text-[#C9973A]">
                <Link to="/explore?trade=electrician" className="hover:text-white transition-colors">
                  {bi('Electricians', 'الیکٹریشنز')}
                </Link>
                <Link to="/explore?trade=plumber" className="hover:text-white transition-colors">
                  {bi('Plumbers', 'پلمبرز')}
                </Link>
                <Link to="/explore?trade=ac-technician" className="hover:text-white transition-colors">
                  {bi('AC Techs', 'اے سی ماہر')}
                </Link>
                <Link to="/explore?femaleOnly=true" className="hover:text-white transition-colors">
                  {bi('Women Services', 'خواتین سروسز')}
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#D8D0BE]/75">
            <p>
              {bi('© 2026 KARIGAR CONNECT · Capital Youth Expo 2026 prototype', '© 2026 کاریگر کنیکٹ · کیپیٹل یوتھ ایکسپو ۲۰۲۶ پروٹوٹائپ')}
              <span className="ms-2 inline-flex items-center rounded-full border border-[#C9973A]/60 px-2 py-0.5 text-[11px] font-semibold text-[#E9C77E]">
                {bi('Sample data', 'نمونہ ڈیٹا')}
              </span>
            </p>
            <p>{bi('Other apps tell you who is available. Karigar Connect tells you who is proven.', 'دوسری ایپس بتاتی ہیں کہ کون دستیاب ہے۔ کاریگر کنیکٹ بتاتا ہے کہ کون ثابت شدہ ہے۔')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
