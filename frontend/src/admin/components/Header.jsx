import { Bell, Search } from 'lucide-react';

function Header() {
  return (
    <header className="topbar">
      <div className="search-box" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
        <Search size={20} />
        <span style={{ fontSize: '14px' }}>Tìm kiếm... (Ctrl+K)</span>
      </div>
      
      <div className="topbar-right">
        <button className="icon-btn">
          <Bell size={20} />
        </button>
        <div className="user-profile">
          <div className="avatar">A</div>
          <span>Admin User</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
