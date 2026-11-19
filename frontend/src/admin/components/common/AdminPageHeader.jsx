import React from 'react';

/**
 * AdminPageHeader - Component hiển thị tiêu đề và nhóm nút hành động chính của trang Admin
 * 
 * @param {Object} props
 * @param {string|React.ReactNode} props.title - Tiêu đề chính của trang
 * @param {string|React.ReactNode} [props.subtitle] - Mô tả phụ dưới tiêu đề
 * @param {React.ReactNode} [props.actions] - Nhóm nút hành động bên phải (Làm mới, Thêm mới...)
 * @param {string} [props.className] - Class tuỳ biến
 */
function AdminPageHeader({ title, subtitle, actions, className = '', children }) {
  return (
    <div className={`page-header ${className}`}>
      <div className="page-header-title">
        <h1 className="page-title">{title}</h1>
        {subtitle && (
          <p className="page-subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px', marginBottom: 0 }}>
            {subtitle}
          </p>
        )}
      </div>

      {(actions || children) && (
        <div className="page-header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}

export default AdminPageHeader;

