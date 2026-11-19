import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

function AdminLayout() {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="page-container">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
