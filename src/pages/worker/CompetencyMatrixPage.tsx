import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderUp, Send, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import {
  ConfirmDialog,
  EmptyState,
  LoadingSkeleton,
  StatusLabel,
  formatDate,
  formatLevelLabel,
} from '../../components/ui/Components';
import { useToast } from '../../context/ToastContext';
import { api, getApiErrorMessage } from '../../services/api';
import { useI18n } from '../../i18n/translations';

export function CompetencyMatrixPage() {
  const { showToast } = useToast();
  const { bi, lang, isUr, statusText } = useI18n();
  const [trade, setTrade] = useState<any>(null);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComp, setSelectedComp] = useState<any>(null);
  const [confirmRequestComp, setConfirmRequestComp] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadMatrix = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workers/me/competencies');
      setTrade(res.data.data.trade);
      setCompetencies(res.data.data.competencies || []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, []);

  const handleRequestVerification = async () => {
    if (!confirmRequestComp) return;
    setSubmitting(true);
    try {
      await api.post('/workers/me/verification-requests', {
        competencyIds: [confirmRequestComp.id],
      });
      showToast(
        bi(
          `Verification requested for "${confirmRequestComp.title}".`,
          `"${confirmRequestComp.urduTitle || confirmRequestComp.title}" کی تصدیق کی درخواست بھیج دی گئی۔`
        ),
        'success'
      );
      setConfirmRequestComp(null);
      await loadMatrix();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title={bi('Competency Matrix', 'مہارتوں کی فہرست')}>
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : !trade ? (
        <EmptyState
          title={bi('No Trade Selected Yet', 'ابھی کوئی پیشہ منتخب نہیں کیا گیا')}
          description={bi(
            'Select Electrician, Carpenter, or Mechanic to unlock your practical competency checklist.',
            'اپنی عملی مہارتوں کی فہرست کھولنے کے لیے الیکٹریشن، کارپینٹر یا مکینک منتخب کریں۔'
          )}
          action={
            <Link to="/worker/trades" className="rounded-full bg-[#176B4A] px-5 py-2.5 text-sm font-semibold text-white">
              {bi('Choose Your Trade', 'اپنا پیشہ منتخب کریں')}
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#D8D0BE] bg-gradient-to-r from-white/95 to-[#ECE6D7]/70 backdrop-blur-md p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 kc-card-shadow">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#399B6B]">
                {bi('Active Trade Checklist', 'فعال پیشے کی فہرست')}
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-[#17251E]">
                {isUr && trade.urduName ? trade.urduName : trade.name}{' '}
                {!isUr && trade.urduName ? <span className="font-normal text-[#69726B]">· {trade.urduName}</span> : null}
              </h2>
              <p className="mt-1 text-sm text-[#69726B]">{trade.description}</p>
            </div>
            <Link
              to="/worker/evidence"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#176B4A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#13563B] whitespace-nowrap shrink-0"
            >
              <FolderUp className="h-4 w-4" />
              {bi('Upload Evidence', 'ثبوت اپ لوڈ کریں')}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {competencies.map((comp) => {
              const canRequest =
                comp.evidenceCount > 0 &&
                ['EVIDENCE_ADDED', 'NEEDS_MORE_EVIDENCE', 'EXPIRED'].includes(comp.matrixStatus);

              return (
                <div
                  key={comp.id}
                  className="rounded-2xl kc-glass-card kc-hover-lift p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-[#17251E]">
                          {isUr && comp.urduTitle ? comp.urduTitle : comp.title}
                        </h3>
                        {!isUr && comp.urduTitle && <p className="text-xs text-[#69726B]">{comp.urduTitle}</p>}
                      </div>
                      <StatusLabel status={comp.matrixStatus} />
                    </div>
                    <p className="mt-2 text-sm text-[#69726B]">{comp.description}</p>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#E6E0D2] pt-3 text-xs">
                      <div>
                        <span className="text-[#69726B]">{bi('Private Evidence', 'نجی ثبوت')}</span>
                        <p className="font-mono font-semibold text-[#17251E] tabular-nums">
                          {comp.evidenceCount} {bi('file(s)', 'فائل')}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#69726B]">{bi('Verification Level', 'تصدیقی درجہ')}</span>
                        <p className="font-semibold text-[#17251E]">
                          {comp.badge
                            ? formatLevelLabel(comp.badge.level, lang)
                            : comp.latestAssessment?.percentage != null
                              ? `${comp.latestAssessment.percentage}%`
                              : '—'}
                        </p>
                      </div>
                      {comp.badge && (
                        <div className="col-span-2">
                          <span className="text-[#69726B]">{bi('Badge Expiry:', 'بیج کی معیاد:')} </span>
                          <span className="font-mono text-[#176B4A] font-medium">{formatDate(comp.badge.expiresAt, lang)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E6E0D2] flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedComp(comp)}
                      className="rounded-full border border-[#E6E0D2] bg-[#F7F4EC] px-3.5 py-2 text-xs font-semibold text-[#17251E] hover:bg-[#ECE6D7]/50"
                    >
                      {bi('View Details', 'تفصیل دیکھیں')}
                    </button>
                    <Link
                      to={`/worker/evidence?competencyId=${comp.id}`}
                      className="rounded-full border border-[#E6E0D2] bg-[#F7F4EC] px-3.5 py-2 text-xs font-semibold text-[#17251E] hover:bg-[#ECE6D7]/50"
                    >
                      {bi('Add Evidence', 'ثبوت شامل کریں')}
                    </Link>
                    {canRequest && (
                      <button
                        type="button"
                        onClick={() => setConfirmRequestComp(comp)}
                        className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B]"
                      >
                        <Send className="h-3.5 w-3.5 rtl:-scale-x-100" />
                        {bi('Request Verification', 'تصدیق کی درخواست')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Competency Detail Modal */}
      {selectedComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251E]/45 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-lg rounded-2xl kc-glass-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-[#17251E]">
                  {isUr && selectedComp.urduTitle ? selectedComp.urduTitle : selectedComp.title}
                </h3>
                {!isUr && selectedComp.urduTitle && <p className="text-xs text-[#69726B]">{selectedComp.urduTitle}</p>}
              </div>
              <StatusLabel status={selectedComp.matrixStatus} />
            </div>
            <p className="mt-3 text-sm text-[#69726B]">{selectedComp.description}</p>

            {selectedComp.latestAssessment && (
              <div className="mt-4 rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] p-4 text-sm space-y-1.5">
                <p className="font-bold text-[#17251E]">{bi('Latest Assessment Result', 'تازہ ترین جائزے کا نتیجہ')}</p>
                <p className="text-xs text-[#69726B]">
                  {bi('Outcome:', 'نتیجہ:')}{' '}
                  <span className="font-semibold text-[#17251E]">{statusText(selectedComp.latestAssessment.status)}</span>
                  {selectedComp.latestAssessment.percentage != null && ` · ${bi('Score:', 'اسکور:')} ${selectedComp.latestAssessment.percentage}%`}
                </p>
                {selectedComp.latestAssessment.assessorName && (
                  <p className="text-xs text-[#69726B]">
                    {bi('Assessor:', 'ماہرِ جائزہ:')} {selectedComp.latestAssessment.assessorName}
                  </p>
                )}
                {selectedComp.latestAssessment.feedback && (
                  <p className="text-xs text-[#17251E] mt-1">
                    {bi('Feedback:', 'رائے:')} “{selectedComp.latestAssessment.feedback}”
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedComp(null)}
                className="rounded-full border border-[#E6E0D2] px-4 py-2 text-sm font-semibold text-[#17251E] hover:bg-[#F7F4EC]"
              >
                {bi('Close', 'بند کریں')}
              </button>
              <Link
                to={`/worker/evidence?competencyId=${selectedComp.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#13563B]"
              >
                <ShieldCheck className="h-4 w-4" />
                {bi('Manage Evidence', 'ثبوت سنبھالیں')}
              </Link>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmRequestComp)}
        title={bi('Submit Verification Request', 'تصدیقی درخواست جمع کرائیں')}
        message={bi(
          `Send your uploaded evidence for "${confirmRequestComp?.title}" to approved ${trade?.name} assessors for rubric scoring?`,
          `کیا آپ "${confirmRequestComp?.urduTitle || confirmRequestComp?.title}" کے اپ لوڈ کردہ ثبوت منظور شدہ ماہرین کو جانچ کے لیے بھیجنا چاہتے ہیں؟`
        )}
        confirmLabel={bi('Submit to Assessor Queue', 'ماہرین کو بھیجیں')}
        loading={submitting}
        onConfirm={handleRequestVerification}
        onCancel={() => setConfirmRequestComp(null)}
      />
    </DashboardLayout>
  );
}
