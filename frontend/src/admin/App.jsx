import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Categories from './pages/Categories';
import CategoryForm from './pages/CategoryForm';
import Tours from './pages/Tours';
import TourForm from './pages/TourForm';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import './index.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        {/* Redirect trang chủ admin vào trang tours */}
        <Route index element={<Navigate to="tours" replace />} />

        {/* Routes quản lý Đơn hàng */}
        <Route path="orders" element={<Orders />} />

        {/* Routes quản lý Tour */}
        <Route path="tours" element={<Tours />} />
        <Route path="tours/create" element={<TourForm />} />
        <Route path="tours/edit/:id" element={<TourForm />} />

        {/* Routes quản lý Danh mục */}
        <Route path="categories" element={<Categories />} />
        <Route path="categories/create" element={<CategoryForm />} />
        <Route path="categories/edit/:id" element={<CategoryForm />} />

        {/* Routes Cài đặt chung */}
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;

