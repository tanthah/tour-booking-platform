import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Categories from './pages/Categories';
import CategoryForm from './pages/CategoryForm';
import Tours from './pages/Tours';
import TourForm from './pages/TourForm';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import Coupons from './pages/Coupons';
import CouponForm from './pages/CouponForm';
import Users from './pages/Users';
import Roles from './pages/Roles';
import AuditLogs from './pages/AuditLogs';
import Articles from './pages/Articles';
import ArticleForm from './pages/ArticleForm';
import ArticleCategories from './pages/ArticleCategories';
import ArticleReviewQueue from './pages/ArticleReviewQueue';
import './index.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        {/* Redirect trang chủ admin vào trang tours */}
        <Route index element={<Navigate to="tours" replace />} />

        {/* Routes quản lý Đơn hàng */}
        <Route path="orders" element={<Orders />} />

        {/* Routes quản lý Tin tức */}
        <Route path="articles" element={<Articles />} />
        <Route path="articles/review-queue" element={<ArticleReviewQueue />} />
        <Route path="articles/create" element={<ArticleForm />} />
        <Route path="articles/edit/:id" element={<ArticleForm />} />
        <Route path="article-categories" element={<ArticleCategories />} />

        {/* Routes quản lý Mã giảm giá (Coupon) */}
        <Route path="coupons" element={<Coupons />} />
        <Route path="coupons/create" element={<CouponForm />} />
        <Route path="coupons/edit/:id" element={<CouponForm />} />

        {/* Routes quản lý Tour */}
        <Route path="tours" element={<Tours />} />
        <Route path="tours/create" element={<TourForm />} />
        <Route path="tours/edit/:id" element={<TourForm />} />

        {/* Routes quản lý Danh mục */}
        <Route path="categories" element={<Categories />} />
        <Route path="categories/create" element={<CategoryForm />} />
        <Route path="categories/edit/:id" element={<CategoryForm />} />

        {/* Routes Quản lý Tài khoản & Nhân viên */}
        <Route path="users" element={<Users />} />

        {/* Routes Quản lý Vai trò & Phân quyền */}
        <Route path="roles" element={<Roles />} />

        {/* Routes Nhật ký hệ thống */}
        <Route path="audit-logs" element={<AuditLogs />} />

        {/* Routes Cài đặt chung */}
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
