import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Categories from './modules/categories/pages/CategoryManagement';
import CategoryForm from './modules/categories/pages/CategoryForm';
import Tours from './modules/tours/pages/TourManagement';
import TourForm from './modules/tours/pages/TourForm';
import Orders from './modules/orders/pages/OrderManagement';
import Settings from './pages/Settings';
import Coupons from './modules/coupons/pages/CouponManagement';
import CouponForm from './modules/coupons/pages/CouponForm';
import Users from './pages/Users';
import Roles from './pages/Roles';
import AuditLogs from './pages/AuditLogs';
import Articles from './modules/article/pages/ArticleManagement';
import ArticleForm from './modules/article/pages/ArticleForm';
import ArticleCategories from './modules/article/pages/ArticleCategories';
import ArticleReviewQueue from './modules/article/pages/ArticleReviewQueue';
import JourneyList from './modules/journey/pages/JourneyList';
import JourneyManage from './modules/journey/pages/JourneyManage';
import './index.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        {/* Redirect trang chủ admin vào trang tours */}
        <Route index element={<Navigate to="tours" replace />} />

        {/* Routes quản lý Đơn hàng */}
        <Route path="orders" element={<Orders />} />

        {/* Routes Hành trình Tour (Admin giám sát & Staff điều hành) */}
        <Route path="journeys" element={<JourneyList />} />
        <Route path="my-journeys" element={<JourneyList mode="staff" />} />
        <Route path="journeys/:journeyId" element={<JourneyManage />} />

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
