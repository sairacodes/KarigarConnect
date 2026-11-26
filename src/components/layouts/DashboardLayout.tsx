import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Award,
  BarChart3,
  Bell,
  Briefcase,
  CheckCheck,
  ChevronDown,
  ClipboardCheck,
  FileText,
  FolderUp,
  Grid,
  History,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Scale,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { getDashboardPathForRole, useAuth, UserRole } from '../../context/AuthContext';
import { useI18n } from '../../i18n/translations';
import { api } from '../../services/api';
import { BrandLogo } from '../ui/BrandLogo';
import { PageTransition } from '../ui/MotionPrimitives';

interface NavItem {
  to: string;
  label: string;
  urduLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  section: 'MENU' | 'GENERAL';
}

const ROLE_NAV: Record<UserRole, NavItem[]> = {
  WORKER: [
    { to: '/worker/dashboard', label: 'Dashboard', urduLabel: 'ڈیش بورڈ', icon: LayoutDashboard, section: 'MENU' },
    { to: '/worker/jobs', label: 'My Jobs', urduLabel: 'میرے کام', icon: Briefcase, section: 'MENU' },
    { to: '/worker/growth', label: 'Growth Hub & Passport', urduLabel: 'ترقی اور پاسپورٹ', icon: TrendingUp, section: 'MENU' },
    { to: '/worker/insights', label: 'Skill Demand Insights', urduLabel: 'اسکل ڈیمانڈ بصیرت', icon: BarChart3, section: 'MENU' },
    { to: '/worker/trades', label: 'My Trade', urduLabel: 'میرا ہنر', icon: Wrench, section: 'MENU' },
    { to: '/worker/matrix', label: 'Competency Matrix', urduLabel: 'مہارتوں کی فہرست', icon: Grid, section: 'MENU' },
    { to: '/worker/evidence', label: 'Evidence Upload', urduLabel: 'ثبوت اپلوڈ', icon: FolderUp, section: 'MENU' },
    { to: '/worker/assessments', label: 'My Assessments', urduLabel: 'جائزہ رپورٹس', icon: ClipboardCheck, section: 'MENU' },
    { to: '/worker/badges', label: 'My Badges', urduLabel: 'تصدیقی بیجز', icon: Award, section: 'MENU' },
    { to: '/worker/requests', label: 'Contact Requests', urduLabel: 'رابطہ درخواستیں', icon: MessageSquare, section: 'MENU' },
    { to: '/worker/profile', label: 'My Profile', urduLabel: 'میرا پروفائل', icon: Users, section: 'GENERAL' },
    { to: '/worker/privacy', label: 'Privacy Settings', urduLabel: 'رازداری کی ترتیبات', icon: Settings, section: 'GENERAL' },
  ],
  EMPLOYER: [
    { to: '/employer/dashboard', label: 'Dashboard', urduLabel: 'ڈیش بورڈ', icon: LayoutDashboard, section: 'MENU' },
    { to: '/employer/search', label: 'Search Workers', urduLabel: 'ہنرمند تلاش کریں', icon: Search, section: 'MENU' },
    { to: '/employer/jobs', label: 'My Jobs', urduLabel: 'میرے کام / بکنگز', icon: Briefcase, section: 'MENU' },
    { to: '/employer/insights', label: 'Skill Demand Insights', urduLabel: 'اسکل ڈیمانڈ بصیرت', icon: BarChart3, section: 'MENU' },
    { to: '/employer/shortlist', label: 'My Shortlist', urduLabel: 'پسندیدہ فہرست', icon: Star, section: 'MENU' },
    { to: '/employer/requests', label: 'Contact Requests', urduLabel: 'رابطہ درخواستیں', icon: MessageSquare, section: 'MENU' },
    { to: '/employer/profile', label: 'Customer / Employer Profile', urduLabel: 'گاہک / آجِر پروفائل', icon: Users, section: 'GENERAL' },
  ],
  ASSESSOR: [
    { to: '/assessor/dashboard', label: 'Dashboard', urduLabel: 'ڈیش بورڈ', icon: LayoutDashboard, section: 'MENU' },
    { to: '/assessor/queue', label: 'Verification Queue', urduLabel: 'تصدیقی قطار', icon: ClipboardCheck, section: 'MENU' },
    { to: '/assessor/completed', label: 'Completed Assessments', urduLabel: 'مکمل شدہ جائزے', icon: ShieldCheck, section: 'MENU' },
    { to: '/assessor/insights', label: 'Skill Demand Insights', urduLabel: 'اسکل ڈیمانڈ بصیرت', icon: BarChart3, section: 'MENU' },
    { to: '/assessor/application', label: 'Assessor Application', urduLabel: 'ماہر درخواست', icon: FileText, section: 'GENERAL' },
    { to: '/assessor/profile', label: 'Assessor Profile', urduLabel: 'ماہر پروفائل', icon: Users, section: 'GENERAL' },
  ],
  ADMIN: [
    { to: '/admin/dashboard', label: 'Admin Dashboard', urduLabel: 'ایڈمن ڈیش بورڈ', icon: LayoutDashboard, section: 'MENU' },
    { to: '/admin/insights', label: 'Skill Demand Insights', urduLabel: 'اسکل ڈیمانڈ بصیرت', icon: BarChart3, section: 'MENU' },
    { to: '/admin/users', label: 'User Management', urduLabel: 'صارفین کا انتظام', icon: Users, section: 'MENU' },
    { to: '/admin/assessors', label: 'Assessor Applications', urduLabel: 'ماہرین کی درخواستیں', icon: UserCheck, section: 'MENU' },
    { to: '/admin/tiers', label: 'Tier Approval Queue', urduLabel: 'درجہ منظوری قطار', icon: Award, section: 'MENU' },
    { to: '/admin/tier-rules', label: 'Badge Rules', urduLabel: 'درجہ بندی قوانین', icon: Sliders, section: 'MENU' },
    { to: '/admin/disputes', label: 'Guarantee Disputes', urduLabel: 'گارنٹی تنازعات', icon: Scale, section: 'MENU' },
    { to: '/admin/trades', label: 'Categories & Price Guide', urduLabel: 'شعبے اور قیمت نامہ', icon: Wrench, section: 'MENU' },
    { to: '/admin/competencies', label: 'Competency Matrix', urduLabel: 'مہارتوں کا معیار', icon: Grid, section: 'MENU' },
    { to: '/admin/reports', label: 'Reports & Moderation', urduLabel: 'رپورٹس اور نگرانی', icon: ShieldAlert, section: 'GENERAL' },
    { to: '/admin/audit-logs', label: 'Audit Logs', urduLabel: 'آڈٹ ریکارڈ', icon: History, section: 'GENERAL' },
  ],
};

function getRoleProfileRoute(role: UserRole): string {
  switch (role) {
    case 'WORKER':
      return '/worker/profile';
    case 'EMPLOYER':
      return '/employer/profile';
    case 'ASSESSOR':
      return '/assessor/profile';
    case 'ADMIN':
      return '/admin/audit-logs';
  }
}

function getSidebarCardContent(role: UserRole, isUr: boolean) {
  switch (role) {
    case 'WORKER':
      return {
        title: isUr ? 'عملی مہارت ثابت کریں' : 'Prove Practical Skills',
        desc: isUr ? 'تصدیقی بیج حاصل کرنے کے لیے تصویر یا ویڈیو ثبوت شامل کریں۔' : 'Add photo or video evidence to earn verified badges.',
        cta: isUr ? 'ثبوت اپلوڈ کریں' : 'Upload Evidence',
        to: '/worker/evidence',
      };
    case 'EMPLOYER':
      return {
        title: isUr ? 'تصدیق شدہ ہنرمند تلاش کریں' : 'Hire Verified Talent',
        desc: isUr ? 'مہارت کے اسکور اور بیجز کے مطابق ہنرمند تلاش کریں۔' : 'Filter tradespeople by rubric-scored competency badges.',
        cta: isUr ? 'ہنرمند تلاش کریں' : 'Search Workers',
        to: '/employer/search',
      };
    case 'ASSESSOR':
      return {
        title: isUr ? 'منصفانہ روبرک جائزہ' : 'Fair Rubric Reviews',
        desc: isUr ? 'اپنے شعبے میں زیرِ التواء ہنرمندوں کی درخواستوں کا جائزہ لیں۔' : 'Evaluate pending worker submissions in your trades.',
        cta: isUr ? 'قطار کھولیں' : 'Open Queue',
        to: '/assessor/queue',
      };
    case 'ADMIN':
      return {
        title: isUr ? 'پلیٹ فارم کی نگرانی' : 'Platform Governance',
        desc: isUr ? 'ماہرین کی درخواستوں اور آڈٹ ریکارڈ کا جائزہ لیں۔' : 'Review assessor applications and audit trail activity.',
        cta: isUr ? 'ماہرین دیکھیں' : 'Review Assessors',
        to: '/admin/assessors',
      };
  }
}

export function DashboardLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const { lang, isUr, toggleLang, bi, roleText } = useI18n();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch {
      // Ignore background poll error
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!user) return null;
  const navItems = ROLE_NAV[user.role];
  const menuItems = navItems.filter((i) => i.section === 'MENU');
  const generalItems = navItems.filter((i) => i.section === 'GENERAL');
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const sidebarCard = getSidebarCardContent(user.role, isUr);

  const handleMarkAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotifClick = async (n: any) => {
    if (!n.isRead) {
      await api.patch(`/notifications/${n.id}/read`);
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)));
    }
    setNotifOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (user.role === 'EMPLOYER') {
      navigate(q ? `/employer/search?q=${encodeURIComponent(q)}` : '/employer/search');
    } else if (user.role === 'ADMIN') {
      navigate(q ? `/admin/users?q=${encodeURIComponent(q)}` : '/admin/users');
    } else if (user.role === 'ASSESSOR') {
      navigate('/assessor/queue');
    } else {
      navigate('/worker/matrix');
    }
  };

  const searchPlaceholder =
    user.role === 'EMPLOYER'
      ? bi('Search verified workers or trades...', 'تصدیق شدہ ہنرمند یا شعبہ تلاش کریں...')
      : user.role === 'ADMIN'
        ? bi('Search platform users...', 'صارفین تلاش کریں...')
        : user.role === 'ASSESSOR'
          ? bi('Jump to verification queue...', 'تصدیقی قطار کھولیں...')
          : bi('Jump to competency matrix...', 'مہارتوں کی فہرست کھولیں...');

  const messagesRoute =
    user.role === 'WORKER'
      ? '/worker/requests'
      : user.role === 'EMPLOYER'
        ? '/employer/requests'
        : null;

  const initials = user.fullName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderNavLink = (item: NavItem) => {
    const Icon = item.icon;
    const displayLabel = isUr ? item.urduLabel : item.label;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={() => setSidebarOpen(false)}
        className={({ isActive }) =>
          `group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
            isActive
              ? 'bg-[#DDF3E4] text-[#176B4A] font-semibold'
              : 'text-[#78857D] hover:bg-[#F7FAF8] hover:text-[#17251E]'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute start-0 top-2 bottom-2 w-1 rounded-e-full bg-[#176B4A]" />
            )}
            <Icon
              className={`h-4 w-4 shrink-0 transition-colors ${
                isActive ? 'text-[#176B4A]' : 'text-[#78857D] group-hover:text-[#176B4A]'
              }`}
            />
            <span className="truncate">{displayLabel}</span>
          </>
        )}
      </NavLink>
    );
  };

  const SidebarBody = () => (
    <div className="flex h-full flex-col bg-[#F2FAF5]/95 backdrop-blur-md text-[#17251E]">
      <div className="flex h-[68px] items-center justify-between border-b border-[#B8E4C7] px-4">
        <Link to="/" className="inline-flex items-center focus:outline-none">
          <BrandLogo variant="light" sizeClass="h-9" />
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden rounded-lg p-1.5 text-[#78857D] hover:text-[#17251E]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
        <div>
          <p className="px-3.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#78857D]">
            {bi('Menu', 'مینو')}
          </p>
          <div className="space-y-1">{menuItems.map(renderNavLink)}</div>
        </div>

        <div>
          <p className="px-3.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#78857D]">
            {bi('General', 'عمومی')}
          </p>
          <div className="space-y-1">
            {generalItems.map(renderNavLink)}
            <button
              type="button"
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#78857D] hover:bg-red-50/80 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0 rtl:rotate-180" />
              <span>{bi('Sign Out', 'لاگ آؤٹ')}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom Dark Contrast Shortcut Card */}
      <div className="p-3.5 pt-0">
        <div className="kc-dark-surface rounded-2xl p-4 text-white">
          <p className="text-xs font-semibold text-[#73C99B]">{roleText(user.role)}</p>
          <p className="mt-1 text-sm font-bold leading-snug">{sidebarCard.title}</p>
          <p className="mt-1 text-xs text-[#B8E4C7]/80 leading-relaxed">{sidebarCard.desc}</p>
          <Link
            to={sidebarCard.to}
            onClick={() => setSidebarOpen(false)}
            className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#399B6B] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#176B4A] transition-colors"
          >
            <span>{sidebarCard.cta}</span>
            <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#EAF5EE] text-[#17251E]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-e border-[#B8E4C7] bg-[#F2FAF5]">
        <div className="sticky top-0 h-screen">
          <SidebarBody />
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-[#17251E]/40 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-xl">
            <SidebarBody />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between gap-4 border-b border-[#B8E4C7] bg-[#F2FAF5]/92 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={bi('Open navigation menu', 'نیویگیشن مینو کھولیں')}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] text-[#17251E] hover:bg-[#DDF3E4]/60 shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="md:hidden text-base font-bold text-[#17251E] truncate">{title}</h1>

            {/* Search Input (Desktop & Tablet) */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative max-w-sm w-full">
              <Search className="pointer-events-none absolute start-3.5 h-4 w-4 text-[#78857D]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-full border border-[#E5EEE8] bg-[#F7FAF8] ps-10 pe-14 py-2 text-sm text-[#17251E] placeholder:text-[#78857D] focus:border-[#399B6B] focus:bg-white focus:outline-none transition-colors"
              />
              <kbd className="pointer-events-none absolute end-3 rounded-md border border-[#E5EEE8] bg-white px-1.5 py-0.5 text-[10px] font-mono text-[#78857D]">
                ⌘F
              </kbd>
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-xs font-semibold text-[#17251E] hover:border-[#B8E4C7] hover:bg-[#DDF3E4]/60 whitespace-nowrap transition-colors"
            >
              <Languages className="h-3.5 w-3.5 text-[#176B4A]" />
              <span>{lang === 'en' ? 'اردو' : 'English'}</span>
            </button>

            {messagesRoute && (
              <Link
                to={messagesRoute}
                title={bi('Contact Requests', 'رابطہ درخواستیں')}
                aria-label={bi('Contact Requests', 'رابطہ درخواستیں')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5EEE8] bg-[#F7FAF8] text-[#17251E] hover:border-[#B8E4C7] hover:bg-[#DDF3E4]/60 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
              </Link>
            )}

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  setNotifOpen((v) => !v);
                  if (!notifOpen) loadNotifications();
                }}
                aria-label={bi('Notifications', 'اطلاعات')}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5EEE8] bg-[#F7FAF8] text-[#17251E] hover:border-[#B8E4C7] hover:bg-[#DDF3E4]/60 transition-colors"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#176B4A] px-1 text-[10px] font-bold text-white tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute end-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#E5EEE8] bg-white/95 backdrop-blur-md shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#E5EEE8] px-4 py-3">
                    <span className="text-sm font-bold text-[#17251E]">{bi('Notifications', 'اطلاعات')}</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#176B4A] hover:underline"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        {bi('Mark all read', 'سب پڑھا ہوا نشان زد کریں')}
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E5EEE8]">
                    {notifications.length === 0 ? (
                      <p className="p-5 text-center text-sm text-[#78857D]">
                        {bi('No notifications yet.', 'ابھی کوئی اطلاع نہیں ہے۔')}
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleNotifClick(n)}
                          className={`w-full text-start px-4 py-3 hover:bg-[#F7FAF8] transition-colors ${
                            n.isRead ? 'bg-white' : 'bg-[#DDF3E4]/45'
                          }`}
                        >
                          <p className="text-xs font-bold text-[#17251E]">{n.title}</p>
                          <p className="mt-0.5 text-xs text-[#78857D] line-clamp-2">{n.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Chip & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(false);
                  setProfileOpen((v) => !v);
                }}
                className="flex items-center gap-2.5 rounded-full border border-[#E5EEE8] bg-[#F7FAF8] py-1 ps-1.5 pe-3 hover:border-[#B8E4C7] hover:bg-[#DDF3E4]/40 transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#176B4A] text-xs font-bold text-white shrink-0">
                  {initials}
                </span>
                <div className="hidden sm:block text-start min-w-0 max-w-[135px]">
                  <p className="text-xs font-bold text-[#17251E] truncate leading-tight">{user.fullName}</p>
                  <p className="text-[11px] text-[#78857D] truncate leading-tight">{user.email}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-[#78857D] hidden sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute end-0 mt-2 w-56 rounded-2xl border border-[#E5EEE8] bg-white/95 backdrop-blur-md p-1.5 shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-[#E5EEE8] mb-1">
                    <p className="text-xs font-bold text-[#17251E] truncate">{user.fullName}</p>
                    <p className="text-[11px] text-[#78857D] truncate">
                      {roleText(user.role)} · {user.city}
                    </p>
                  </div>
                  <Link
                    to={getDashboardPathForRole(user.role)}
                    onClick={() => setProfileOpen(false)}
                    className="block rounded-xl px-3 py-2 text-xs font-medium text-[#17251E] hover:bg-[#DDF3E4]/50"
                  >
                    {bi('Dashboard', 'ڈیش بورڈ')}
                  </Link>
                  <Link
                    to={getRoleProfileRoute(user.role)}
                    onClick={() => setProfileOpen(false)}
                    className="block rounded-xl px-3 py-2 text-xs font-medium text-[#17251E] hover:bg-[#DDF3E4]/50"
                  >
                    {bi('Account & Settings', 'اکاؤنٹ اور ترتیبات')}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-start rounded-xl px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 mt-0.5"
                  >
                    {bi('Sign Out', 'لاگ آؤٹ')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <PageTransition className="mx-auto max-w-6xl space-y-6">
            <div className="hidden md:flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#17251E]">{title}</h1>
              </div>
            </div>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
