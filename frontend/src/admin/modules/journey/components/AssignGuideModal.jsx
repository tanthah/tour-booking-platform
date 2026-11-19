import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { assignGuideAdmin } from '../journeyAdminService';

function AssignGuideModal({ show, journey, guides = [], onClose, onSuccess }) {
  const [guideId, setGuideId] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && journey) {
      setGuideId(journey.guide_id?._id || journey.guide_id || '');
      setReason('');
      setError('');
    }
  }, [show, journey]);

  if (!show || !journey) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await assignGuideAdmin(journey._id, {
        guide_id: guideId || null,
        reason: reason.trim() || 'Phân công nhân viên hướng dẫn',
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.message || 'Không thể phân công nhân viên.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-card" style={modalStyle}>
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <h5 className="mb-0 fw-bold">Phân công Nhân viên Hướng dẫn</h5>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className="mb-3 p-2 rounded-2 bg-light" style={{ fontSize: '13.5px' }}>
          <div><strong>Tour:</strong> {journey.tour_id?.title}</div>
          <div className="text-muted">Mã: {journey.tour_id?.code}</div>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Chọn nhân viên phụ trách</label>
            <select
              className="form-select"
              value={guideId}
              onChange={(e) => setGuideId(e.target.value)}
            >
              <option value="">-- Chưa phân công --</option>
              {guides.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.full_name} ({g.email} - {g.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Lý do / Ghi chú phân công</label>
            <input
              type="text"
              className="form-control"
              placeholder="VD: Phân công HDV chuyên tuyến..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light border" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Xác nhận phân công'}
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

export default AssignGuideModal;

