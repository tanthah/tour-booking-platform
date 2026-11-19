import React from 'react';
import { RefreshCw, Inbox, AlertCircle } from 'lucide-react';
import AdminPagination from './AdminPagination';

/**
 * AdminDataTable - Component Bảng dữ liệu dùng chung chuẩn cho toàn bộ Admin
 * 
 * Đặc tả chuẩn:
 * - Tự động sinh cột "STT" ở vị trí đầu tiên (tính đúng theo phân trang)
 * - Đường kẻ ngang rõ ràng giữa header và từng dòng dữ liệu
 * - Hỗ trợ các trạng thái: Loading, Empty, Error
 * - Responsive cuộn ngang không vỡ giao diện
 * - Tự động tích hợp thanh phân trang AdminPagination ở chân bảng nếu có cấu hình
 * 
 * @param {Object} props
 * @param {Array} props.columns - Cấu hình các cột nghiệp vụ [{ key, title, width, align, render, hidden }]
 * @param {Array} props.data - Mảng dữ liệu hiển thị
 * @param {boolean} [props.loading] - Trạng thái đang tải dữ liệu
 * @param {string|null} [props.error] - Thông báo lỗi nếu tải thất bại
 * @param {string} [props.emptyText] - Văn bản khi không có dữ liệu
 * @param {number} [props.currentPage] - Trang hiện tại (mặc định 1)
 * @param {number} [props.pageSize] - Số dòng/trang (mặc định 10)
 * @param {number} [props.totalItems] - Tổng số bản ghi
 * @param {number} [props.totalPages] - Tổng số trang
 * @param {Function} [props.onPageChange] - Callback khi chuyển trang
 * @param {Function} [props.onPageSizeChange] - Callback khi đổi pageSize
 * @param {Function|string} [props.rowKey] - Khóa định danh dòng (mặc định '_id')
 * @param {boolean} [props.hideStt] - Ẩn cột STT nếu bảng đặc biệt không cần
 * @param {string} [props.className] - Class tuỳ biến
 */
function AdminDataTable({
  columns = [],
  data = [],
  loading = false,
  error = null,
  emptyText = 'Chưa có dữ liệu nào.',
  currentPage = 1,
  pageSize = 10,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  rowKey = '_id',
  hideStt = false,
  className = '',
}) {
  // Lọc các cột không bị ẩn
  const visibleColumns = columns.filter((col) => col && !col.hidden);

  // Tự động thêm cột STT ở đầu bảng nếu không bị ẩn
  const allColumns = hideStt
    ? visibleColumns
    : [
        {
          key: '__stt__',
          title: 'STT',
          width: '60px',
          align: 'center',
          render: (_row, index) => {
            const page = Number(currentPage) || 1;
            const size = Number(pageSize) || 10;
            return (page - 1) * size + index + 1;
          },
        },
        ...visibleColumns,
      ];

  const totalColSpan = allColumns.length;

  const getRowKey = (row, index) => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    if (typeof rowKey === 'string' && row[rowKey] !== undefined) return row[rowKey];
    return row._id || row.id || index;
  };

  const hasPagination = Boolean(
    onPageChange && (totalPages !== undefined || totalItems !== undefined)
  );

  return (
    <div className={`card admin-data-table-card ${className}`} style={{ padding: 0, overflow: 'hidden' }}>
      {/* Thông báo lỗi nếu có */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            borderBottom: '1px solid #fecaca',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Bảng dữ liệu có scroll ngang */}
      <div className="table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
        <table
          className="admin-table"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {allColumns.map((col) => (
                <th
                  key={col.key || col.title}
                  style={{
                    padding: '12px 16px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    width: col.width || 'auto',
                    textAlign: col.align || 'left',
                    whiteSpace: 'nowrap',
                    borderBottom: '2px solid #e2e8f0',
                  }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Trạng thái 1: Đang tải dữ liệu */}
            {loading ? (
              <tr>
                <td
                  colSpan={totalColSpan}
                  style={{
                    textAlign: 'center',
                    padding: '48px 16px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <RefreshCw size={24} className="spinning" style={{ color: 'var(--primary-color)' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              /* Trạng thái 2: Không có dữ liệu */
              <tr>
                <td
                  colSpan={totalColSpan}
                  style={{
                    textAlign: 'center',
                    padding: '48px 16px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Inbox size={36} style={{ color: '#cbd5e1' }} />
                    <span style={{ fontSize: '0.925rem', fontWeight: 500 }}>{emptyText}</span>
                  </div>
                </td>
              </tr>
            ) : (
              /* Trạng thái 3: Hiển thị các dòng dữ liệu */
              data.map((row, index) => {
                const k = getRowKey(row, index);
                return (
                  <tr
                    key={k}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {allColumns.map((col) => {
                      const colKey = col.key;
                      let content = null;

                      if (typeof col.render === 'function') {
                        content = col.render(row, index);
                      } else if (colKey) {
                        content = row[colKey] !== undefined && row[colKey] !== null ? String(row[colKey]) : '-';
                      }

                      return (
                        <td
                          key={colKey || col.title}
                          style={{
                            padding: '12px 16px',
                            fontSize: '0.875rem',
                            color: 'var(--text-main)',
                            verticalAlign: 'middle',
                            textAlign: col.align || 'left',
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Tích hợp Phân trang ở chân bảng */}
      {hasPagination && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages || Math.ceil((totalItems || 0) / (pageSize || 10)) || 1}
          totalItems={totalItems !== undefined ? totalItems : data.length}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}

export default AdminDataTable;

