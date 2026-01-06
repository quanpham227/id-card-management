import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'; 
import { Spin } from 'antd';

// --- CÁC COMPONENT CỐT LÕI ---
import PrivateRoute from "./components/Auth/PrivateRoute.jsx";
import MainLayout from "./components/layout/MainLayout.jsx";

// [CONTEXT PROVIDERS]
import { EmployeeProvider } from './context/EmployeeProvider';
import { CategoryProvider } from './context/CategoryProvider'; // [QUAN TRỌNG] Thêm Provider này

// --- CÁC TRANG (LAZY LOAD) ---
const Login = lazy(() => import("./components/pages/Login/index.jsx"));
const Dashboard = lazy(() => import("./components/pages/Dashboard/index.jsx"));
const EmployeeManagement = lazy(() => import("./components/pages/EmployeeManagement/index.jsx"));
const UploadPage = lazy(() => import("./components/pages/uploads/index.jsx"));
const SearchPage = lazy(() => import("./components/pages/Search/index.jsx"));
const AssetManager = lazy(() => import('./components/pages/IT/AssetManager.jsx'));
const UserManager = lazy(() => import('./components/pages/Admin/UserManager.jsx'));
const PrintToolsPage = lazy(() => import('./components/pages/PrintTools/index.jsx'));
const NotFound = React.lazy(() => import('./components/pages/NotFound/index.jsx'));

// Trang Quản lý Danh mục (Admin)
const CategoryManager = lazy(() => import('./components/pages/Admin/CategoryManager.jsx'));

// --- LOADING FALLBACK ---
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%', background: '#f0f2f5' }}>
    <Spin size="large" />
  </div>
);

// --- WRAPPER XỬ LÝ URL ĐỘNG ---
// Chuyển đổi tham số URL /it/pc thành prop defaultType="PC"
const AssetManagerWrapper = () => {
  const { type } = useParams(); 
  const categoryCode = (type && type !== 'all') ? type.toUpperCase() : null;
  return <AssetManager defaultType={categoryCode} />;
};

function App() {
  return (
    // 1. EmployeeProvider: Quản lý nhân viên toàn cục
    <EmployeeProvider>
      {/* 2. CategoryProvider: Quản lý danh mục toàn cục (Sidebar, Dropdown...) */}
      <CategoryProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* --- PUBLIC ROUTES --- */}
              <Route path="/" element={<Login />} />
              
              {/* --- PRIVATE ROUTES --- */}
              <Route element={<PrivateRoute />}>
                <Route element={<MainLayout />}>
                  
                  {/* DASHBOARD */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* HR MANAGEMENT */}
                  <Route path="/employees" element={<EmployeeManagement />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/search-image" element={<SearchPage />} />
                  
                  {/* PRINT TOOLS */}
                  <Route path="/print-tools" element={<PrintToolsPage />} />
                  
                  {/* IT ASSETS - ROUTE ĐỘNG */}
                  {/* Xử lý mọi loại thiết bị: /it/pc, /it/server, /it/camera... */}
                  <Route path="/it/:type" element={<AssetManagerWrapper />} />

                  {/* ADMIN SYSTEM */}
                  <Route path="/admin/users" element={<UserManager />} />
                  <Route path="/admin/categories" element={<CategoryManager />} />

                </Route>
              </Route>

              {/* 404 NOT FOUND */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CategoryProvider>
    </EmployeeProvider>
  );
}

export default App;