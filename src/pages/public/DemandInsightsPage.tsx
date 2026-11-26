import React from 'react';
import { PublicLayout } from '../../components/layouts/PublicLayout';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { PageTransition } from '../../components/ui/MotionPrimitives';
import { SkillDemandInsightsSection } from '../../components/analytics/SkillDemandInsightsSection';
import { useI18n } from '../../i18n/translations';

export function PublicDemandInsightsPage() {
  return (
    <PublicLayout>
      <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <SkillDemandInsightsSection />
      </PageTransition>
    </PublicLayout>
  );
}

export function DashboardDemandInsightsPage() {
  const { bi } = useI18n();
  return (
    <DashboardLayout title={bi('Skill Demand Insights', 'اسکل ڈیمانڈ بصیرت')}>
      <SkillDemandInsightsSection />
    </DashboardLayout>
  );
}
