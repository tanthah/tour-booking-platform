import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowUp, ArrowDown, Save, X } from 'lucide-react';
import { reorderStops } from '../journeyAdminService';
import { STOP_STATUS_META } from '../../../../user/modules/journey/journeyConstants';

function SortableStopItem({ stop, index, total, onMove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stop._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '10px 12px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  };

  const meta = STOP_STATUS_META[stop.status] || STOP_STATUS_META.PENDING;

  return (
    <div ref={setNodeRef} style={style}>
      <div className="d-flex align-items-center gap-2">
        <span
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab', color: '#64748b', display: 'inline-flex' }}
          title="Kéo để sắp xếp"
        >
          <GripVertical size={18} />
        </span>
        <span className="fw-bold text-muted" style={{ minWidth: '24px' }}>
          #{index + 1}
        </span>
        <div>
          <div className="fw-semibold" style={{ fontSize: '14px' }}>
            {stop.name}
          </div>
          <span className="badge" style={{ backgroundColor: meta.bg, color: meta.color, fontSize: '11px' }}>
            {meta.label}
          </span>
        </div>
      </div>

      <div className="d-flex gap-1">
        <button
          type="button"
          className="btn btn-sm btn-light border"
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
          title="Đưa lên"
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button"
          className="btn btn-sm btn-light border"
          disabled={index === total - 1}
          onClick={() => onMove(index, index + 1)}
          title="Đưa xuống"
        >
          <ArrowDown size={14} />
        </button>
      </div>
    </div>
  );
}

function ReorderStops({ journeyId, journeyVersion, stops = [], onCancel, onSuccess }) {
  const [items, setItems] = useState(stops);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setItems(stops);
  }, [stops]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor)
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIdx = prev.findIndex((i) => i._id === active.id);
      const newIdx = prev.findIndex((i) => i._id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const handleMove = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= items.length) return;
    setItems((prev) => arrayMove(prev, fromIdx, toIdx));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Bắt buộc phải nhập lý do thay đổi thứ tự lịch trình.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await reorderStops(journeyId, {
        ordered_stop_ids: items.map((s) => s._id),
        reason: reason.trim(),
        version: journeyVersion,
      });
      onSuccess();
    } catch (err) {
      setError(err?.message || 'Không thể lưu thứ tự mới.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="p-3 rounded-3 border bg-light mb-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0 fw-bold">Sắp xếp lại thứ tự các điểm dừng</h6>
        <button type="button" className="btn btn-sm btn-link text-muted p-0" onClick={onCancel}>
          <X size={18} />
        </button>
      </div>
      <p className="text-muted small mb-3">
        Kéo thả hoặc dùng nút mũi tên để đổi thứ tự. Mọi thay đổi sẽ được ghi log và đồng bộ trực tiếp tới khách hàng.
      </p>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
          {items.map((stop, idx) => (
            <SortableStopItem
              key={stop._id}
              stop={stop}
              index={idx}
              total={items.length}
              onMove={handleMove}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="mt-3">
        <label className="form-label fw-semibold small text-danger">
          Lý do đổi thứ tự lịch trình (Bắt buộc) *
        </label>
        <input
          type="text"
          className="form-control form-control-sm mb-3"
          placeholder="VD: Đảo điểm tham quan buổi chiều lên sáng để tránh kẹt xe..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-sm btn-light border" onClick={onCancel}>
            Hủy
          </button>
          <button type="submit" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1" disabled={saving}>
            <Save size={14} /> {saving ? 'Đang lưu...' : 'Lưu thứ tự mới'}
          </button>
        </div>
      </div>
    </form>
  );
}

export default ReorderStops;
