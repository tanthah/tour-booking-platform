import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * AdminPagination - Component phân trang chuẩn cho Admin
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Trang hiện tại (1-indexed)
 * @param {number} props.totalPages - Tổng số trang
 * @param {number} props.totalItems - Tổng số bản ghi
 * @param {number} [props.pageSize] - Số dòng trên mỗi trang
 * @param {Array<number>} [props.pageSizeOptions] - Các tuỳ chọn số dòng/trang
 * @param {Function} props.onPageChange - Callback khi chuyển trang (page: number)
 * @param {Function} [props.onPageSizeChange] - Callback khi đổi pageSize (size: number)
 * @param {string} [props.className] - Class tuỳ biến
 */
function AdminPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
  className = '',
}) {
  if (totalItems === 0 && totalPages <= 1) return null;

  const startRecord = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endRecord = Math.min(currentPage * pageSize, totalItems);

  // Tính danh sách các trang cần hiển thị (tối đa 5 nút trang quanh currentPage)
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`admin-pagination ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderTop: '1px solid #e2e8f0',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      {/* Thông tin số bản ghi */}
      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Hiển thị <strong>{startRecord} - {endRecord}</strong> trên tổng <strong>{totalItems}</strong> bản ghi
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Tuỳ chọn số dòng/trang nếu hỗ trợ */}
        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <span>Số dòng:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Các nút chuyển trang */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {/* Nút Về đầu */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            title="Trang đầu"
            style={{ minWidth: '32px', padding: '6px 8px' }}
          >
            <ChevronsLeft size={14} />
          </button>

          {/* Nút Trước */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            title="Trang trước"
            style={{ minWidth: '32px', padding: '6px 8px' }}
          >
            <ChevronLeft size={14} />
          </button>

          {/* Dấu ... đầu nếu trang quá xa */}
          {pages[0] > 1 && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onPageChange(1)}
                style={{ minWidth: '32px', padding: '6px 10px' }}
              >
                1
              </button>
              {pages[0] > 2 && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
            </>
          )}

          {/* Các nút số trang */}
          {pages.map((p) => {
            const isActive = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                className={isActive ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                onClick={() => onPageChange(p)}
                style={{
                  minWidth: '32px',
                  padding: '6px 10px',
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {p}
              </button>
            );
          })}

          {/* Dấu ... cuối nếu còn trang xa */}
          {pages[pages.length - 1] < totalPages && (
            <>
              {pages[pages.length - 1] < totalPages - 1 && (
                <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>
              )}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onPageChange(totalPages)}
                style={{ minWidth: '32px', padding: '6px 10px' }}
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Nút Sau */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            title="Trang sau"
            style={{ minWidth: '32px', padding: '6px 8px' }}
          >
            <ChevronRight size={14} />
          </button>

          {/* Nút Về cuối */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            title="Trang cuối"
            style={{ minWidth: '32px', padding: '6px 8px' }}
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminPagination;

