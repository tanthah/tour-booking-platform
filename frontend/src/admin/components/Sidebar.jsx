import { NavLink } from 'react-router-dom';
import { Compass, Map, Grid } from 'lucide-react';

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
      </nav>
    </aside>
  );
}

export default Sidebar;
