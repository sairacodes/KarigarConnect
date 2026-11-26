import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Copy, Edit3, ExternalLink, Lock, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { CityCombobox } from '../../components/ui/CityCombobox';
import { LoadingSkeleton } from '../../components/ui/Components';
import { TierPill, TrustScoreBadge } from '../../components/ui/RatingDisplay';
import { VoiceMicButton } from '../../components/ui/VoiceMicButton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SERVICE_GROUPS } from '../../data/serviceCatalog';
import { api, getApiErrorMessage } from '../../services/api';
import { useI18n } from '../../i18n/translations';

export function WorkerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { bi, isUr } = useI18n();

  useEffect(() => {
    api
      .get('/workers/me')
      .then((res) => setProfile(res.data.data))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, []);

  const copyLink = () => {
    if (!profile) return;
    navigator.clipboard.writeText(`${window.location.origin}/workers/${profile.publicId}`);
    showToast(bi('Public portfolio link copied.', 'عوامی پورٹ فولیو لنک کاپی ہو گیا۔'), 'success');
  };

  return (
    <DashboardLayout title={bi('My Profile', 'میرا پروفائل')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : !profile ? null : (
        <div className="space-y-6">
          <div className="rounded-2xl kc-glass-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-2xl border border-[#B8E4C7] bg-[#DDF3E4] flex items-center justify-center text-lg font-bold text-[#176B4A]">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.fullName} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  ) : (
                    profile.fullName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-[#17251E]">{profile.fullName}</h2>
                    <TierPill tier={profile.tier} underReview={profile.tierUnderReview} tierStatus={profile.tierStatus} compact />
                    <TrustScoreBadge score={profile.trustScoreBreakdown?.total ?? 0} compact />
                  </div>
                  <p className="text-sm text-[#78857D] mt-0.5">
                    {(isUr && profile.tradeUrduName ? profile.tradeUrduName : profile.tradeName) || bi('No category selected', 'کوئی شعبہ منتخب نہیں')} · {profile.city} · {profile.yearsExperience} {bi('yrs experience', 'سال تجربہ')}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-[#176B4A]">
                    <span>
                      {bi('Visibility:', 'مرئیت:')} {profile.isPublic ? bi('Public Portfolio Enabled', 'عوامی پورٹ فولیو فعال') : bi('Private', 'نجی')}
                    </span>
                    <span className="font-mono bg-[#F7FAF8] border border-[#E5EEE8] px-2 py-0.5 rounded">
                      {profile.passportId}
                    </span>
                    {profile.isFemaleProfessional && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#B8E4C7] bg-[#DDF3E4]/60 px-2 py-0.5 text-[11px] font-semibold text-[#176B4A]">
                        <ShieldCheck className="h-3 w-3" />
                        {bi('Women-Safe Verified Pro', 'خواتین سروسز کے لیے دستیاب')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E5EEE8] bg-[#F7FAF8] px-4 py-2 text-xs font-semibold text-[#17251E] hover:bg-[#DDF3E4]/60"
                >
                  <Copy className="h-3.5 w-3.5 text-[#176B4A]" />
                  {bi('Copy Share Link', 'لنک کاپی کریں')}
                </button>
                <Link
                  to="/worker/growth"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E5EEE8] bg-[#F7FAF8] px-4 py-2 text-xs font-semibold text-[#17251E] hover:bg-[#DDF3E4]/60"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#176B4A]" />
                  {bi('QR Passport', 'QR پاسپورٹ')}
                </Link>
                <Link
                  to={`/workers/${profile.publicId}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E5EEE8] bg-[#F7FAF8] px-4 py-2 text-xs font-semibold text-[#17251E] hover:bg-[#DDF3E4]/60"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#176B4A]" />
                  {bi('Preview Public Page', 'عوامی صفحہ دیکھیں')}
                </Link>
                <Link
                  to="/worker/profile/edit"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B]"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  {bi('Edit Profile', 'پروفائل میں ترمیم')}
                </Link>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#E5EEE8] pt-5 text-sm">
              <div>
                <p className="text-xs font-medium text-[#78857D]">
                  {bi('Private Phone (Hidden until job/request accepted)', 'ذاتی فون نمبر (منظوری تک پوشیدہ)')}
                </p>
                <p className="mt-1 font-mono text-[#17251E]">{profile.phone}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#78857D]">{bi('Private Email', 'ذاتی ای میل')}</p>
                <p className="mt-1 text-[#17251E]">{profile.email}</p>
              </div>
            </div>

            <div className="mt-5 border-t border-[#E5EEE8] pt-5">
              <p className="text-xs font-medium text-[#78857D]">{bi('Biography', 'تعارف')}</p>
              <p className="mt-1 text-sm text-[#17251E] leading-relaxed">
                {profile.bio || bi('No biography added yet.', 'ابھی تک کوئی تعارف شامل نہیں کیا گیا۔')}
              </p>
            </div>

            <div className="mt-5 border-t border-[#E5EEE8] pt-5">
              <p className="text-xs font-medium text-[#78857D]">{bi('Skills', 'مہارتیں')}</p>
              <p className="mt-1 text-sm text-[#17251E]">
                {profile.skills.length > 0 ? profile.skills.join(' · ') : bi('No skills listed yet.', 'ابھی تک کوئی مہارت درج نہیں کی گئی۔')}
              </p>
            </div>

            {profile.certificates.length > 0 && (
              <div className="mt-5 border-t border-[#E5EEE8] pt-5">
                <p className="text-xs font-medium text-[#78857D]">
                  {bi('Supporting Certificates', 'معاون اسناد')} ({profile.showCertificates ? bi('Shown publicly', 'عوامی طور پر ظاہر') : bi('Hidden', 'پوشیدہ')})
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-[#78857D]">
                  {profile.certificates.map((c: any, idx: number) => (
                    <li key={idx}>
                      • <span className="font-semibold text-[#17251E]">{c.title}</span> — {c.issuer} ({c.year})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export function WorkerEditProfilePage() {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const { bi, isUr } = useI18n();
  const navigate = useNavigate();

  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTradeId, setSelectedTradeId] = useState('');
  const [yearsExperience, setYearsExperience] = useState(0);
  const [bio, setBio] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [showCertificates, setShowCertificates] = useState(true);
  const [isFemaleProfessional, setIsFemaleProfessional] = useState(false);
  const [certificates, setCertificates] = useState<{ title: string; issuer: string; year: string }[]>([]);

  useEffect(() => {
    Promise.all([api.get('/workers/me'), api.get('/public/trades')])
      .then(([meRes, tradesRes]) => {
        const p = meRes.data.data;
        setFullName(p.fullName);
        setCity(p.city);
        setPhone(p.phone);
        setEmail(p.email);
        setSelectedTradeId(p.selectedTradeId || '');
        setYearsExperience(p.yearsExperience || 0);
        setBio(p.bio || '');
        setSkillsText((p.skills || []).join(', '));
        setAvatarUrl(p.avatarUrl || '');
        setIsPublic(Boolean(p.isPublic));
        setShowCertificates(Boolean(p.showCertificates));
        setIsFemaleProfessional(Boolean(p.isFemaleProfessional));
        setCertificates(p.certificates || []);
        setTrades(tradesRes.data.data || []);
      })
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast(bi('Profile photo must be JPG, PNG, or WebP.', 'پروفائل تصویر JPG، PNG یا WebP ہونی چاہیے۔'), 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 320;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setAvatarUrl(canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      showToast(bi('Select your city in Pakistan.', 'پاکستان کا شہر منتخب کریں۔'), 'error');
      return;
    }
    setSaving(true);
    try {
      const skills = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const normalizedAvatar = avatarUrl.trim().startsWith('/src/assets/images/')
        ? avatarUrl.trim().replace('/src/assets/images/', '/images/')
        : avatarUrl.trim();
      await api.put('/workers/me', {
        fullName,
        city,
        phone,
        selectedTradeId: selectedTradeId || null,
        yearsExperience: Number(yearsExperience),
        bio,
        skills,
        certificates: certificates.filter((c) => c.title.trim() && c.issuer.trim()),
        showCertificates,
        isPublic,
        isFemaleProfessional,
        avatarUrl: normalizedAvatar,
      });
      await refreshUser();
      showToast(bi('Profile saved successfully.', 'پروفائل کامیابی سے محفوظ ہو گیا۔'), 'success');
      navigate('/worker/profile');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title={bi('Edit Worker Profile', 'ورکر پروفائل میں ترمیم')}>
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <form onSubmit={handleSave} className="rounded-2xl kc-glass-card p-6 space-y-5 max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#17251E] mb-1">{bi('Full Name', 'مکمل نام')}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#17251E] mb-1">{bi('City (Pakistan)', 'شہر (پاکستان)')}</label>
              <CityCombobox value={city} onChange={setCity} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#17251E] mb-1">{bi('Phone Number (Private)', 'فون نمبر (پوشیدہ)')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#17251E] mb-1">{bi('Email (Account ID)', 'ای میل (اکاؤنٹ آئی ڈی)')}</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm text-[#78857D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#17251E] mb-1">{bi('Primary Service Category', 'بنیادی سروس شعبہ')}</label>
              <select
                value={selectedTradeId}
                onChange={(e) => setSelectedTradeId(e.target.value)}
                className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
              >
                <option value="">{bi('Select a category', 'شعبہ منتخب کریں')}</option>
                {SERVICE_GROUPS.map((grp) => {
                  const grpTrades = trades.filter((t) => (t.group || 'Home Repair & Maintenance') === grp.group);
                  if (grpTrades.length === 0) return null;
                  return (
                    <optgroup key={grp.group} label={isUr ? `${grp.urduGroup} (${grp.group})` : grp.group}>
                      {grpTrades.map((t) => (
                        <option key={t.id} value={t.id}>
                          {isUr && t.urduName ? `${t.urduName} (${t.name})` : `${t.name}${t.urduName ? ` (${t.urduName})` : ''}`}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#17251E] mb-1">
                {bi('Years of Practical Experience', 'عملی تجربے کے سال')}
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={yearsExperience}
                onChange={(e) => setYearsExperience(Number(e.target.value))}
                className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#17251E] mb-1.5">
              {bi('Profile Picture (Upload or URL)', 'پروفائل تصویر (اپ لوڈ یا لنک)')}
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={bi('Profile preview', 'پروفائل تصویر')}
                  referrerPolicy="no-referrer"
                  className="h-12 w-12 rounded-xl object-cover border border-[#B8E4C7] shrink-0"
                />
              ) : null}
              <input
                type="text"
                value={avatarUrl.startsWith('data:image/') ? '' : avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="/images/trade_electrician_1795340853927.jpg"
                className="flex-1 rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
              />
              <label className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-[#B8E4C7] bg-[#DDF3E4]/60 px-3.5 py-2 text-xs font-semibold text-[#176B4A] hover:bg-[#DDF3E4] whitespace-nowrap">
                <span>{bi('Upload Photo', 'تصویر اپ لوڈ کریں')}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarFile} className="hidden" />
              </label>
              {avatarUrl ? (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="rounded-xl border border-[#E5EEE8] px-3 py-2 text-xs font-medium text-[#78857D] hover:text-red-600"
                >
                  {bi('Remove', 'ہٹائیں')}
                </button>
              ) : null}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-[#17251E]">
                {bi('Short Professional Biography', 'مختصر پیشہ ورانہ تعارف')}
              </label>
              <VoiceMicButton
                onTranscript={(spoken) =>
                  setBio((prev) => (prev.trim() ? `${prev.trim()} ${spoken}` : spoken))
                }
              />
            </div>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={bi(
                'Describe the practical installations, repairs, and tools you handle (or tap Speak)...',
                'اپنے عملی کام، مرمت اور جن اوزاروں پر عبور رکھتے ہیں ان کی تفصیل لکھیں یا مائیک سے بولیں...'
              )}
              className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-[#17251E]">
                {bi('Skills (Comma-separated)', 'مہارتیں (کوما سے الگ کریں)')}
              </label>
              <VoiceMicButton
                onTranscript={(spoken) =>
                  setSkillsText((prev) => (prev.trim() ? `${prev.trim()}, ${spoken}` : spoken))
                }
              />
            </div>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder={bi(
                'Distribution Board Setup, Conduit Wiring, Multimeter Diagnostics',
                'ڈسٹری بیوشن بورڈ، کُنڈوٹ وائرنگ، ملٹی میٹر تشخیص'
              )}
              className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="border-t border-[#E5EEE8] pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#17251E]">
                {bi('Supporting Certificates (Optional)', 'معاون اسناد (اختیاری)')}
              </label>
              <button
                type="button"
                onClick={() => setCertificates([...certificates, { title: '', issuer: '', year: '2025' }])}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#176B4A] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                {bi('Add Certificate', 'سند شامل کریں')}
              </button>
            </div>
            <div className="space-y-2">
              {certificates.map((cert, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    placeholder={bi('Certificate title', 'سند کا عنوان')}
                    value={cert.title}
                    onChange={(e) => {
                      const next = [...certificates];
                      next[idx].title = e.target.value;
                      setCertificates(next);
                    }}
                    className="sm:col-span-5 rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder={bi('Issuing center', 'ادارہ')}
                    value={cert.issuer}
                    onChange={(e) => {
                      const next = [...certificates];
                      next[idx].issuer = e.target.value;
                      setCertificates(next);
                    }}
                    className="sm:col-span-4 rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder={bi('Year', 'سال')}
                    value={cert.year}
                    onChange={(e) => {
                      const next = [...certificates];
                      next[idx].year = e.target.value;
                      setCertificates(next);
                    }}
                    className="sm:col-span-2 rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setCertificates(certificates.filter((_, i) => i !== idx))}
                    className="sm:col-span-1 text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 border-t border-[#E5EEE8] pt-4 text-sm">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isFemaleProfessional}
                onChange={(e) => setIsFemaleProfessional(e.target.checked)}
                className="h-4 w-4 rounded border-[#B8E4C7] accent-[#176B4A]"
              />
              <span>
                {bi(
                  'Female professional (appear in Women-Safe Services home & family filters)',
                  'خاتون پیشہ ور (خواتین اور فیملی کے لیے محفوظ سروسز فلٹر میں شامل ہوں)'
                )}
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-[#B8E4C7] accent-[#176B4A]"
              />
              <span>{bi('Make my skills portfolio publicly searchable by customers & employers', 'میرا ہنر پورٹ فولیو گاہکوں اور آجروں کے لیے تلاش کے قابل بنائیں')}</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showCertificates}
                onChange={(e) => setShowCertificates(e.target.checked)}
                className="h-4 w-4 rounded border-[#B8E4C7] accent-[#176B4A]"
              />
              <span>{bi('Display optional supporting certificates on my public portfolio', 'عوامی پورٹ فولیو پر معاون اسناد دکھائیں')}</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#176B4A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
            >
              {saving ? bi('Saving...', 'محفوظ ہو رہا ہے...') : bi('Save Profile', 'پروفائل محفوظ کریں')}
            </button>
            <Link
              to="/worker/profile"
              className="rounded-full border border-[#E5EEE8] px-5 py-2.5 text-sm font-semibold text-[#17251E] hover:bg-[#F7FAF8]"
            >
              {bi('Cancel', 'منسوخ کریں')}
            </Link>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}

export function WorkerTradesPage() {
  const [trades, setTrades] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [query, setQuery] = useState('');
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const { bi, isUr } = useI18n();

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, wRes] = await Promise.all([api.get('/public/trades'), api.get('/workers/me')]);
      setTrades(tRes.data.data || []);
      setProfile(wRes.data.data);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSelectTrade = async (tradeId: string) => {
    if (!profile) return;
    setSelecting(tradeId);
    try {
      await api.put('/workers/me', {
        fullName: profile.fullName,
        city: profile.city,
        phone: profile.phone,
        selectedTradeId: tradeId,
        yearsExperience: profile.yearsExperience,
        bio: profile.bio,
        skills: profile.skills,
        certificates: profile.certificates,
        showCertificates: profile.showCertificates,
        isPublic: profile.isPublic,
        isFemaleProfessional: profile.isFemaleProfessional,
      });
      await refreshUser();
      await load();
      showToast(
        bi(
          'Active service category updated. Open Competency Matrix to view your checklist.',
          'فعال شعبہ اپ ڈیٹ ہو گیا۔ فہرست دیکھنے کے لیے مہارتوں کا صفحہ کھولیں۔'
        ),
        'success'
      );
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSelecting('');
    }
  };

  const groupedSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SERVICE_GROUPS.filter((g) => !groupFilter || g.group === groupFilter)
      .map((grp) => ({
        ...grp,
        items: trades.filter((t) => {
          const sameGroup = (t.group || 'Home Repair & Maintenance') === grp.group;
          if (!sameGroup) return false;
          if (!q) return true;
          return (
            t.name.toLowerCase().includes(q) ||
            (t.urduName || '').toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q)
          );
        }),
      }))
      .filter((s) => s.items.length > 0);
  }, [trades, groupFilter, query]);

  return (
    <DashboardLayout title={bi('Service Categories & My Trade', 'سروس شعبے اور میرا ہنر')}>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl kc-glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-[#78857D]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={bi('Search across 48+ categories (Electrician, Mehndi, AC Tech, Chef)...', '۴۸+ شعبوں میں تلاش کریں (الیکٹریشن، مہندی، اے سی ٹیکنیشن)...')}
                className="w-full rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] ps-9 pe-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
              />
            </div>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="rounded-xl border border-[#E5EEE8] bg-[#F7FAF8] px-3 py-2 text-sm"
            >
              <option value="">{bi('All 8 Service Groups', 'تمام ۸ سروس گروپس')}</option>
              {SERVICE_GROUPS.map((g) => (
                <option key={g.group} value={g.group}>
                  {isUr ? g.urduGroup : g.group}
                </option>
              ))}
            </select>
          </div>

          {groupedSections.map((section) => (
            <div key={section.group} className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5EEE8] pb-2">
                <h2 className="text-base font-extrabold text-[#17251E]">
                  {isUr ? `${section.urduGroup} (${section.group})` : section.group}
                </h2>
                <span className="text-xs font-semibold text-[#78857D] tabular-nums">
                  {section.items.length} {bi('categories', 'شعبے')}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {section.items.map((t) => {
                  const isSelected = profile?.selectedTradeId === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`flex flex-col justify-between rounded-2xl kc-glass-card kc-hover-lift p-5 ${
                        isSelected ? 'border-[#176B4A] ring-1 ring-[#399B6B]' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-bold text-[#17251E]">
                            {isUr && t.urduName ? t.urduName : t.name}
                          </h3>
                          <span className="text-xs text-[#78857D]">{isUr ? t.name : t.urduName}</span>
                        </div>
                        <p className="mt-1.5 text-xs text-[#78857D] leading-relaxed">{t.description}</p>
                        <p className="mt-3 text-xs font-bold text-[#176B4A]">
                          {t.competencies?.length || 0} {bi('Core Competencies', 'بنیادی مہارتیں')}
                        </p>
                        <ul className="mt-1.5 space-y-1 text-xs text-[#78857D]">
                          {(t.competencies || []).slice(0, 3).map((c: any) => (
                            <li key={c.id} className="truncate">
                              • {isUr && c.urduTitle ? c.urduTitle : c.title}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-5 pt-3 border-t border-[#E5EEE8]">
                        {isSelected ? (
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#176B4A]">
                              <CheckCircle2 className="h-4 w-4 text-[#399B6B]" />
                              {bi('Active Category', 'فعال شعبہ')}
                            </span>
                            <Link to="/worker/matrix" className="text-xs font-semibold text-[#176B4A] hover:underline">
                              {bi('Open Matrix →', 'فہرست کھولیں ←')}
                            </Link>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={Boolean(selecting)}
                            onClick={() => handleSelectTrade(t.id)}
                            className="w-full rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
                          >
                            {selecting === t.id
                              ? bi('Updating...', 'اپ ڈیٹ ہو رہا ہے...')
                              : bi(`Select ${t.name}`, `${t.urduName || t.name} منتخب کریں`)}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export function WorkerPrivacyPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const { bi } = useI18n();

  useEffect(() => {
    api
      .get('/workers/me')
      .then((res) => setProfile(res.data.data))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, []);

  const updatePrivacy = async (isPublic: boolean, showCertificates: boolean) => {
    if (!profile) return;
    setSaving(true);
    try {
      await api.put('/workers/me', {
        fullName: profile.fullName,
        city: profile.city,
        phone: profile.phone,
        selectedTradeId: profile.selectedTradeId,
        yearsExperience: profile.yearsExperience,
        bio: profile.bio,
        skills: profile.skills,
        certificates: profile.certificates,
        showCertificates,
        isPublic,
        isFemaleProfessional: profile.isFemaleProfessional,
      });
      setProfile({ ...profile, isPublic, showCertificates });
      showToast(bi('Privacy settings updated.', 'رازداری کی ترتیبات محفوظ ہو گئیں۔'), 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title={bi('Privacy Settings', 'رازداری کی ترتیبات')}>
      {loading ? (
        <LoadingSkeleton rows={3} />
      ) : !profile ? null : (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-2xl kc-glass-card p-6 space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF3E4] text-[#176B4A] shrink-0">
                <Lock className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-[#17251E]">
                  {bi('Portfolio & Contact Privacy Controls', 'پورٹ فولیو اور رابطے کی رازداری')}
                </h2>
                <p className="mt-1 text-sm text-[#78857D]">
                  {bi(
                    'Your private phone number, email address, and raw evidence files are never exposed publicly. Customers and employers only receive your phone and email after you accept their job booking or contact request.',
                    'آپ کا ذاتی فون نمبر، ای میل اور اپ لوڈ کردہ فائلیں عوامی طور پر ظاہر نہیں ہوتیں۔ گاہکوں کو فون اور ای میل صرف آپ کی منظوری کے بعد ملتا ہے۔'
                  )}
                </p>
              </div>
            </div>

            <div className="border-t border-[#E5EEE8] pt-4 space-y-4">
              <label className="flex items-start justify-between gap-4 cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-[#17251E]">
                    {bi('Public Portfolio Searchability', 'عوامی پورٹ فولیو کی تلاش')}
                  </p>
                  <p className="text-xs text-[#78857D]">
                    {bi(
                      'Allow customers and employers to find your profile and view verified badges.',
                      'گاہکوں اور آجروں کو اپنا پروفائل اور تصدیق شدہ بیج دیکھنے کی اجازت دیں۔'
                    )}
                  </p>
                </div>
                <input
                  type="checkbox"
                  disabled={saving}
                  checked={profile.isPublic}
                  onChange={(e) => updatePrivacy(e.target.checked, profile.showCertificates)}
                  className="h-5 w-5 rounded border-[#B8E4C7] accent-[#176B4A]"
                />
              </label>

              <label className="flex items-start justify-between gap-4 cursor-pointer border-t border-[#E5EEE8] pt-4">
                <div>
                  <p className="text-sm font-semibold text-[#17251E]">
                    {bi('Show Supporting Certificates', 'معاون اسناد ظاہر کریں')}
                  </p>
                  <p className="text-xs text-[#78857D]">
                    {bi(
                      'Include optional training certificates on your public portfolio page.',
                      'اپنے عوامی پورٹ فولیو صفحے پر اختیاری تربیتی اسناد شامل کریں۔'
                    )}
                  </p>
                </div>
                <input
                  type="checkbox"
                  disabled={saving}
                  checked={profile.showCertificates}
                  onChange={(e) => updatePrivacy(profile.isPublic, e.target.checked)}
                  className="h-5 w-5 rounded border-[#B8E4C7] accent-[#176B4A]"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
