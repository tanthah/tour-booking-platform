import { useState, useEffect, useCallback } from 'react';
import { Search, Shield, Lock, Unlock, Key, RefreshCw } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';

function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, total_pages: 1 });
  
  // Bộ lọc
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals state
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [newRoleId, setNewRoleId] = useState('');
  const [roleReason, setRoleReason] = useState('');

  const [statusModalUser, setStatusModalUser] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  const [overrideUser, setOverrideUser] = useState(null);
  const [userOverrides, setUserOverrides] = useState([]);

  // Tải danh sách roles
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [resRoles, resPerms] = await Promise.all([
          axiosAdmin.get('/admin/roles'),
          axiosAdmin.get('/admin/permissions'),
        ]);
        setRoles(resRoles.data || []);
        setCatalog(resPerms.data || null);
      } catch (err) {
        console.error('Lỗi tải dữ liệu ban đầu:', err);
      }
    };
    fetchInit();
  }, []);

  // Tải danh sách users
  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (selectedRole) params.role_id = selectedRole;
      if (selectedStatus) params.status = selectedStatus;

      const res = await axiosAdmin.get('/admin/users', { params });
      setUsers(res.data?.items || []);
      setPagination(res.data?.pagination || { page: 1, limit: 15, total: 0, total_pages: 1 });
    } catch (err) {
      alert(err.message || 'Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  }, [search, selectedRole, selectedStatus]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  // Đổi vai trò
  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!newRoleId) return alert('Vui lòng chọn vai trò mới');
    try {
      await axiosAdmin.patch(`/admin/users/${roleModalUser._id}/role`, {
        role_id: newRoleId,
        reason: roleReason,
      });
      alert('Đổi vai trò thành công!');
      setRoleModalUser(null);
      fetchUsers(pagination.page);
    } catch (err) {
      alert(err.message || 'Lỗi khi đổi vai trò');
    }
  };

  // Đổi trạng thái
  const handleSaveStatus = async (e) => {
    e.preventDefault();
    try {
      await axiosAdmin.patch(`/admin/users/${statusModalUser._id}/status`, {
        status: newStatus,
        reason: statusReason,
      });
      alert('Cập nhật trạng thái thành công!');
      setStatusModalUser(null);
      fetchUsers(pagination.page);
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  // Mở modal override quyền
  const handleOpenOverride = async (user) => {
    try {
      const res = await axiosAdmin.get(`/admin/users/${user._id}/permissions`);
      setOverrideUser(user);
      setUserOverrides(res.data?.permission_overrides || []);
    } catch (err) {
      alert(err.message || 'Không thể tải quyền của người dùng');
    }
  };

  // Lưu override
  const handleSaveOverrides = async () => {
    try {
      await axiosAdmin.put(`/admin/users/${overrideUser._id}/permission-overrides`, {
        overrides: userOverrides,
      });
      alert('Cập nhật phân quyền riêng thành công!');
      setOverrideUser(null);
      fetchUsers(pagination.page);
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu quyền');
    }
  };

  const getRoleBadge = (user) => {
    const code = user.role_id?.code || (user.roles && user.roles[0]?.toLowerCase()) || 'customer';
    const name = user.role_id?.name || (code === 'admin' ? 'Quản trị viên' : code.includes('staff') ? 'Nhân viên' : 'Khách hàng');
    let bg = '#f1f5f9', color = '#475569';
    if (code === 'admin') { bg = '#fef2f2'; color = '#dc2626'; }
    else if (code.includes('tour')) { bg = '#eff6ff'; color = '#2563eb'; }
    else if (code.includes('booking')) { bg = '#fffbeb'; color = '#d97706'; }
    return (
      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: bg, color }}>
        {name}
      </span>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Tài khoản & Nhân viên</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Xem danh sách, phân công vai trò và khóa/mở khóa tài khoản người dùng
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => fetchUsers(pagination.page)}>
          <RefreshCw size={16} /> <span>Làm mới</span>
        </button>
      </div>

      {/* Thanh bộ lọc */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
          </div>
          <select className="form-control" style={{ width: '200px' }} value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
            <option value="">Tất cả vai trò</option>
            {roles.map((r) => (<option key={r._id} value={r._id}>{r.name}</option>))}
          </select>
          <select className="form-control" style={{ width: '180px' }} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động (ACTIVE)</option>
            <option value="LOCKED">Bị khóa (LOCKED)</option>
            <option value="INACTIVE">Vô hiệu (INACTIVE)</option>
            <option value="PENDING_VERIFICATION">Chờ kích hoạt</option>
          </select>
        </div>
      </div>

      {/* Bảng danh sách */}
      <div className="card">
        {loading ? (
          <p style={{ padding: '24px', textAlign: 'center' }}>Đang tải danh sách tài khoản...</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tài khoản</th>
                  <th>Số điện thoại</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Không tìm thấy người dùng phù hợp</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
                            {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{u.phone || '-'}</td>
                      <td>{getRoleBadge(u)}</td>
                      <td>
                        <span className={`status-badge ${u.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                          {u.status === 'ACTIVE' ? 'Hoạt động' : u.status === 'LOCKED' ? 'Đã khóa' : u.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="icon-btn"
                            title="Đổi vai trò"
                            onClick={() => { setRoleModalUser(u); setNewRoleId(u.role_id?._id || ''); setRoleReason(''); }}
                          >
                            <Shield size={18} />
                          </button>
                          <button
                            className="icon-btn"
                            title="Phân quyền riêng (Overrides)"
                            onClick={() => handleOpenOverride(u)}
                          >
                            <Key size={18} />
                          </button>
                          <button
                            className="icon-btn"
                            title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            onClick={() => {
                              setStatusModalUser(u);
                              setNewStatus(u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE');
                              setStatusReason('');
                            }}
                          >
                            {u.status === 'ACTIVE' ? <Lock size={18} color="#ef4444" /> : <Unlock size={18} color="#10b981" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        {pagination.total_pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Tổng cộng {pagination.total} tài khoản (Trang {pagination.page}/{pagination.total_pages})
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn" disabled={pagination.page <= 1} onClick={() => fetchUsers(pagination.page - 1)}>Trang trước</button>
              <button className="btn" disabled={pagination.page >= pagination.total_pages} onClick={() => fetchUsers(pagination.page + 1)}>Trang sau</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Đổi vai trò */}
      {roleModalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '480px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '16px' }}>Đổi vai trò tài khoản</h3>
            <p style={{ fontSize: '14px', marginBottom: '16px' }}>
              Người dùng: <strong>{roleModalUser.full_name}</strong> ({roleModalUser.email})
            </p>
            <form onSubmit={handleSaveRole}>
              <div className="form-group">
                <label className="form-label">Chọn vai trò mới:</label>
                <select className="form-control" value={newRoleId} onChange={(e) => setNewRoleId(e.target.value)} required>
                  <option value="">-- Chọn vai trò --</option>
                  {roles.map((r) => (<option key={r._id} value={r._id}>{r.name} ({r.code})</option>))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Lý do thay đổi (ghi vào nhật ký):</label>
                <input className="form-control" placeholder="VD: Phân công nhân viên quản lý tour mới" value={roleReason} onChange={(e) => setRoleReason(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn" onClick={() => setRoleModalUser(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đổi trạng thái */}
      {statusModalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '460px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '16px' }}>
              {newStatus === 'LOCKED' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
            </h3>
            <p style={{ fontSize: '14px', marginBottom: '16px' }}>
              Bạn có chắc muốn chuyển trạng thái của <strong>{statusModalUser.full_name}</strong> sang <strong>{newStatus}</strong>?
            </p>
            <form onSubmit={handleSaveStatus}>
              <div className="form-group">
                <label className="form-label">Lý do thay đổi:</label>
                <input className="form-control" placeholder="VD: Vi phạm quy định sử dụng dịch vụ" value={statusReason} onChange={(e) => setStatusReason(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn" onClick={() => setStatusModalUser(null)}>Hủy</button>
                <button type="submit" className={`btn ${newStatus === 'LOCKED' ? 'btn-danger' : 'btn-primary'}`}>
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Override Quyền */}
      {overrideUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '640px', maxWidth: '95%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '8px' }}>Cấu hình quyền riêng (Overrides)</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Tài khoản: <strong>{overrideUser.full_name}</strong> — Vai trò: <strong>{overrideUser.role_id?.name || 'Customer'}</strong>
            </p>
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              {catalog?.groups?.map((group) => (
                <div key={group.module} style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--primary-color)', marginBottom: '8px' }}>
                    {group.name}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                    {group.permissions.map((p) => {
                      const cur = userOverrides.find((o) => o.permission === p.code);
                      return (
                        <div key={p.code} style={{ padding: '8px', border: '1px solid #f1f5f9', borderRadius: '6px', background: '#fafafa', fontSize: '12px' }}>
                          <div style={{ fontWeight: 500 }}>{p.name}</div>
                          <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '6px' }}>{p.code}</div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setUserOverrides((prev) => {
                                  const filtered = prev.filter((o) => o.permission !== p.code);
                                  return cur?.effect === 'ALLOW' ? filtered : [...filtered, { permission: p.code, effect: 'ALLOW' }];
                                });
                              }}
                              style={{
                                padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                                background: cur?.effect === 'ALLOW' ? '#10b981' : '#e2e8f0',
                                color: cur?.effect === 'ALLOW' ? '#fff' : '#475569',
                              }}
                            >
                              ALLOW
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setUserOverrides((prev) => {
                                  const filtered = prev.filter((o) => o.permission !== p.code);
                                  return cur?.effect === 'DENY' ? filtered : [...filtered, { permission: p.code, effect: 'DENY' }];
                                });
                              }}
                              style={{
                                padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                                background: cur?.effect === 'DENY' ? '#ef4444' : '#e2e8f0',
                                color: cur?.effect === 'DENY' ? '#fff' : '#475569',
                              }}
                            >
                              DENY
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn" onClick={() => setOverrideUser(null)}>Đóng</button>
              <button type="button" className="btn btn-primary" onClick={handleSaveOverrides}>Lưu quyền riêng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
