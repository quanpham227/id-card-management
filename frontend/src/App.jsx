import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';

// --- CÁC COMPONENT CỐT LÕI ---
import PrivateRoute from "./components/Auth/PrivateRoute.jsx";
import MainLayout from "./components/layout/MainLayout.jsx";
import { EmployeeProvider } from './context/EmployeeProvider';

// --- CÁC TRANG (LAZY LOAD) ---
const Login = lazy(() => import("./components/pages/Login/index.jsx"));

// [CẬP NHẬT] Trang Dashboard chỉ còn là Thống kê
const Dashboard = lazy(() => import("./components/pages/Dashboard/index.jsx"));

// [MỚI] Trang Quản lý Nhân viên (CRUD, Lọc, In ấn)
const EmployeeManagement = lazy(() => import("./components/pages/EmployeeManagement/index.jsx"));

const UploadPage = lazy(() => import("./components/pages/uploads/index.jsx"));
const SearchPage = lazy(() => import("./components/pages/Search/index.jsx"));
const AssetManager = lazy(() => import('./components/pages/IT/AssetManager.jsx'));
const UserManager = lazy(() => import('./components/pages/Admin/UserManager.jsx'));
const PrintToolsPage = lazy(() => import('./components/pages/PrintTools/index.jsx'));
const NotFound = React.lazy(() => import('./components/pages/NotFound/index.jsx'));

// --- LOADING FALLBACK ---
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%', background: '#f0f2f5' }}>
    <Spin size="large" />
  </div>
);

function App() {
  return (
    <EmployeeProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* PUBLIC */}
            <Route path="/" element={<Login />} />
            
            {/* PRIVATE */}
            <Route element={<PrivateRoute />}>
              <Route element={<MainLayout />}>
                
                {/* 1. Dashboard Thống kê */}
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* 2. [MỚI] Quản lý Nhân viên */}
                <Route path="/employees" element={<EmployeeManagement />} />

                {/* HR Pages */}
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/search-image" element={<SearchPage />} />
                <Route path="/print-tools" element={<PrintToolsPage />} />
                
                {/* IT Assets */}
                <Route path="/it/pc" element={<AssetManager defaultType="PC" />} />
                <Route path="/it/laptop" element={<AssetManager defaultType="Laptop" />} />
                <Route path="/it/tablet" element={<AssetManager defaultType="Tablet" />} />
                <Route path="/it/printer" element={<AssetManager defaultType="Printer" />} />

                {/* Admin */}
                <Route path="/admin/users" element={<UserManager />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </EmployeeProvider>
  );
}

export default App;