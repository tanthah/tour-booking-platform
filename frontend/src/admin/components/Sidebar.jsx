import { NavLink } from 'react-router-dom';
import { Compass, Map, Grid, ShoppingBag, Ticket } from 'lucide-react';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Compass size={28} color="var(--primary-color)" />
        <span>TourBooking</span>
      </div>
      <nav className="sidebar-menu">
        <NavLink 
          to="/admin/tours" 
          className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
        >
          <Map size={20} />
          <span>Quản lý Tour</span>
        </NavLink>
        <NavLink 
          to="/admin/categories" 
          className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
        >
          <Grid size={20} />
          <span>Quản lý Danh mục</span>
        </NavLink>
        <NavLink 
          to="/admin/orders" 
          className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
        >
          <ShoppingBag size={20} />
          <span>Quản lý Đơn hàng</span>
        </NavLink>
        <NavLink 
          to="/admin/coupons" 
          className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
        >
          <Ticket size={20} />
          <span>Quản lý Coupon</span>
        </NavLink>
        <NavLink 
          to="/admin/settings" 
          className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
        >
          <Compass size={20} />
          <span>Quản lý chung</span>
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
