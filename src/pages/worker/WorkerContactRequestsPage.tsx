import React, { useEffect, useState } from 'react';
import { Check, Lock, X } from 'lucide-react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ConfirmDialog, EmptyState, LoadingSkeleton, StatusLabel, formatDate } from '../../components/ui/Components';
import { useToast } from '../../context/ToastContext';
import { api, getApiErrorMessage } from '../../services/api';
import { useI18n } from '../../i18n/translations';

export function WorkerContactRequestsPage() {
  const { showToast } = useToast();
  const { bi, lang } = useI18n();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ item: any; status: 'ACCEPTED' | 'DECLINED' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/contact-requests')
      .then((res) => setRequests(res.data.data || []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleRespond = async () => {
    if (!confirmAction) return;
    setSubmitting(true);
    try {
      await api.patch(`/contact-requests/${confirmAction.item.id}`, { status: confirmAction.status });
      showToast(
        confirmAction.status === 'ACCEPTED'
          ? bi('Contact request accepted.', 'رابطہ کی درخواست قبول کر لی گئی۔')
          : bi('Contact request declined.', 'رابطہ کی درخواست مسترد کر دی گئی۔'),
        'success'
      );
      setConfirmAction(null);
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title={bi('Contact Requests', 'رابطے کی درخواستیں')}>
      <div className="mb-5 rounded-2xl kc-glass-mint p-4 flex items-center gap-3 text-sm text-[#17251E]">
        <Lock className="h-4 w-4 text-[#176B4A] shrink-0" />
        <span>
          {bi(
            'Your phone number and email remain hidden from every employer unless you click Accept.',
            'جب تک آپ قبول نہ کریں، آپ کا فون نمبر اور ای میل ہر آجِر سے پوشیدہ رہتا ہے۔'
          )}
        </span>
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : requests.length === 0 ? (
        <EmptyState
          title={bi('No contact requests yet', 'ابھی کوئی رابطہ درخواست موصول نہیں ہوئی')}
          description={bi(
            'When an employer views your public portfolio and wants to reach out, their request will appear here.',
            'جب کوئی آجِر آپ کا عوامی پورٹ فولیو دیکھ کر رابطہ کرنا چاہے گا تو درخواست یہاں نظر آئے گی۔'
          )}
        />
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl kc-glass-card kc-hover-lift p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#17251E]">{r.companyName}</h3>
                  <p className="text-xs text-[#69726B]">
                    {r.employerName} · {r.industry || bi('Employer', 'آجِر')} · {r.city} · {bi('Received', 'موصول')}{' '}
                    {formatDate(r.createdAt, lang)}
                  </p>
                </div>
                <StatusLabel status={r.status} />
              </div>

              {r.message && (
                <p className="mt-3 rounded-xl border border-[#E6E0D2] bg-[#F7F4EC] p-3 text-sm text-[#17251E]">
                  “{r.message}”
                </p>
              )}

              {r.status === 'ACCEPTED' && r.employerContact && (
                <p className="mt-3 text-xs font-semibold text-[#176B4A]">
                  {bi('Employer Contact:', 'آجِر کا رابطہ:')} {r.employerContact.phone} · {r.employerContact.email}
                </p>
              )}

              {r.status === 'PENDING' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmAction({ item: r, status: 'ACCEPTED' })}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#176B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13563B]"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {bi('Accept & Share Contact', 'قبول کریں اور رابطہ شیئر کریں')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAction({ item: r, status: 'DECLINED' })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#E6E0D2] bg-white px-4 py-2 text-xs font-semibold text-[#17251E] hover:bg-[#F7F4EC]"
                  >
                    <X className="h-3.5 w-3.5" />
                    {bi('Decline', 'انکار کریں')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={
          confirmAction?.status === 'ACCEPTED'
            ? bi('Share Contact Details?', 'رابطے کی تفصیلات شیئر کریں؟')
            : bi('Decline Contact Request?', 'رابطہ درخواست مسترد کریں؟')
        }
        message={
          confirmAction?.status === 'ACCEPTED'
            ? bi(
                `Accepting will allow ${confirmAction.item.companyName} to view your phone number and email address.`,
                `قبول کرنے سے ${confirmAction.item.companyName} آپ کا فون نمبر اور ای میل دیکھ سکے گا۔`
              )
            : bi(
                `Decline contact request from ${confirmAction?.item.companyName}? Your contact details will stay hidden.`,
                `کیا آپ ${confirmAction?.item.companyName} کی رابطہ درخواست مسترد کرنا چاہتے ہیں؟ آپ کی تفصیلات پوشیدہ رہیں گی۔`
              )
        }
        confirmLabel={
          confirmAction?.status === 'ACCEPTED'
            ? bi('Accept & Share', 'قبول اور شیئر کریں')
            : bi('Decline', 'انکار کریں')
        }
        destructive={confirmAction?.status === 'DECLINED'}
        loading={submitting}
        onConfirm={handleRespond}
        onCancel={() => setConfirmAction(null)}
      />
    </DashboardLayout>
  );
}
