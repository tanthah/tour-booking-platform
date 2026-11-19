import { Bell, LogOut } from 'lucide-react';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || {};
  } catch {
    return {};
  }
}

function Header() {
  const user = getStoredUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const displayName = user.full_name || 'Quản trị viên';
  const roleName = user.role?.name || (user.roles && user.roles[0]) || 'Admin';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <div className="search-box" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>

      </div>

      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="icon-btn" title="Thông báo">
          <Bell size={20} />
        </button>
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="avatar">{initial}</div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>{displayName}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{roleName}</span>
          </div>
        </div>
        <button
          className="icon-btn"
          onClick={handleLogout}
          title="Đăng xuất"
          style={{ cursor: 'pointer', border: 'none', background: 'transparent', color: '#ef4444' }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

export default Header;
