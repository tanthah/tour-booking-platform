import { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { adjustStopTime } from '../journeyAdminService';

const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

function AdjustTimeModal({ show, journeyId, stop, onClose, onSuccess }) {
  const [plannedStart, setPlannedStart] = useState('');
  const [plannedEnd, setPlannedEnd] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && stop) {
      setPlannedStart(toLocalInput(stop.planned_start));
      setPlannedEnd(toLocalInput(stop.planned_end));
      setReason('');
      setNote('');
      setError('');
    }
  }, [show, stop]);

  if (!show || !stop) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Bắt buộc nhập lý do điều chỉnh thời gian.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await adjustStopTime(journeyId, stop._id, {
        planned_start: plannedStart ? new Date(plannedStart).toISOString() : null,
        planned_end: plannedEnd ? new Date(plannedEnd).toISOString() : null,
        reason: reason.trim(),
        note: note.trim(),
        version: stop.version,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.message || 'Không thể điều chỉnh thời gian.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
            <Clock size={18} color="#2563eb" /> Điều chỉnh giờ dự kiến
          </h5>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className="mb-3 p-2 rounded bg-light small">
          <strong>Địa điểm:</strong> {stop.name}
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row g-2 mb-3">
            <div className="col-6">
              <label className="form-label fw-semibold small">Giờ bắt đầu dự kiến</label>
              <input
                type="datetime-local"
                className="form-control"
                value={plannedStart}
                onChange={(e) => setPlannedStart(e.target.value)}
              />
            </div>
            <div className="col-6">
              <label className="form-label fw-semibold small">Giờ kết thúc dự kiến</label>
              <input
                type="datetime-local"
                className="form-control"
                value={plannedEnd}
                onChange={(e) => setPlannedEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold small text-danger">Lý do điều chỉnh (Bắt buộc) *</label>
            <input
              type="text"
              className="form-control"
              placeholder="VD: Kẹt xe trên tuyến đường di chuyển..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold small">Ghi chú</label>
            <input
              type="text"
              className="form-control"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light border" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1050,
  padding: '16px',
};

const modalStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '14px',
  padding: '24px',
  width: '100%',
  maxWidth: '480px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
};

export default AdjustTimeModal;

