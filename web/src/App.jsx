import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { RoleGuard } from './components/common/RoleGuard';

// Páginas de Fase 1
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Dashboards por Rol
import { ClientDashboard } from './pages/client/ClientDashboard';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';

// Páginas de Fase 2 (ABM Catálogos & Gestión)
import { ServicesPage } from './pages/owner/ServicesPage';
import { EmployeesPage } from './pages/owner/EmployeesPage';
import { ClientsPage } from './pages/owner/ClientsPage';

// Páginas de Fase 3 (Calendario & Configuración de Fechas)
import { DatesPage } from './pages/owner/DatesPage';

// Páginas de Fase 4 (Multas y Mercado Pago)
import { ClientFinesPage } from './pages/client/ClientFinesPage';

// Páginas de Fase 5 (Perfil y Reseñas)
import { ClientProfilePage } from './pages/client/ClientProfilePage';
import { ReviewsPage } from './pages/ReviewsPage';

export const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Rutas Públicas (Fase 1) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />

        {/* Rutas Protegidas - Cliente */}
        <Route
          path="/cliente/*"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['cliente']}>
                <Routes>
                  <Route path="home" element={<ClientDashboard />} />
                  <Route path="turnos" element={<ClientDashboard />} />
                  <Route path="multas" element={<ClientFinesPage />} />
                  <Route path="perfil" element={<ClientProfilePage />} />
                  <Route path="*" element={<Navigate to="/cliente/home" replace />} />
                </Routes>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Rutas Protegidas - Dueño */}
        <Route
          path="/dueno/*"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['dueno']}>
                <Routes>
                  <Route path="home" element={<OwnerDashboard />} />
                  <Route path="servicios" element={<ServicesPage />} />
                  <Route path="empleados" element={<EmployeesPage />} />
                  <Route path="clientes" element={<ClientsPage />} />
                  <Route path="fechas" element={<DatesPage />} />
                  <Route path="resenas" element={<ReviewsPage />} />
                  <Route path="*" element={<Navigate to="/dueno/home" replace />} />
                </Routes>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Rutas Protegidas - Empleado */}
        <Route
          path="/empleado/*"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['empleado']}>
                <Routes>
                  <Route path="home" element={<EmployeeDashboard />} />
                  <Route path="servicios" element={<ServicesPage />} />
                  <Route path="clientes" element={<ClientsPage />} />
                  <Route path="resenas" element={<ReviewsPage />} />
                  <Route path="*" element={<Navigate to="/empleado/home" replace />} />
                </Routes>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Fallback general */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
