import React from 'react';
import { Link } from 'react-router-dom';

/**
 * ActionButtons - Hiển thị nhóm nút hành động trong bảng dữ liệu (Xem, Sửa, Xóa, Lịch khởi hành...)
 * 
 * @param {Object} props
 * @param {Array} props.actions - Danh sách hành động:
 *   [{
 *     key: string,
 *     icon: React.ComponentType,
 *     title: string,
 *     label?: string,
 *     onClick?: Function,
 *     to?: string,
 *     variant?: 'view' | 'edit' | 'delete' | 'calendar' | 'refresh' | 'default',
 *     hidden?: boolean,
 *     disabled?: boolean,
 *     style?: Object
 *   }]
 * @param {string} [props.className] - Class tuỳ biến
 */
function ActionButtons({ actions = [], className = '' }) {
  const visibleActions = actions.filter((act) => act && !act.hidden);

  if (visibleActions.length === 0) return null;

  return (
    <div className={`action-btns ${className}`}>
      {visibleActions.map((act, index) => {
        const Icon = act.icon;
        const key = act.key || act.title || index;
        const variantClass = act.variant ? `icon-btn ${act.variant}` : 'icon-btn';
        const title = act.title || act.label || '';

        if (act.to) {
          return (
            <Link
              key={key}
              to={act.to}
              className={variantClass}
              title={title}
              aria-label={title}
              style={act.style}
            >
              {Icon && <Icon size={16} />}
            </Link>
          );
        }

        return (
          <button
            key={key}
            type="button"
            className={variantClass}
            title={title}
            aria-label={title}
            onClick={act.onClick}
            disabled={act.disabled}
            style={act.style}
          >
            {Icon && <Icon size={16} />}
          </button>
        );
      })}
    </div>
  );
}

export default ActionButtons;

