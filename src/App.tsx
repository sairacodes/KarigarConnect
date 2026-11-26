import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { AboutPage, HowItWorksPage, LegalPage } from './pages/public/InfoPages';
import { ExploreWorkersPage } from './pages/public/ExploreWorkersPage';
import { PublicPortfolioPage } from './pages/public/PublicPortfolioPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { RoleSelectionPage } from './pages/public/RoleSelectionPage';
import { DashboardDemandInsightsPage, PublicDemandInsightsPage } from './pages/public/DemandInsightsPage';
import {
  TrustScoreGuidePage,
  VerifyBadgePage,
  WhyKarigarConnectPage,
} from './pages/public/TrustAndFinderPages';

// Worker Pages
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import {
  WorkerEditProfilePage,
  WorkerPrivacyPage,
  WorkerProfilePage,
  WorkerTradesPage,
} from './pages/worker/WorkerProfilePages';
import { CompetencyMatrixPage } from './pages/worker/CompetencyMatrixPage';
import { EvidenceUploadPage } from './pages/worker/EvidenceUploadPage';
import { MyAssessmentsPage, MyBadgesPage } from './pages/worker/MyAssessmentsAndBadges';
import { WorkerContactRequestsPage } from './pages/worker/WorkerContactRequestsPage';
import { WorkerGrowthPage, WorkerJobsPage } from './pages/worker/WorkerJobsAndGrowthPages';

// Customer / Employer Pages
import {
  EmployerContactRequestsPage,
  EmployerDashboard,
  EmployerProfilePage,
  EmployerWorkerViewPage,
  MyShortlistPage,
  SearchWorkersPage,
} from './pages/employer/EmployerPages';
import { CustomerJobsPage } from './pages/employer/CustomerJobsPage';

// Assessor Pages
import {
  AssessorApplicationPage,
  AssessorDashboard,
  AssessorProfilePage,
  CompletedAssessmentsPage,
  EvidenceReviewPage,
  VerificationQueuePage,
} from './pages/assessor/AssessorPages';

// Admin Pages
import {
  AdminDashboard,
  AssessorApplicationsPage,
  AuditLogsPage,
  CompetencyManagementPage,
  ReportsModerationPage,
  TradeManagementPage,
  UserManagementPage,
} from './pages/admin/AdminPages';
import {
  AdminDisputesPage,
  AdminTierQueuePage,
  AdminTierRulesPage,
} from './pages/admin/AdminGovernancePages';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/why-karigar-connect" element={<WhyKarigarConnectPage />} />
              <Route path="/trust-score" element={<TrustScoreGuidePage />} />
              <Route path="/verify-badge" element={<VerifyBadgePage />} />
              <Route path="/demand-insights" element={<PublicDemandInsightsPage />} />
              <Route path="/explore" element={<ExploreWorkersPage />} />
              <Route path="/workers/:publicId" element={<PublicPortfolioPage />} />
              <Route path="/select-role" element={<RoleSelectionPage />} />
              <Route path="/get-started" element={<RoleSelectionPage defaultMode="register" />} />
              <Route path="/login" element={<RoleSelectionPage defaultMode="login" />} />
              <Route path="/login/karigar" element={<LoginPage portalRole="WORKER" />} />
              <Route path="/login/hirer" element={<LoginPage portalRole="EMPLOYER" />} />
              <Route path="/login/staff" element={<LoginPage portalRole="STAFF" />} />
              <Route path="/register" element={<RoleSelectionPage defaultMode="register" />} />
              <Route path="/register/karigar" element={<RegisterPage portalRole="WORKER" />} />
              <Route path="/register/hirer" element={<RegisterPage portalRole="EMPLOYER" />} />
              <Route path="/register/assessor" element={<RegisterPage portalRole="ASSESSOR" />} />
              <Route path="/contact" element={<LegalPage type="contact" />} />
              <Route path="/privacy" element={<LegalPage type="privacy" />} />
              <Route path="/terms" element={<LegalPage type="terms" />} />

              {/* Worker Routes */}
              <Route path="/worker/dashboard" element={<ProtectedRoute allowedRoles={['WORKER']}><WorkerDashboard /></ProtectedRoute>} />
              <Route path="/worker/jobs" element={<ProtectedRoute allowedRoles={['WORKER']}><WorkerJobsPage /></ProtectedRoute>} />
              <Route path="/worker/growth" element={<ProtectedRoute allowedRoles={['WORKER']}><WorkerGrowthPage /></ProtectedRoute>} />
              <Route path="/worker/insights" element={<ProtectedRoute allowedRoles={['WORKER']}><DashboardDemandInsightsPage /></ProtectedRoute>} />
              <Route path="/worker/profile" element={<ProtectedRoute allowedRoles={['WORKER']}><WorkerProfilePage /></ProtectedRoute>} />
              <Route path="/worker/profile/edit" element={<ProtectedRoute allowedRoles={['WORKER']}><WorkerEditProfilePage /></ProtectedRoute>} />
              <Route path="/worker/trades" element={<ProtectedRoute allowedRoles={['WORKER']}><WorkerTradesPage /></ProtectedRoute>} />
              <Route path="/worker/matrix" element={<ProtectedRoute allowedRoles={['WORKER']}><CompetencyMatrixPage /></ProtectedRoute>} />
              <Route path="/worker/evidence" element={<ProtectedRoute allowedRoles={['WORKER']}><EvidenceUploadPage /></ProtectedRoute>} />
              <Route path="/worker/assessments" element={<ProtectedRoute allowedRoles={['WORKER']}><MyAssessmentsPage /></ProtectedRoute>} />
              <Route path="/worker/badges" element={<ProtectedRoute allowedRoles={['WORKER']}><MyBadgesPage /></ProtectedRoute>} />
              <Route path="/worker/requests" element={<ProtectedRoute allowedRoles={['WORKER']}><WorkerContactRequestsPage /></ProtectedRoute>} />
              <Route path="/worker/privacy" element={<ProtectedRoute allowedRoles={['WORKER']}><WorkerPrivacyPage /></ProtectedRoute>} />

              {/* Customer / Employer Routes */}
              <Route path="/employer/dashboard" element={<ProtectedRoute allowedRoles={['EMPLOYER']}><EmployerDashboard /></ProtectedRoute>} />
              <Route path="/employer/search" element={<ProtectedRoute allowedRoles={['EMPLOYER']}><SearchWorkersPage /></ProtectedRoute>} />
              <Route path="/employer/jobs" element={<ProtectedRoute allowedRoles={['EMPLOYER']}><CustomerJobsPage /></ProtectedRoute>} />
              <Route path="/employer/insights" element={<ProtectedRoute allowedRoles={['EMPLOYER']}><DashboardDemandInsightsPage /></ProtectedRoute>} />
              <Route path="/employer/workers/:publicId" element={<ProtectedRoute allowedRoles={['EMPLOYER']}><EmployerWorkerViewPage /></ProtectedRoute>} />
              <Route path="/employer/shortlist" element={<ProtectedRoute allowedRoles={['EMPLOYER']}><MyShortlistPage /></ProtectedRoute>} />
              <Route path="/employer/requests" element={<ProtectedRoute allowedRoles={['EMPLOYER']}><EmployerContactRequestsPage /></ProtectedRoute>} />
              <Route path="/employer/profile" element={<ProtectedRoute allowedRoles={['EMPLOYER']}><EmployerProfilePage /></ProtectedRoute>} />

              {/* Assessor Routes */}
              <Route path="/assessor/dashboard" element={<ProtectedRoute allowedRoles={['ASSESSOR']}><AssessorDashboard /></ProtectedRoute>} />
              <Route path="/assessor/application" element={<ProtectedRoute allowedRoles={['ASSESSOR']}><AssessorApplicationPage /></ProtectedRoute>} />
              <Route path="/assessor/queue" element={<ProtectedRoute allowedRoles={['ASSESSOR']}><VerificationQueuePage /></ProtectedRoute>} />
              <Route path="/assessor/queue/:requestId" element={<ProtectedRoute allowedRoles={['ASSESSOR']}><EvidenceReviewPage /></ProtectedRoute>} />
              <Route path="/assessor/completed" element={<ProtectedRoute allowedRoles={['ASSESSOR']}><CompletedAssessmentsPage /></ProtectedRoute>} />
              <Route path="/assessor/insights" element={<ProtectedRoute allowedRoles={['ASSESSOR']}><DashboardDemandInsightsPage /></ProtectedRoute>} />
              <Route path="/assessor/profile" element={<ProtectedRoute allowedRoles={['ASSESSOR']}><AssessorProfilePage /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UserManagementPage /></ProtectedRoute>} />
              <Route path="/admin/assessors" element={<ProtectedRoute allowedRoles={['ADMIN']}><AssessorApplicationsPage /></ProtectedRoute>} />
              <Route path="/admin/tiers" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminTierQueuePage /></ProtectedRoute>} />
              <Route path="/admin/tier-rules" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminTierRulesPage /></ProtectedRoute>} />
              <Route path="/admin/disputes" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDisputesPage /></ProtectedRoute>} />
              <Route path="/admin/trades" element={<ProtectedRoute allowedRoles={['ADMIN']}><TradeManagementPage /></ProtectedRoute>} />
              <Route path="/admin/competencies" element={<ProtectedRoute allowedRoles={['ADMIN']}><CompetencyManagementPage /></ProtectedRoute>} />
              <Route path="/admin/insights" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardDemandInsightsPage /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><ReportsModerationPage /></ProtectedRoute>} />
              <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><AuditLogsPage /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}
