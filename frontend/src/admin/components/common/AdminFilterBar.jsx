import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

/**
 * AdminFilterBar - Khung tìm kiếm và các bộ lọc dùng chung cho trang Admin
 * BẮT BUỘC luôn có nút "Xóa lọc" ở cuối để đưa bộ lọc về mặc định
 * 
 * @param {Object} props
 * @param {string} [props.searchValue] - Giá trị từ khoá tìm kiếm
 * @param {Function} [props.onSearchChange] - Hàm khi đổi từ khoá
 * @param {string} [props.searchPlaceholder] - Placeholder ô tìm kiếm
 * @param {Array} [props.filters] - Danh sách bộ lọc dropdown [{ key, value, onChange, options: [{value, label}], width, placeholder }]
 * @param {Function} props.onClearFilters - Callback khi nhấn nút Xóa lọc (Bắt buộc)
 * @param {Function} [props.onSearchSubmit] - Callback khi submit tìm kiếm (Enter hoặc nút tìm)
 * @param {boolean} [props.showSearchBtn] - Có hiển thị nút Tìm kiếm chủ động hay không
 * @param {React.ReactNode} [props.extraActions] - Các nút hoặc control bổ sung bên phải
 * @param {string} [props.className] - Class tuỳ biến
 */
function AdminFilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  filters = [],
  onClearFilters,
  onSearchSubmit,
  showSearchBtn = false,
  extraActions,
  className = '',
  children,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      e.preventDefault();
      onSearchSubmit();
    }
  };

  return (
    <div className={`card admin-filter-bar ${className}`} style={{ marginBottom: '16px', padding: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Ô Tìm kiếm */}
        {onSearchChange && (
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              className="form-control"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ paddingLeft: '36px' }}
            />
          </div>
        )}

        {/* Các dropdown bộ lọc */}
        {filters.map((filter) => (
          <div key={filter.key || filter.label} style={{ width: filter.width || '180px', minWidth: '140px' }}>
            <select
              className="form-control"
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              aria-label={filter.label || 'Bộ lọc'}
            >
              {filter.placeholder && <option value="">{filter.placeholder}</option>}
              {filter.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Nội dung tuỳ biến chèn thêm */}
        {children}

        {/* Nút Tìm kiếm chủ động (nếu cần) */}
        {showSearchBtn && onSearchSubmit && (
          <button type="button" className="btn btn-primary" onClick={onSearchSubmit} title="Tìm kiếm">
            <Search size={16} />
            <span>Tìm kiếm</span>
          </button>
        )}

        {/* NÚT XÓA LỌC — BẮT BUỘC THEO NGUYÊN TẮC GIAO DIỆN */}
        {onClearFilters && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClearFilters}
            title="Xóa toàn bộ bộ lọc và đặt lại trang 1"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={15} />
            <span>Xóa lọc</span>
          </button>
        )}

        {/* Nút bổ sung bên phải nếu có */}
        {extraActions && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            {extraActions}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminFilterBar;

