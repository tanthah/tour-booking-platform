import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getAvailableDeparturesAdmin, createJourneyAdmin } from '../journeyAdminService';
import { formatDateTimeVN } from '../../../../user/modules/journey/journeyConstants';

function CreateJourneyModal({ show, guides = [], onClose, onSuccess }) {
  const [departures, setDepartures] = useState([]);
  const [departureId, setDepartureId] = useState('');
  const [guideId, setGuideId] = useState('');
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) return;
    setError('');
    setDepartureId('');
    setGuideId('');
    const load = async () => {
      try {
        setLoadingDeps(true);
        const res = await getAvailableDeparturesAdmin();
        setDepartures(res?.data || []);
      } catch (err) {
        setError(err?.message || 'Không thể tải danh sách đợt khởi hành.');
      } finally {
        setLoadingDeps(false);
      }
    };
    load();
  }, [show]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!departureId) {
      setError('Vui lòng chọn đợt khởi hành.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await createJourneyAdmin({
        departure_id: departureId,
        guide_id: guideId || null,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.message || 'Không thể khởi tạo hành trình.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <h5 className="mb-0 fw-bold">Khởi tạo Hành trình mới</h5>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <p className="text-muted" style={{ fontSize: '13px' }}>
          Hệ thống sẽ tự động sao chép lịch trình mẫu của Tour sang danh sách điểm dừng thực tế cho đợt khởi hành được chọn.
        </p>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Đợt khởi hành *</label>
            {loadingDeps ? (
              <div className="text-muted small">Đang tải danh sách...</div>
            ) : (
              <select
                className="form-select"
                value={departureId}
                onChange={(e) => setDepartureId(e.target.value)}
                required
              >
                <option value="">-- Chọn đợt khởi hành --</option>
                {departures.map((d) => (
                  <option key={d._id} value={d._id}>
                    [{d.product_id?.code}] {d.product_id?.title} — {formatDateTimeVN(d.start_datetime)} ({d.booked_slots}/{d.total_slots} khách)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Phân công Hướng dẫn viên (tùy chọn)</label>
            <select
              className="form-select"
              value={guideId}
              onChange={(e) => setGuideId(e.target.value)}
            >
              <option value="">-- Phân công sau --</option>
              {guides.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.full_name} ({g.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light border" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || loadingDeps}>
              {saving ? 'Đang khởi tạo...' : 'Khởi tạo hành trình'}
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
  maxWidth: '540px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
};

export default CreateJourneyModal;
