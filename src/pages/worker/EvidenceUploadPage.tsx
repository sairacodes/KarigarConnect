import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileVideo, Image as ImageIcon, Lock, Send, Trash2, Upload } from 'lucide-react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ConfirmDialog, EmptyState, LoadingSkeleton, StatusLabel, formatDate } from '../../components/ui/Components';
import { useToast } from '../../context/ToastContext';
import { api, getApiErrorMessage } from '../../services/api';
import { useI18n } from '../../i18n/translations';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

export function EvidenceUploadPage() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { bi, lang, isUr } = useI18n();

  const [competencies, setCompetencies] = useState<any[]>([]);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [competencyId, setCompetencyId] = useState(searchParams.get('competencyId') || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compRes, evRes] = await Promise.all([
        api.get('/workers/me/competencies'),
        api.get('/workers/me/evidence'),
      ]);
      const comps = compRes.data.data.competencies || [];
      setCompetencies(comps);
      if (!competencyId && comps.length > 0) {
        setCompetencyId(comps[0].id);
      }
      setEvidenceList(evRes.data.data || []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast(bi('Image must be JPG, PNG, or WebP.', 'تصویر JPG، PNG یا WebP ہونی چاہیے۔'), 'error');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showToast(bi('Image exceeds 5 MB limit.', 'تصویر ۵ ایم بی سے زیادہ نہیں ہونی چاہیے۔'), 'error');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleVideoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
      showToast(bi('Video must be MP4, WebM, or MOV.', 'ویڈیو MP4، WebM یا MOV ہونی چاہیے۔'), 'error');
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      showToast(bi('Short video exceeds 25 MB limit.', 'مختصر ویڈیو ۲۵ ایم بی سے زیادہ نہیں ہونی چاہیے۔'), 'error');
      return;
    }
    setVideoFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competencyId) {
      showToast(bi('Please select a competency.', 'براہِ کرم مہارت منتخب کریں۔'), 'error');
      return;
    }
    if (!imageFile && !videoFile) {
      showToast(bi('Attach at least one image or short video file.', 'کم از کم ایک تصویر یا مختصر ویڈیو منتخب کریں۔'), 'error');
      return;
    }

    const formData = new FormData();
    formData.append('competencyId', competencyId);
    formData.append('title', title);
    formData.append('description', description);
    if (imageFile) formData.append('files', imageFile);
    if (videoFile) formData.append('files', videoFile);

    setUploading(true);
    try {
      await api.post('/workers/me/evidence', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast(bi('Evidence uploaded securely to private storage.', 'ثبوت محفوظ پرائیویٹ اسٹوریج میں اپ لوڈ ہو گیا۔'), 'success');
      setTitle('');
      setDescription('');
      setImageFile(null);
      setVideoFile(null);
      setImagePreview(null);
      await loadData();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/workers/me/evidence/${deleteTarget.id}`);
      showToast(bi('Evidence removed.', 'ثبوت حذف کر دیا گیا۔'), 'info');
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleRequestForComp = async (compId: string) => {
    try {
      await api.post('/workers/me/verification-requests', { competencyIds: [compId] });
      showToast(bi('Verification request submitted to assessor queue.', 'تصدیق کی درخواست ماہرین کی قطار میں جمع ہو گئی۔'), 'success');
      await loadData();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <DashboardLayout title={bi('Evidence Upload', 'ثبوت اپ لوڈ')}>
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : competencies.length === 0 ? (
        <EmptyState
          title={bi('Select a Trade First', 'پہلے پیشہ منتخب کریں')}
          description={bi(
            'You need an active trade before uploading practical skill evidence.',
            'عملی ہنر کا ثبوت اپ لوڈ کرنے سے پہلے اپنا پیشہ منتخب کریں۔'
          )}
          action={
            <Link to="/worker/trades" className="rounded-full bg-[#176B4A] px-5 py-2.5 text-sm font-semibold text-white">
              {bi('Select Trade', 'پیشہ منتخب کریں')}
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Upload Form */}
          <form onSubmit={handleUpload} className="lg:col-span-5 rounded-2xl kc-glass-card p-6 space-y-4 h-fit">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECE6D7] text-[#176B4A] shrink-0">
                <Lock className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-bold text-[#17251E]">
                  {bi('Upload Private Practical Evidence', 'نجی عملی ثبوت اپ لوڈ کریں')}
                </h2>
                <p className="text-xs text-[#69726B]">
                  {bi(
                    "Files are saved locally in your browser's private IndexedDB file store and shown only in worker and assessor review views.",
                    'فائلیں براؤزر کی پرائیویٹ اسٹوریج میں محفوظ رہتی ہیں اور صرف ہنرمند اور ماہرِ جائزہ دیکھ سکتے ہیں۔'
                  )}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#17251E] mb-1">{bi('Competency', 'مہارت')}</label>
              <select
                value={competencyId}
                onChange={(e) => setCompetencyId(e.target.value)}
                required
                className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
              >
                {competencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isUr && c.urduTitle ? c.urduTitle : c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#17251E] mb-1">{bi('Evidence Title', 'ثبوت کا عنوان')}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder={bi('e.g. Copper termination in 6-way breaker box', 'مثلاً ۶ وے بریکر باکس کی کاپر وائرنگ')}
                className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#17251E] mb-1">
                {bi('What This Demonstrates', 'اس ثبوت کی تفصیل')}
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder={bi(
                  'Describe tools used, safety precautions taken, and finished work...',
                  'استعمال شدہ اوزار، حفاظتی احتیاطی تدابیر اور مکمل کام کی وضاحت لکھیں...'
                )}
                className="w-full rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] px-3 py-2 text-sm focus:border-[#399B6B] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#17251E] mb-1">
                  {bi('Photo Evidence (JPG/PNG/WebP · max 5 MB)', 'تصویری ثبوت (JPG/PNG/WebP · زیادہ سے زیادہ ۵ ایم بی)')}
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#D8D0BE] bg-[#F7F4EC] px-4 py-3 text-xs font-semibold text-[#17251E] hover:bg-[#ECE6D7]/50 transition-colors">
                  <ImageIcon className="h-4 w-4 text-[#176B4A]" />
                  <span>{imageFile ? imageFile.name : bi('Choose Photo', 'تصویر منتخب کریں')}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImagePick} className="hidden" />
                </label>
                {imagePreview && (
                  <img src={imagePreview} alt={bi('Selected preview', 'منتخب تصویر')} className="mt-2 h-32 w-full rounded-xl object-cover border border-[#E6E0D2]" />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17251E] mb-1">
                  {bi('Optional Short Video (1 video max · MP4/WebM/MOV · max 25 MB)', 'اختیاری مختصر ویڈیو (زیادہ سے زیادہ ۲۵ ایم بی)')}
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#E6E0D2] bg-[#F7F4EC] px-4 py-3 text-xs font-medium text-[#69726B] hover:bg-[#ECE6D7]/40 hover:text-[#17251E] transition-colors">
                  <FileVideo className="h-4 w-4 text-[#399B6B]" />
                  <span>{videoFile ? videoFile.name : bi('Attach Optional Short Video', 'مختصر ویڈیو منسلک کریں')}</span>
                  <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoPick} className="hidden" />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#176B4A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#13563B] disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              <span>{uploading ? bi('Uploading Securely...', 'اپ لوڈ ہو رہا ہے...') : bi('Upload Evidence', 'ثبوت اپ لوڈ کریں')}</span>
            </button>
          </form>

          {/* Uploaded Evidence List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#17251E]">
                {bi('My Private Evidence Library', 'میری نجی ثبوت لائبریری')} ({evidenceList.length})
              </h2>
              {competencyId && evidenceList.some((e) => e.competencyId === competencyId) && (
                <button
                  type="button"
                  onClick={() => handleRequestForComp(competencyId)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B]"
                >
                  <Send className="h-3.5 w-3.5 rtl:-scale-x-100" />
                  {bi('Request Verification for Selected', 'منتخب مہارت کی تصدیق طلب کریں')}
                </button>
              )}
            </div>

            {evidenceList.length === 0 ? (
              <EmptyState
                title={bi('No evidence uploaded yet', 'ابھی کوئی ثبوت اپ لوڈ نہیں ہوا')}
                description={bi(
                  'Upload photos or a short demonstration video of your work to request assessor verification.',
                  'ماہرین سے تصدیق کے لیے اپنے کام کی تصاویر یا مختصر ویڈیو اپ لوڈ کریں۔'
                )}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {evidenceList.map((ev) => (
                  <div key={ev.id} className="rounded-2xl kc-glass-card kc-hover-lift overflow-hidden flex flex-col">
                    <div className="h-44 bg-[#ECE6D7]/40 relative">
                      {ev.fileType === 'VIDEO' ? (
                        <video src={ev.signedUrl} controls className="h-full w-full object-cover" />
                      ) : (
                        <img
                          src={ev.signedUrl}
                          alt={ev.title}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-[#399B6B]">{ev.competencyTitle}</p>
                          <StatusLabel status={ev.status} />
                        </div>
                        <h3 className="mt-1 text-sm font-bold text-[#17251E]">{ev.title}</h3>
                        <p className="mt-1 text-xs text-[#69726B] line-clamp-2">{ev.description}</p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#E6E0D2] flex items-center justify-between text-xs text-[#69726B]">
                        <span className="font-mono">{formatDate(ev.createdAt, lang)}</span>
                        {ev.status !== 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(ev)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {bi('Delete', 'حذف کریں')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={bi('Delete Evidence File', 'ثبوت کی فائل حذف کریں')}
        message={bi(
          `Remove "${deleteTarget?.title}" from your private evidence library?`,
          `کیا آپ "${deleteTarget?.title}" کو اپنی نجی لائبریری سے حذف کرنا چاہتے ہیں؟`
        )}
        confirmLabel={bi('Delete', 'حذف کریں')}
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
