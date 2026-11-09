import { useState, useEffect, useCallback } from 'react';
import { Shield, Lock, Unlock, Key, RefreshCw } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminDataTable,
  ActionButtons,
} from '../components/common';

function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const fetchUsers = useCallback(
    async (page = 1, limit = pagination.limit || 15) => {
      try {
        setLoading(true);
        setError(null);
        const params = { page, limit };
        if (search.trim()) params.search = search.trim();
        if (selectedRole) params.role_id = selectedRole;
        if (selectedStatus) params.status = selectedStatus;

        const res = await axiosAdmin.get('/admin/users', { params });
        setUsers(res.data?.items || []);
        setPagination(
          res.data?.pagination || { page, limit, total: 0, total_pages: 1 }
        );
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách tài khoản');
      } finally {
        setLoading(false);
      }
    },
    [search, selectedRole, selectedStatus, pagination.limit]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedRole('');
    setSelectedStatus('');
    fetchUsers(1);
  };

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

  const columns = [
    {
      key: 'account',
      title: 'Tài khoản',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
            {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{u.full_name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      title: 'Số điện thoại',
      width: '140px',
      render: (u) => u.phone || '-',
    },
    {
      key: 'role',
      title: 'Vai trò',
      width: '160px',
      render: (u) => getRoleBadge(u),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: '140px',
      render: (u) => (
        <span className={`status-badge ${u.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
          {u.status === 'ACTIVE' ? 'Hoạt động' : u.status === 'LOCKED' ? 'Đã khóa' : u.status}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: 'Ngày tạo',
      width: '130px',
      render: (u) => (
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      width: '130px',
      align: 'center',
      render: (u) => (
        <ActionButtons
          actions={[
            {
              key: 'role',
              icon: Shield,
              title: 'Đổi vai trò',
              onClick: () => {
                setRoleModalUser(u);
                setNewRoleId(u.role_id?._id || '');
                setRoleReason('');
              },
              variant: 'view',
            },
            {
              key: 'permissions',
              icon: Key,
              title: 'Phân quyền riêng (Overrides)',
              onClick: () => handleOpenOverride(u),
              variant: 'edit',
            },
            {
              key: 'lock_toggle',
              icon: u.status === 'ACTIVE' ? Lock : Unlock,
              title: u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
              onClick: () => {
                setStatusModalUser(u);
                setNewStatus(u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE');
                setStatusReason('');
              },
              variant: u.status === 'ACTIVE' ? 'delete' : 'refresh',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Quản lý Tài khoản & Nhân viên"
        subtitle="Xem danh sách, phân công vai trò và khóa/mở khóa tài khoản người dùng"
        actions={
          <button className="btn btn-secondary" onClick={() => fetchUsers(pagination.page)} title="Làm mới danh sách">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>Làm mới</span>
          </button>
        }
      />

      <AdminFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm theo tên, email, số điện thoại..."
        filters={[
          {
            key: 'role',
            value: selectedRole,
            onChange: setSelectedRole,
            placeholder: 'Tất cả vai trò',
            options: roles.map((r) => ({ value: r._id, label: r.name })),
            width: '200px',
          },
          {
            key: 'status',
            value: selectedStatus,
            onChange: setSelectedStatus,
            placeholder: 'Tất cả trạng thái',
            options: [
              { value: 'ACTIVE', label: 'Hoạt động (ACTIVE)' },
              { value: 'LOCKED', label: 'Bị khóa (LOCKED)' },
              { value: 'INACTIVE', label: 'Vô hiệu (INACTIVE)' },
              { value: 'PENDING_VERIFICATION', label: 'Chờ kích hoạt' },
            ],
            width: '180px',
          },
        ]}
        onClearFilters={handleClearFilters}
      />

      <AdminDataTable
        columns={columns}
        data={users}
        loading={loading}
        error={error}
        emptyText="Không tìm thấy người dùng phù hợp."
        currentPage={pagination.page}
        pageSize={pagination.limit}
        totalItems={pagination.total}
        totalPages={pagination.total_pages}
        onPageChange={(p) => fetchUsers(p, pagination.limit)}
        onPageSizeChange={(newLimit) => fetchUsers(1, newLimit)}
      />

      {/* MODAL 1: Đổi Vai Trò */}
      {roleModalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '450px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '16px' }}>Đổi vai trò người dùng</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Người dùng: <strong>{roleModalUser.full_name}</strong> ({roleModalUser.email})
            </p>
            <form onSubmit={handleSaveRole}>
              <div className="form-group">
                <label className="form-label">Chọn vai trò mới</label>
                <select className="form-control" value={newRoleId} onChange={(e) => setNewRoleId(e.target.value)}>
                  <option value="">-- Chọn vai trò --</option>
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>{r.name} ({r.code})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Lý do thay đổi</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Nhập lý do đổi vai trò (lưu vào nhật ký kiểm toán)..."
                  value={roleReason}
                  onChange={(e) => setRoleReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setRoleModalUser(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Xác nhận đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Đổi Trạng Thái (Khóa/Mở Khóa) */}
      {statusModalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '450px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '16px' }}>
              {newStatus === 'LOCKED' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Bạn đang thao tác với tài khoản: <strong>{statusModalUser.full_name}</strong>
            </p>
            <form onSubmit={handleSaveStatus}>
              <div className="form-group">
                <label className="form-label">Lý do thực hiện</label>
                <textarea
                  className="form-control"
                  rows="3"
                  required
                  placeholder="Nhập lý do khóa/mở khóa tài khoản..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStatusModalUser(null)}>Hủy</button>
                <button type="submit" className={newStatus === 'LOCKED' ? 'btn btn-danger' : 'btn btn-primary'}>
                  {newStatus === 'LOCKED' ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Phân Quyền Riêng (Permission Overrides) */}
      {overrideUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '650px', maxWidth: '95%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '8px' }}>Cấu hình quyền riêng biệt (Overrides)</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Người dùng: <strong>{overrideUser.full_name}</strong> | Vai trò: <em>{overrideUser.role_id?.name || 'Mặc định'}</em>
            </p>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
              {catalog?.groups?.map((group) => (
                <div key={group.groupCode} style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--primary-color)', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    {group.groupName}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {group.permissions.map((p) => {
                      const currentOverride = userOverrides.find((o) => o.permission === p.code);
                      const currentEffect = currentOverride ? currentOverride.effect : 'DEFAULT';
                      return (
                        <div key={p.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '4px 8px', background: '#f8fafc', borderRadius: '4px' }}>
                          <div>
                            <strong>{p.name}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({p.code})</span>
                          </div>
                          <select
                            style={{ padding: '2px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            value={currentEffect}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'DEFAULT') {
                                setUserOverrides((prev) => prev.filter((o) => o.permission !== p.code));
                              } else {
                                setUserOverrides((prev) => [
                                  ...prev.filter((o) => o.permission !== p.code),
                                  { permission: p.code, effect: val },
                                ]);
                              }
                            }}
                          >
                            <option value="DEFAULT">Theo vai trò</option>
                            <option value="ALLOW">Cho phép (ALLOW)</option>
                            <option value="DENY">Cấm (DENY)</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setOverrideUser(null)}>Đóng</button>
              <button type="button" className="btn btn-primary" onClick={handleSaveOverrides}>Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
