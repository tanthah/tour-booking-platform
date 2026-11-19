import { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { addStop } from '../journeyAdminService';
import JourneyMap from '../../../../user/modules/journey/components/JourneyMap';

function AddStopModal({ show, journeyId, stops = [], onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('16.0544');
  const [longitude, setLongitude] = useState('108.2022');
  const [dayNumber, setDayNumber] = useState(1);
  const [plannedStart, setPlannedStart] = useState('');
  const [plannedEnd, setPlannedEnd] = useState('');
  const [insertAfterStopId, setInsertAfterStopId] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) return;
    setError('');
    setName('');
    setAddress('');
    setDescription('');
    const first = stops[0];
    setLatitude(first ? String(first.latitude) : '16.0544');
    setLongitude(first ? String(first.longitude) : '108.2022');
    setDayNumber(1);
    setPlannedStart('');
    setPlannedEnd('');
    setInsertAfterStopId('');
    setReason('');
    setNote('');
  }, [show, stops]);

  if (!show) return null;

  const handleMapClick = ({ lat, lng }) => {
    setLatitude(String(lat));
    setLongitude(String(lng));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !reason.trim()) {
      setError('Vui lòng nhập đầy đủ Tên địa điểm và Lý do phát sinh.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await addStop(journeyId, {
        name: name.trim(),
        address: address.trim(),
        description: description.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        day_number: Number(dayNumber) || 1,
        planned_start: plannedStart ? new Date(plannedStart).toISOString() : null,
        planned_end: plannedEnd ? new Date(plannedEnd).toISOString() : null,
        insert_after_stop_id: insertAfterStopId || null,
        reason: reason.trim(),
        note: note.trim(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.message || 'Không thể thêm điểm phát sinh.');
    } finally {
      setSaving(false);
    }
  };

  const pickedCoords =
    !isNaN(Number(latitude)) && !isNaN(Number(longitude))
      ? { lat: Number(latitude), lng: Number(longitude) }
      : null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
            <MapPin size={18} color="#ea580c" /> Thêm địa điểm phát sinh
          </h5>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <div className="mb-2">
                <label className="form-label fw-semibold small">Tên địa điểm *</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="form-label fw-semibold small">Địa chỉ</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="mb-2">
                <label className="form-label fw-semibold small">Mô tả ngắn</label>
                <textarea
                  className="form-control form-control-sm"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label className="form-label fw-semibold small">Vĩ độ (Lat) *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control form-control-sm"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label fw-semibold small">Kinh độ (Lng) *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control form-control-sm"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label className="form-label fw-semibold small">Dự kiến bắt đầu</label>
                  <input
                    type="datetime-local"
                    className="form-control form-control-sm"
                    value={plannedStart}
                    onChange={(e) => setPlannedStart(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label fw-semibold small">Dự kiến kết thúc</label>
                  <input
                    type="datetime-local"
                    className="form-control form-control-sm"
                    value={plannedEnd}
                    onChange={(e) => setPlannedEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="row g-2 mb-2">
                <div className="col-4">
                  <label className="form-label fw-semibold small">Ngày thứ</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control form-control-sm"
                    value={dayNumber}
                    onChange={(e) => setDayNumber(e.target.value)}
                  />
                </div>
                <div className="col-8">
                  <label className="form-label fw-semibold small">Chèn vào vị trí</label>
                  <select
                    className="form-select form-select-sm"
                    value={insertAfterStopId}
                    onChange={(e) => setInsertAfterStopId(e.target.value)}
                  >
                    <option value="">-- Cuối hành trình --</option>
                    {stops.map((s, idx) => (
                      <option key={s._id} value={s._id}>
                        Sau #{idx + 1}. {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-2">
                <label className="form-label fw-semibold small text-danger">Lý do phát sinh (Bắt buộc) *</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="VD: Thời tiết xấu, đổi điểm tham quan thay thế..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="form-label fw-semibold small">Ghi chú thêm</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="small text-muted mb-1">
                Nhấp trực tiếp lên bản đồ để chọn tọa độ điểm phát sinh:
              </div>
              <JourneyMap
                stops={stops}
                onMapClick={handleMapClick}
                pickedCoords={pickedCoords}
                height="360px"
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3 pt-2 border-top">
            <button type="button" className="btn btn-light border" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Đang thêm...' : 'Thêm điểm phát sinh'}
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
  padding: '22px',
  width: '100%',
  maxWidth: '880px',
  maxHeight: '92vh',
  overflowY: 'auto',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
};

export default AddStopModal;
