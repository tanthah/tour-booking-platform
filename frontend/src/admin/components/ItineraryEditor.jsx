import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

/**
 * ItineraryEditor Component - Quản lý lịch trình tour theo từng ngày
 * Cho phép thêm, xóa, sửa tiêu đề ngày và nội dung chi tiết
 * @param {Array} items - Danh sách các ngày lịch trình [{day_title, description}]
 * @param {Function} onChange - Callback khi danh sách lịch trình thay đổi
 */
const ItineraryEditor = ({ items = [], onChange }) => {
  // State quản lý trạng thái mở/đóng của từng ngày
  const [collapsed, setCollapsed] = useState({});

  // Thêm 1 ngày lịch trình mới
  const handleAdd = () => {
    const newDay = {
      day_title: `NGÀY ${items.length + 1} | `,
      description: '',
    };
    onChange([...items, newDay]);
  };

  // Xóa 1 ngày lịch trình theo vị trí index
  const handleRemove = (index) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Cập nhật trường dữ liệu của 1 ngày lịch trình
  const handleItemChange = (index, field, value) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  // Đóng/mở chi tiết ngày lịch trình
  const toggleCollapse = (index) => {
    setCollapsed((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div>
      {items.map((item, idx) => (
        <div key={idx} className="itinerary-item">
          <div className="itinerary-header">
            <GripVertical size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              className="form-control"
              placeholder={`Tiêu đề ngày ${idx + 1}...`}
              value={item.day_title}
              onChange={(e) => handleItemChange(idx, 'day_title', e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" className="icon-btn delete" onClick={() => handleRemove(idx)} title="Xóa ngày này">
              <Trash2 size={16} />
            </button>
            <button type="button" className="icon-btn" onClick={() => toggleCollapse(idx)} title="Đóng/Mở">
              {collapsed[idx] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>

          {/* Nội dung chi tiết ngày lịch trình */}
          {!collapsed[idx] && (
            <div className="itinerary-body">
              <textarea
                className="form-control"
                rows="4"
                placeholder={`Nội dung chi tiết ngày ${idx + 1}...`}
                value={item.description}
                onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
              />
            </div>
          )}
        </div>
      ))}

      <button type="button" className="btn-outline-add" onClick={handleAdd}>
        <Plus size={16} />
        <span>Thêm lịch trình</span>
      </button>
    </div>
  );
};

export default ItineraryEditor;

