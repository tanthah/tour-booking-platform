import React from 'react';

/**
 * StatusBadge - Hiển thị nhãn trạng thái bằng màu sắc thống nhất
 * 
 * @param {Object} props
 * @param {string} props.status - Mã trạng thái
 * @param {Object} [props.statusMap] - Bảng ánh xạ { [status]: { label, color, bg, border, className } }
 * @param {string} [props.label] - Nhãn hiển thị trực tiếp nếu không dùng statusMap
 * @param {string} [props.className] - Class tuỳ biến
 * @param {Object} [props.style] - Style tuỳ biến
 */
function StatusBadge({ status, statusMap, label, className = '', style = {} }) {
  const config = statusMap && status ? statusMap[status] : null;

  const displayLabel = label || config?.label || status || 'N/A';
  const customClass = config?.className || '';
  const inlineBg = config?.bg || (config?.className ? undefined : '#f1f5f9');
  const inlineColor = config?.color || (config?.className ? undefined : '#475569');
  const inlineBorder = config?.border ? `1px solid ${config.border}` : undefined;

  return (
    <span
      className={`status-badge ${customClass} ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: '1.2',
        whiteSpace: 'nowrap',
        backgroundColor: inlineBg,
        color: inlineColor,
        border: inlineBorder,
        ...style,
      }}
    >
      {displayLabel}
    </span>
  );
}

export default StatusBadge;

