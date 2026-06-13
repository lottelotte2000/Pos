import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Import Layout
import Layout from './components/layout/Layout';

// Import Common
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy Load Pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const SalesPage = lazy(() => import('./pages/SalesPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CustomerDisplayPage = lazy(() => import('./pages/CustomerDisplayPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SetupPage = lazy(() => import('./pages/SetupPage'));


// Import Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { CartProvider } from './context/CartContext';
import { ProductProvider } from './context/ProductContext';
import { SettingsProvider } from './context/SettingsContext';

// Import Components
import UpdateNotification from './components/UpdateNotification';
import { ThemeDecorations } from './components/common/ThemeDecorations';

const LoadingScreen = ({ message = "Loading..." }) => (
  <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
      <span className="text-lg font-medium text-slate-300">{message}</span>
    </div>
  </div>
);

// --- Upgraded ProtectedRoute ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const { isDataLoaded } = useData();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isDataLoaded) {
    return <LoadingScreen message="กำลังเตรียมข้อมูล..." />;
  }

  return <>{children}</>;
};

const LoginRedirector = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// กั้นเฉพาะผู้ดูแลระบบ (admin) — ผู้ใช้ทั่วไปเข้าไม่ได้ จะถูกส่งกลับหน้าหลัก
const AdminOnly = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  if (currentUser?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const MainAppRoutes = () => (
  <Layout>
    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary-500" /></div>}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/users" element={<AdminOnly><UsersPage /></AdminOnly>} />
        <Route path="/settings" element={<AdminOnly><SettingsPage /></AdminOnly>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </Layout>
);

const AppRouter: React.FC = () => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      <Route path="/login" element={<LoginRedirector><LoginPage /></LoginRedirector>} />
      <Route path="/customer-display" element={<CustomerDisplayPage />} />
      <Route path="/*" element={<ProtectedRoute><MainAppRoutes /></ProtectedRoute>} />
    </Routes>
  </Suspense>
);

const AppGate: React.FC = () => {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (window.electronAPI?.getSetupStatus) {
        const status = await window.electronAPI.getSetupStatus();
        setIsSetupComplete(status.isSetupComplete);
      } else {
        console.warn("Electron API not found, assuming setup is complete.");
        setIsSetupComplete(true);
      }
    };
    checkStatus();
  }, []);

  if (isSetupComplete === null) {
    return <LoadingScreen message="ตรวจสอบระบบ..." />;
  }

  return (
    <ErrorBoundary>
      <Routes>
        {isSetupComplete ? (
          <Route path="/*" element={<AppRouter />} />
        ) : (
          <>
            <Route path="/setup" element={<SetupPage />} />
            <Route path="*" element={<Navigate to="/setup" replace />} />
          </>
        )}
      </Routes>
    </ErrorBoundary>
  );
};


export default function App() {
  return (
    <HashRouter>
      <SettingsProvider>
        <ProductProvider>
          <DataProvider>
            <AuthProvider>
              <CartProvider>
                <AppGate />
                <ThemeDecorations />
                {window.electronAPI && <UpdateNotification />}
              </CartProvider>
            </AuthProvider>
          </DataProvider>
        </ProductProvider>
      </SettingsProvider>
    </HashRouter>
  );
}