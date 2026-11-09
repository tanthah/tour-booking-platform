import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminDataTable,
} from '../components/common';

const ACTION_MAP = {
  CHANGE_ROLE: { bg: '#eff6ff', color: '#2563eb', label: 'Đổi vai trò' },
  CHANGE_STATUS: { bg: '#fef2f2', color: '#dc2626', label: 'Đổi trạng thái' },
  SET_PERMISSION_OVERRIDE: { bg: '#fdf4ff', color: '#c026d3', label: 'Cấu hình quyền riêng' },
  CREATE_ROLE: { bg: '#ecfdf5', color: '#059669', label: 'Tạo vai trò' },
  UPDATE_ROLE: { bg: '#fffbeb', color: '#d97706', label: 'Cập nhật vai trò' },
  UPDATE_ROLE_PERMISSIONS: { bg: '#f0fdf4', color: '#16a34a', label: 'Phân quyền vai trò' },
};

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = useCallback(
    async (page = 1, limit = pagination.limit || 20) => {
      try {
        setLoading(true);
        setError(null);
        const params = { page, limit };
        if (actionFilter) params.action = actionFilter;

        const res = await axiosAdmin.get('/admin/audit-logs', { params });
        setLogs(res.data?.items || []);
        setPagination(
          res.data?.pagination || { page, limit, total: 0, total_pages: 1 }
        );
      } catch (err) {
        setError(err.message || 'Không thể tải nhật ký hệ thống');
      } finally {
        setLoading(false);
      }
    },
    [actionFilter, pagination.limit]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleClearFilters = () => {
    setActionFilter('');
    fetchLogs(1);
  };

  const getActionBadge = (action) => {
    const config = ACTION_MAP[action] || { bg: '#f1f5f9', color: '#475569', label: action };
    return (
      <span
        style={{
          padding: '3px 8px',
          borderRadius: '10px',
          fontSize: '11px',
          fontWeight: 600,
          background: config.bg,
          color: config.color,
          whiteSpace: 'nowrap',
        }}
      >
        {config.label}
      </span>
    );
  };

  const columns = [
    {
      key: 'created_at',
      title: 'Thời gian',
      width: '160px',
      render: (log) => (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {new Date(log.created_at).toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'actor',
      title: 'Người thực hiện (Actor)',
      render: (log) => (
        <div>
          <div style={{ fontWeight: 600 }}>{log.actor_user_id?.full_name || 'Hệ thống'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {log.actor_user_id?.email || ''}
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      title: 'Hành động',
      width: '160px',
      render: (log) => getActionBadge(log.action),
    },
    {
      key: 'target',
      title: 'Đối tượng (Target)',
      render: (log) =>
        log.target_user_id ? (
          <div>
            <div style={{ fontWeight: 500 }}>{log.target_user_id.full_name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {log.target_user_id.email}
            </div>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{log.resource}</span>
        ),
    },
    {
      key: 'reason',
      title: 'Lý do',
      render: (log) => (
        <span style={{ fontSize: '13px' }}>{log.reason || '-'}</span>
      ),
    },
    {
      key: 'ip_address',
      title: 'Địa chỉ IP',
      width: '130px',
      render: (log) => (
        <code style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {log.ip_address || '127.0.0.1'}
        </code>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Nhật ký Hệ thống (Audit Logs)"
        subtitle="Theo dõi chi tiết mọi thay đổi vai trò, phân quyền và khóa/mở khóa tài khoản"
        actions={
          <button className="btn btn-secondary" onClick={() => fetchLogs(pagination.page)} title="Làm mới danh sách">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>Làm mới</span>
          </button>
        }
      />

      <AdminFilterBar
        filters={[
          {
            key: 'action',
            value: actionFilter,
            onChange: setActionFilter,
            placeholder: 'Tất cả hành động',
            options: [
              { value: 'CHANGE_ROLE', label: 'Đổi vai trò (CHANGE_ROLE)' },
              { value: 'CHANGE_STATUS', label: 'Đổi trạng thái (CHANGE_STATUS)' },
              { value: 'SET_PERMISSION_OVERRIDE', label: 'Cấu hình quyền riêng (SET_PERMISSION_OVERRIDE)' },
              { value: 'CREATE_ROLE', label: 'Tạo vai trò (CREATE_ROLE)' },
              { value: 'UPDATE_ROLE', label: 'Cập nhật vai trò (UPDATE_ROLE)' },
              { value: 'UPDATE_ROLE_PERMISSIONS', label: 'Phân quyền vai trò (UPDATE_ROLE_PERMISSIONS)' },
            ],
            width: '280px',
          },
        ]}
        onClearFilters={handleClearFilters}
      />

      <AdminDataTable
        columns={columns}
        data={logs}
        loading={loading}
        error={error}
        emptyText="Chưa có nhật ký ghi nhận nào."
        currentPage={pagination.page}
        pageSize={pagination.limit}
        totalItems={pagination.total}
        totalPages={pagination.total_pages}
        onPageChange={(p) => fetchLogs(p, pagination.limit)}
        onPageSizeChange={(newLimit) => fetchLogs(1, newLimit)}
      />
    </div>
  );
}

export default AuditLogs;
