import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Filter } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (actionFilter) params.action = actionFilter;

      const res = await axiosAdmin.get('/admin/audit-logs', { params });
      setLogs(res.data?.items || []);
      setPagination(res.data?.pagination || { page: 1, limit: 20, total: 0, total_pages: 1 });
    } catch (err) {
      alert(err.message || 'Không thể tải nhật ký hệ thống');
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const getActionBadge = (action) => {
    let bg = '#f1f5f9', color = '#475569', label = action;
    switch (action) {
      case 'CHANGE_ROLE':
        bg = '#eff6ff'; color = '#2563eb'; label = 'Đổi vai trò'; break;
      case 'CHANGE_STATUS':
        bg = '#fef2f2'; color = '#dc2626'; label = 'Đổi trạng thái'; break;
      case 'SET_PERMISSION_OVERRIDE':
        bg = '#fdf4ff'; color = '#c026d3'; label = 'Cấu hình quyền riêng'; break;
      case 'CREATE_ROLE':
        bg = '#ecfdf5'; color = '#059669'; label = 'Tạo vai trò'; break;
      case 'UPDATE_ROLE':
        bg = '#fffbeb'; color = '#d97706'; label = 'Cập nhật vai trò'; break;
      case 'UPDATE_ROLE_PERMISSIONS':
        bg = '#f0fdf4'; color = '#16a34a'; label = 'Phân quyền vai trò'; break;
      default:
        break;
    }
    return (
      <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: bg, color }}>
        {label}
      </span>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nhật ký Hệ thống (Audit Logs)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Theo dõi chi tiết mọi thay đổi vai trò, phân quyền và khóa/mở khóa tài khoản
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => fetchLogs(pagination.page)}>
          <RefreshCw size={16} /> <span>Làm mới</span>
        </button>
      </div>

      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Filter size={18} color="var(--text-muted)" />
          <select className="form-control" style={{ width: '240px' }} value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">Tất cả hành động</option>
            <option value="CHANGE_ROLE">Đổi vai trò (CHANGE_ROLE)</option>
            <option value="CHANGE_STATUS">Đổi trạng thái (CHANGE_STATUS)</option>
            <option value="SET_PERMISSION_OVERRIDE">Cấu hình quyền riêng (SET_PERMISSION_OVERRIDE)</option>
            <option value="CREATE_ROLE">Tạo vai trò (CREATE_ROLE)</option>
            <option value="UPDATE_ROLE">Cập nhật vai trò (UPDATE_ROLE)</option>
            <option value="UPDATE_ROLE_PERMISSIONS">Phân quyền vai trò (UPDATE_ROLE_PERMISSIONS)</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ padding: '24px', textAlign: 'center' }}>Đang tải nhật ký...</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Người thực hiện (Actor)</th>
                  <th>Hành động</th>
                  <th>Đối tượng (Target)</th>
                  <th>Lý do</th>
                  <th>Địa chỉ IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Chưa có nhật ký ghi nhận</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.actor_user_id?.full_name || 'Hệ thống'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.actor_user_id?.email || ''}</div>
                      </td>
                      <td>{getActionBadge(log.action)}</td>
                      <td>
                        {log.target_user_id ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>{log.target_user_id.full_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.target_user_id.email}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>{log.resource}</span>
                        )}
                      </td>
                      <td style={{ fontSize: '13px' }}>{log.reason || '-'}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {pagination.total_pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Tổng cộng {pagination.total} bản ghi (Trang {pagination.page}/{pagination.total_pages})
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn" disabled={pagination.page <= 1} onClick={() => fetchLogs(pagination.page - 1)}>Trang trước</button>
              <button className="btn" disabled={pagination.page >= pagination.total_pages} onClick={() => fetchLogs(pagination.page + 1)}>Trang sau</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogs;
