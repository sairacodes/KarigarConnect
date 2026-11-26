import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Copy,
  ExternalLink,
  Languages,
  Menu,
  MessageCircle,
  X,
} from 'lucide-react';
import { getDashboardPathForRole, useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../i18n/translations';
import { BrandLogo } from '../ui/BrandLogo';

const WHATSAPP_NUMBER_DISPLAY = '+92 300 0000000';
const WHATSAPP_WA_URL =
  'https://wa.me/923000000000?text=' +
  encodeURIComponent('Assalam-o-Alaikum KARIGAR CONNECT Support, I need help with:');

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
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

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(WHATSAPP_NUMBER_DISPLAY);
      showToast(bi('WhatsApp support number copied!', 'واٹس ایپ ہیلپ لائن نمبر کاپی ہو گیا!'), 'success');
    } catch {
      showToast(`${bi('WhatsApp Help:', 'واٹس ایپ ہیلپ:')} ${WHATSAPP_NUMBER_DISPLAY}`, 'info');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#17251E]">
      <header className="sticky top-0 z-40 kc-dark-surface text-white border-b border-[#1F3A2E] shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center shrink-0 focus:outline-none">
            <BrandLogo variant="dark" sizeClass="h-10 sm:h-11" />
          </Link>

          <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-xs lg:text-sm font-medium text-[#DDF3E4]/85">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-white ${
                    isActive
                      ? 'text-white font-semibold underline decoration-[#73C99B] decoration-2 underline-offset-8'
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
              className="inline-flex items-center gap-1.5 rounded-full border border-[#399B6B]/60 bg-[#173629] px-3 py-1.5 text-xs font-semibold text-[#DDF3E4] hover:border-[#73C99B] hover:bg-[#1E4635] hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Languages className="h-3.5 w-3.5 text-[#73C99B]" />
              <span>{lang === 'en' ? 'اردو' : 'English'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrimaryCta}
              className="hidden sm:inline-flex items-center justify-center gap-2 rounded-full bg-[#B8E4C7] px-5 py-2 text-sm font-bold text-[#11221B] hover:bg-[#DDF3E4] transition-all hover:-translate-y-0.5 whitespace-nowrap shrink-0 shadow-xs"
            >
              <span>{user ? bi('Open Dashboard', 'ڈیش بورڈ کھولیں') : bi('Get Started', 'شروع کریں')}</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={bi('Toggle navigation menu', 'نیویگیشن مینو کھولیں')}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#399B6B]/60 bg-[#173629] text-[#DDF3E4] hover:bg-[#1E4635]"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-[#1F3A2E] bg-[#11221B] px-4 py-4 space-y-1.5">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#173629] text-white font-semibold'
                      : 'text-[#DDF3E4]/90 hover:bg-[#173629] hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="mt-2 w-full rounded-full bg-[#B8E4C7] px-4 py-3 text-center text-sm font-bold text-[#11221B] hover:bg-[#DDF3E4]"
            >
              {user ? bi('Open Dashboard', 'ڈیش بورڈ کھولیں') : bi('Get Started', 'شروع کریں')}
            </button>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* Compact WhatsApp Help Button (Bottom-End, <15% Mobile Height) */}
      <div className="fixed bottom-4 end-4 z-40">
        {whatsappOpen && (
          <div className="mb-3 w-72 rounded-2xl border border-[#73C99B]/70 bg-white/98 backdrop-blur-md p-4 shadow-xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#176B4A] text-white shrink-0">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-extrabold text-[#17251E]">
                    {bi('WhatsApp Help Desk', 'واٹس ایپ ہیلپ ڈیسک')}
                  </p>
                  <p className="text-[11px] text-[#4D6357]">{WHATSAPP_NUMBER_DISPLAY}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappOpen(false)}
                aria-label={bi('Close help box', 'بند کریں')}
                className="text-[#4D6357] hover:text-[#17251E]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-[#4D6357] leading-relaxed">
              {bi(
                'Need help creating a worker portfolio, booking a proven Karigar, or verifying a badge? Message our bilingual support team.',
                'پروفائل بنانے، مصدقہ کاریگر بک کرنے، یا بیج کی تصدیق میں مدد چاہیے؟ ہماری ٹیم سے اردو یا انگریزی میں رابطہ کریں۔'
              )}
            </p>
            <div className="flex items-center gap-2">
              <a
                href={WHATSAPP_WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#176B4A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#13563B]"
              >
                <span>{bi('Open WhatsApp', 'واٹس ایپ کھولیں')}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                title={bi('Copy number', 'نمبر کاپی کریں')}
                className="inline-flex items-center gap-1 rounded-xl border border-[#B8E4C7] bg-[#DDF3E4] px-2.5 py-2 text-xs font-semibold text-[#176B4A] hover:bg-[#CBEBD5]"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{bi('Copy', 'کاپی')}</span>
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setWhatsappOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-[#176B4A] px-4 py-2.5 text-xs font-bold text-white shadow-lg border border-[#73C99B]/60 hover:bg-[#13563B] transition-all whitespace-nowrap"
        >
          <MessageCircle className="h-4 w-4 text-[#B8E4C7]" />
          <span>{bi('WhatsApp Help', 'واٹس ایپ مدد')}</span>
        </button>
      </div>

      <footer className="kc-dark-surface text-white border-t border-[#1F3A2E]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-5">
              <BrandLogo variant="dark" sizeClass="h-11" />
              <p className="mt-4 text-sm text-[#B8E4C7] max-w-sm leading-relaxed">
                {bi(
                  'Make practical skills easier to prove. Built to connect skilled tradespeople with trusted customers through rubric-assessed evidence.',
                  'عملی مہارتوں کا ثبوت پیش کرنا آسان بنائیں۔ ہنرمند افراد کو مستند ثبوت کے ذریعے قابلِ اعتماد صارفین سے جوڑنے کا پلیٹ فارم۔'
                )}
              </p>
              <p className="mt-3 text-xs text-[#B8E4C7]/75 max-w-md leading-relaxed">
                {bi(
                  'Verification badges reflect rubric-based evidence review by approved assessors and do not represent government accreditation.',
                  'تصدیقی بیجز منظور شدہ ماہرین کی جانچ کی عکاسی کرتے ہیں اور یہ سرکاری سند یا لائسنس نہیں ہیں۔'
                )}
              </p>
            </div>

            <div className="md:col-span-4 grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-2.5">
                <p className="font-semibold text-white">{bi('Platform', 'پلیٹ فارم')}</p>
                <Link to="/why-karigar-connect" className="block text-[#B8E4C7]/85 hover:text-white transition-colors">
                  {bi('Why It Matters', 'اہمیت اور اعتماد')}
                </Link>
                <Link to="/how-it-works" className="block text-[#B8E4C7]/85 hover:text-white transition-colors">
                  {bi('Full Visual Process Map', 'مکمل طریقہ کار کا نقشہ')}
                </Link>
                <Link to="/trust-score" className="block text-[#B8E4C7]/85 hover:text-white transition-colors">
                  {bi('How Trust Score Works', 'اعتماد اسکور کیسے بنتا ہے')}
                </Link>
                <Link to="/verify-badge" className="block text-[#B8E4C7]/85 hover:text-white transition-colors">
                  {bi('Verify a Badge / Passport', 'بیج یا پاسپورٹ تصدیق')}
                </Link>
                <Link to="/demand-insights" className="block text-[#B8E4C7]/85 hover:text-white transition-colors">
                  {bi('Skill Demand Insights', 'اسکل ڈیمانڈ بصیرت')}
                </Link>
              </div>
              <div className="space-y-2.5">
                <p className="font-semibold text-white">{bi('Company & Legal', 'تعارف اور قوانین')}</p>
                <Link to="/about" className="block text-[#B8E4C7]/85 hover:text-white transition-colors">
                  {bi('About', 'تعارف')}
                </Link>
                <Link to="/contact" className="block text-[#B8E4C7]/85 hover:text-white transition-colors">
                  {bi('Contact', 'رابطہ')}
                </Link>
                <Link to="/privacy" className="block text-[#B8E4C7]/85 hover:text-white transition-colors">
                  {bi('Privacy Policy', 'رازداری کی پالیسی')}
                </Link>
                <Link to="/terms" className="block text-[#B8E4C7]/85 hover:text-white transition-colors">
                  {bi('Terms and Conditions', 'شرائط و ضوابط')}
                </Link>
              </div>
            </div>

            <div className="md:col-span-3 text-sm">
              <p className="font-semibold text-white">{bi('Support & Coverage', 'مدد اور کوریج')}</p>
              <p className="mt-2.5 text-[#B8E4C7]/90 font-medium">
                {bi('Serving workers and customers across Pakistan', 'پاکستان بھر کے ہنرمندوں اور صارفین کی خدمت میں')}
              </p>
              <div className="mt-3">
                <a
                  href={WHATSAPP_WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[#73C99B]/50 bg-[#176B4A]/70 px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#399B6B] transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-[#B8E4C7]" />
                  <span>{bi('WhatsApp Support', 'واٹس ایپ مدد')}</span>
                </a>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3.5 text-[#73C99B]">
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

          <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#B8E4C7]/75">
            <p>{bi('© 2026 KARIGAR CONNECT · Serving workers and customers across Pakistan', '© 2026 کاریگر کنیکٹ · پاکستان بھر کے ہنرمندوں اور صارفین کے لیے')}</p>
            <p>{bi('Other apps tell you who is available. Karigar Connect tells you who is proven.', 'دوسری ایپس بتاتی ہیں کہ کون دستیاب ہے۔ کاریگر کنیکٹ بتاتا ہے کہ کون ثابت شدہ ہے۔')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
