import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { skipStop } from '../journeyAdminService';

function SkipStopModal({ show, journeyId, stop, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setReason('');
      setNote('');
      setError('');
    }
  }, [show, stop]);

  if (!show || !stop) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Bắt buộc phải nhập lý do khi bỏ qua địa điểm.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await skipStop(journeyId, stop._id, {
        reason: reason.trim(),
        note: note.trim(),
        version: stop.version,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.message || 'Không thể bỏ qua điểm dừng.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <h5 className="mb-0 fw-bold text-danger d-flex align-items-center gap-2">
            <AlertTriangle size={20} /> Xác nhận bỏ qua địa điểm
          </h5>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className="alert alert-warning py-2 small">
          Bạn sắp bỏ qua địa điểm <strong>"{stop.name}"</strong>. Điểm bị bỏ qua sẽ không được tính vào số điểm hoàn thành và sẽ đồng bộ thông báo ngay cho khách hàng.
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Lý do bỏ qua (Bắt buộc) *</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="VD: Địa điểm đóng cửa đột xuất / Mưa bão không thể di chuyển..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Ghi chú bổ sung</label>
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
            <button type="submit" className="btn btn-danger" disabled={saving}>
              {saving ? 'Đang xử lý...' : 'Xác nhận bỏ qua'}
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

export default SkipStopModal;

