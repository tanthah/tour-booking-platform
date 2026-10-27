import { NavLink } from 'react-router-dom';
import { Compass, Map, Grid, ShoppingBag, Ticket, Settings as SettingsIcon, Users as UsersIcon, ShieldCheck, FileText } from 'lucide-react';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || {};
  } catch {
    return {};
  }
}

function Sidebar() {
  const user = getStoredUser();
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  const isAdmin = user.role?.code === 'admin' || (Array.isArray(user.roles) && user.roles.includes('ADMIN'));

  const hasPerm = (requiredPerms) => {
    if (isAdmin) return true;
    if (Array.isArray(requiredPerms)) {
      return requiredPerms.some((p) => permissions.includes(p));
    }
    return permissions.includes(requiredPerms);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Compass size={28} color="var(--primary-color)" />
        <span>TourBooking</span>
      </div>
      <nav className="sidebar-menu">
        {hasPerm(['tour.view', 'tour.create', 'tour.update']) && (
          <NavLink 
            to="/admin/tours" 
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            <Map size={20} />
            <span>Quản lý Tour</span>
          </NavLink>
        )}

        {hasPerm('category.manage') && (
          <NavLink 
            to="/admin/categories" 
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            <Grid size={20} />
            <span>Quản lý Danh mục</span>
          </NavLink>
        )}

        {isAdmin && (
          <>
            <NavLink 
              to="/admin/articles" 
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            >
              <FileText size={20} />
              <span>Quản lý Tin tức</span>
            </NavLink>

            <NavLink 
              to="/admin/article-categories" 
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            >
              <Grid size={20} />
              <span>Danh mục Tin tức</span>
            </NavLink>
          </>
        )}

        {hasPerm(['booking.view', 'booking.manage']) && (
          <NavLink 
            to="/admin/orders" 
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            <ShoppingBag size={20} />
            <span>Quản lý Đơn hàng</span>
          </NavLink>
        )}

        {hasPerm(['coupon.view', 'coupon.manage']) && (
          <NavLink 
            to="/admin/coupons" 
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            <Ticket size={20} />
            <span>Quản lý Coupon</span>
          </NavLink>
        )}

        {hasPerm(['user.view', 'user.manage']) && (
          <NavLink 
            to="/admin/users" 
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            <UsersIcon size={20} />
            <span>Quản lý Tài khoản</span>
          </NavLink>
        )}

        {hasPerm('role.manage') && (
          <NavLink 
            to="/admin/roles" 
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            <ShieldCheck size={20} />
            <span>Vai trò & Phân quyền</span>
          </NavLink>
        )}

        {hasPerm('audit.view') && (
          <NavLink 
            to="/admin/audit-logs" 
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            <FileText size={20} />
            <span>Nhật ký hệ thống</span>
          </NavLink>
        )}

        {hasPerm('settings.manage') && (
          <NavLink 
            to="/admin/settings" 
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            <SettingsIcon size={20} />
            <span>Quản lý chung</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
