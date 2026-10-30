import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, ShieldCheck, RefreshCw } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';

function Roles() {
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal tạo vai trò
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', code: '', description: '', permissions: [] });

  // Modal sửa vai trò
  const [editRole, setEditRole] = useState(null);

  // Modal cấu hình quyền (Permissions)
  const [permissionRole, setPermissionRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resRoles, resCatalog] = await Promise.all([
        axiosAdmin.get('/admin/roles'),
        axiosAdmin.get('/admin/permissions'),
      ]);
      setRoles(resRoles.data || []);
      setCatalog(resCatalog.data || null);
    } catch (err) {
      alert(err.message || 'Không thể tải danh sách vai trò');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tạo vai trò mới
  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await axiosAdmin.post('/admin/roles', newRole);
      alert('Tạo vai trò mới thành công!');
      setShowCreateModal(false);
      setNewRole({ name: '', code: '', description: '', permissions: [] });
      fetchData();
    } catch (err) {
      alert(err.message || 'Lỗi khi tạo vai trò');
    }
  };

  // Cập nhật vai trò
  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      await axiosAdmin.patch(`/admin/roles/${editRole._id}`, {
        name: editRole.name,
        description: editRole.description,
        is_active: editRole.is_active,
      });
      alert('Cập nhật vai trò thành công!');
      setEditRole(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật vai trò');
    }
  };

  // Mở modal gán quyền
  const handleOpenPermissions = (role) => {
    setPermissionRole(role);
    setSelectedPermissions(role.permissions || []);
  };

  // Lưu quyền vai trò
  const handleSavePermissions = async () => {
    try {
      await axiosAdmin.put(`/admin/roles/${permissionRole._id}/permissions`, {
        permissions: selectedPermissions,
      });
      alert('Cập nhật quyền hạn cho vai trò thành công!');
      setPermissionRole(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật quyền');
    }
  };

  const togglePermission = (code) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const toggleGroup = (group) => {
    const groupCodes = group.permissions.map((p) => p.code);
    const allSelected = groupCodes.every((c) => selectedPermissions.includes(c));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((c) => !groupCodes.includes(c)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...groupCodes])));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Vai trò & Phân quyền</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Định nghĩa các chức vụ trong hệ thống và phân chia quyền hạn truy cập chi tiết
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn" onClick={fetchData}>
            <RefreshCw size={16} /> <span>Làm mới</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> <span>Tạo vai trò mới</span>
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ padding: '24px', textAlign: 'center' }}>Đang tải danh sách vai trò...</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên vai trò</th>
                  <th>Mã (Code)</th>
                  <th>Mô tả</th>
                  <th>Loại</th>
                  <th>Số tài khoản</th>
                  <th>Số quyền</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td>
                      <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{r.code}</code>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{r.description || '-'}</td>
                    <td>
                      {r.is_system ? (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#6366f1', background: '#eef2ff', padding: '3px 8px', borderRadius: '10px' }}>
                          Mặc định hệ thống
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: '10px' }}>
                          Tùy chỉnh
                        </span>
                      )}
                    </td>
                    <td>
                      <strong>{r.user_count || 0}</strong> tài khoản
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                        {r.code === 'admin' ? 'Toàn quyền (All)' : `${r.permissions?.length || 0} quyền`}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${r.is_active ? 'status-active' : 'status-inactive'}`}>
                        {r.is_active ? 'Hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="icon-btn"
                          title="Phân quyền"
                          disabled={r.code === 'admin'}
                          onClick={() => handleOpenPermissions(r)}
                          style={{ opacity: r.code === 'admin' ? 0.4 : 1 }}
                        >
                          <ShieldCheck size={18} />
                        </button>
                        <button className="icon-btn" title="Chỉnh sửa thông tin" onClick={() => setEditRole(r)}>
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tạo vai trò */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '480px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '16px' }}>Tạo vai trò mới</h3>
            <form onSubmit={handleCreateRole}>
              <div className="form-group">
                <label className="form-label">Tên vai trò:</label>
                <input className="form-control" required placeholder="VD: Nhân viên CSKH" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Mã vai trò (viết thường, không dấu, dùng gạch dưới):</label>
                <input className="form-control" required placeholder="VD: support_staff" value={newRole.code} onChange={(e) => setNewRole({ ...newRole, code: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả chức vụ:</label>
                <textarea className="form-control" rows={3} placeholder="Mô tả nhiệm vụ của vai trò..." value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Tạo vai trò</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sửa vai trò */}
      {editRole && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '480px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '16px' }}>Chỉnh sửa vai trò: {editRole.name}</h3>
            <form onSubmit={handleUpdateRole}>
              <div className="form-group">
                <label className="form-label">Tên vai trò:</label>
                <input className="form-control" required value={editRole.name} onChange={(e) => setEditRole({ ...editRole, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả:</label>
                <textarea className="form-control" rows={3} value={editRole.description || ''} onChange={(e) => setEditRole({ ...editRole, description: e.target.value })} />
              </div>
              {!editRole.is_system && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="isActiveRole" checked={editRole.is_active} onChange={(e) => setEditRole({ ...editRole, is_active: e.target.checked })} />
                  <label htmlFor="isActiveRole" style={{ fontSize: '14px', cursor: 'pointer' }}>Đang hoạt động</label>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn" onClick={() => setEditRole(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ma trận Quyền hạn (Permissions) */}
      {permissionRole && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '720px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Phân quyền cho vai trò: {permissionRole.name}</h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Mã: {permissionRole.code} • Đã chọn {selectedPermissions.length} quyền</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              {catalog?.groups?.map((group) => {
                const groupCodes = group.permissions.map((p) => p.code);
                const isAllSelected = groupCodes.every((c) => selectedPermissions.includes(c));
                return (
                  <div key={group.module} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '10px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--primary-color)' }}>{group.name}</strong>
                      <button type="button" onClick={() => toggleGroup(group)} style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: 500 }}>
                        {isAllSelected ? 'Bỏ chọn nhóm' : 'Chọn tất cả nhóm'}
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                      {group.permissions.map((p) => {
                        const checked = selectedPermissions.includes(p.code);
                        return (
                          <label
                            key={p.code}
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px',
                              borderRadius: '6px', border: `1px solid ${checked ? '#93c5fd' : '#f1f5f9'}`,
                              background: checked ? '#eff6ff' : '#fafafa', cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(p.code)}
                              style={{ marginTop: '3px' }}
                            />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 500 }}>{p.name}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{p.code}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn" onClick={() => setPermissionRole(null)}>Hủy</button>
              <button type="button" className="btn btn-primary" onClick={handleSavePermissions}>Lưu phân quyền</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Roles;
