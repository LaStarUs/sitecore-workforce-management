import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import type { User } from './auth/permissions';
import { Layout } from './components/Layout';
import type { WorkforceRepository } from './data/repository';
import { AuditPage } from './pages/AuditPage';
import { DashboardPage } from './pages/DashboardPage';
import { HolidaysPage } from './pages/HolidaysPage';
import { LoginPage } from './pages/LoginPage';
import { MedicalPage } from './pages/MedicalPage';
import { OperativeDetailPage } from './pages/OperativeDetailPage';
import { OperativesPage } from './pages/OperativesPage';
import { TrainingMatrixPage } from './pages/TrainingMatrixPage';
import { WorkforceProvider } from './state/WorkforceContext';

function Gate({ repository }: { repository: WorkforceRepository }) {
  const { user } = useAuth();
  if (!user) return <LoginPage />;
  return (
    <WorkforceProvider repository={repository}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="operatives" element={<OperativesPage />} />
          <Route path="operatives/:id" element={<OperativeDetailPage />} />
          <Route path="matrix" element={<TrainingMatrixPage />} />
          <Route path="medical" element={<MedicalPage />} />
          <Route path="holidays" element={<HolidaysPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </WorkforceProvider>
  );
}

/** HashRouter keeps deep links working on GitHub Pages, which has no server-side routing. */
export function App({ repository, initialUser }: { repository: WorkforceRepository; initialUser?: User | null }) {
  return (
    <AuthProvider initialUser={initialUser}>
      <HashRouter>
        <Gate repository={repository} />
      </HashRouter>
    </AuthProvider>
  );
}
