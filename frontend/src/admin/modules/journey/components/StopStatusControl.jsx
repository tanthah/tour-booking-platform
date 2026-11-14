import { useState } from 'react';
import { Navigation, MapPin, CheckCircle2, SkipForward, Clock, RotateCcw, MessageSquare } from 'lucide-react';
import { STOP_STATUS_META, formatTimeVN, formatDateTimeVN } from '../../../../user/modules/journey/journeyConstants';
import { updateStopStatus, updateStopNote } from '../journeyAdminService';

function StopStatusControl({
  journeyId,
  journeyStatus,
  stop,
  index,
  hasActiveOtherStop,
  onUpdated,
  onOpenSkip,
  onOpenAdjustTime,
  onError,
}) {
  const [busy, setBusy] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteInput, setNoteInput] = useState(stop.note || '');
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [exceptionTarget, setExceptionTarget] = useState('PENDING');
  const [exceptionReason, setExceptionReason] = useState('');

  const meta = STOP_STATUS_META[stop.status] || STOP_STATUS_META.PENDING;
  const isJourneyActive = journeyStatus === 'IN_PROGRESS';
  const canEditSchedule = !['COMPLETED', 'CANCELLED'].includes(journeyStatus);

  const handleTransition = async (nextStatus) => {
    try {
      setBusy(true);
      await updateStopStatus(journeyId, stop._id, {
        status: nextStatus,
        version: stop.version,
      });
      onUpdated();
    } catch (err) {
      onError(err?.message || 'Không thể cập nhật trạng thái điểm.');
    } finally {
      setBusy(false);
    }
  };

  const handleExceptionSubmit = async (e) => {
    e.preventDefault();
    if (!exceptionReason.trim()) {
      onError('Bắt buộc nhập lý do khi điều chỉnh trạng thái ngoại lệ.');
      return;
    }
    try {
      setBusy(true);
      await updateStopStatus(journeyId, stop._id, {
        status: exceptionTarget,
        is_exception: true,
        reason: exceptionReason.trim(),
        version: stop.version,
      });
      setShowExceptionForm(false);
      setExceptionReason('');
      onUpdated();
    } catch (err) {
      onError(err?.message || 'Không thể thực hiện điều chỉnh ngoại lệ.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    try {
      setBusy(true);
      await updateStopNote(journeyId, stop._id, {
        note: noteInput,
        reason: 'Nhân viên cập nhật ghi chú thực tế',
      });
      setShowNoteForm(false);
      onUpdated();
    } catch (err) {
      onError(err?.message || 'Không thể lưu ghi chú.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="p-3 rounded-3 mb-3 bg-white"
      style={{
        border:
          stop.status === 'VISITING'
            ? '2px solid #ea580c'
            : stop.status === 'TRAVELLING'
            ? '2px solid #2563eb'
            : '1px solid #e2e8f0',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
        <div className="d-flex align-items-center gap-2">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold text-white"
            style={{ width: '28px', height: '28px', backgroundColor: meta.markerBg, fontSize: '13px' }}
          >
            {index + 1}
          </span>
          <div>
            <div className="fw-bold" style={{ fontSize: '15px', color: '#0f172a' }}>
              {stop.name}
            </div>
            {stop.address && (
              <div className="text-muted" style={{ fontSize: '12px' }}>
                {stop.address}
              </div>
            )}
          </div>
        </div>

        <span
          className="px-2 py-1 rounded-pill fw-bold"
          style={{ backgroundColor: meta.bg, color: meta.color, fontSize: '12px' }}
        >
          {meta.label}
        </span>
      </div>

      <div className="d-flex flex-wrap gap-3 text-muted mb-2" style={{ fontSize: '12px' }}>
        {(stop.planned_start || stop.planned_end) && (
          <span>
            Dự kiến: {formatTimeVN(stop.planned_start)} – {formatTimeVN(stop.planned_end)}
          </span>
        )}
        {stop.arrived_at && <span>Đến: {formatDateTimeVN(stop.arrived_at)}</span>}
        {stop.completed_at && <span>Xong: {formatDateTimeVN(stop.completed_at)}</span>}
      </div>

      {stop.skipped_reason && (
        <div className="p-2 rounded bg-light small text-secondary mb-2">
          <strong>Lý do bỏ qua:</strong> {stop.skipped_reason}
        </div>
      )}

      {stop.note && (
        <div className="p-2 rounded small mb-2" style={{ backgroundColor: '#fefce8', color: '#854d0e' }}>
          <strong>Ghi chú:</strong> {stop.note}
        </div>
      )}

      {/* Các nút thao tác chính (tối ưu cho điện thoại) */}
      <div className="d-flex flex-wrap gap-2 mt-2">
        {isJourneyActive && stop.status === 'PENDING' && (
          <button
            type="button"
            disabled={busy || hasActiveOtherStop}
            className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1 fw-semibold py-2 px-3"
            onClick={() => handleTransition('TRAVELLING')}
            title={hasActiveOtherStop ? 'Hoàn thành điểm hiện tại trước khi di chuyển tiếp' : ''}
          >
            <Navigation size={15} /> Bắt đầu di chuyển đến
          </button>
        )}

        {isJourneyActive && stop.status === 'TRAVELLING' && (
          <button
            type="button"
            disabled={busy}
            className="btn btn-sm text-white d-inline-flex align-items-center gap-1 fw-semibold py-2 px-3"
            style={{ backgroundColor: '#ea580c' }}
            onClick={() => handleTransition('VISITING')}
          >
            <MapPin size={15} /> Xác nhận đã đến
          </button>
        )}

        {isJourneyActive && stop.status === 'VISITING' && (
          <button
            type="button"
            disabled={busy}
            className="btn btn-sm btn-success d-inline-flex align-items-center gap-1 fw-semibold py-2 px-3"
            onClick={() => handleTransition('COMPLETED')}
          >
            <CheckCircle2 size={15} /> Hoàn thành điểm
          </button>
        )}

        {canEditSchedule && !['COMPLETED', 'SKIPPED'].includes(stop.status) && (
          <button
            type="button"
            disabled={busy}
            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
            onClick={() => onOpenSkip(stop)}
          >
            <SkipForward size={14} /> Bỏ qua
          </button>
        )}

        {canEditSchedule && (
          <button
            type="button"
            disabled={busy}
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
            onClick={() => onOpenAdjustTime(stop)}
          >
            <Clock size={14} /> Sửa giờ
          </button>
        )}

        <button
          type="button"
          className="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-1"
          onClick={() => {
            setNoteInput(stop.note || '');
            setShowNoteForm(!showNoteForm);
          }}
        >
          <MessageSquare size={14} /> Ghi chú
        </button>

        {isJourneyActive && (
          <button
            type="button"
            className="btn btn-sm btn-outline-warning text-dark d-inline-flex align-items-center gap-1"
            onClick={() => setShowExceptionForm(!showExceptionForm)}
          >
            <RotateCcw size={14} /> Điều chỉnh trạng thái
          </button>
        )}
      </div>

      {/* Form ghi chú nhanh */}
      {showNoteForm && (
        <form onSubmit={handleSaveNote} className="mt-2 p-2 rounded border bg-light">
          <div className="input-group input-group-sm">
            <input
              type="text"
              className="form-control"
              placeholder="Nhập ghi chú sự kiện bất thường hoặc lưu ý..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
            />
            <button type="submit" className="btn btn-dark" disabled={busy}>
              Lưu
            </button>
          </div>
        </form>
      )}

      {/* Form sửa trạng thái nhầm / ngoại lệ */}
      {showExceptionForm && (
        <form onSubmit={handleExceptionSubmit} className="mt-2 p-2 rounded border bg-light">
          <div className="small fw-bold text-warning-emphasis mb-2">
            Điều chỉnh trạng thái ngoại lệ (ví dụ khi bấm nhầm — bắt buộc lý do, lưu lịch sử)
          </div>
          <div className="row g-2">
            <div className="col-sm-4">
              <select
                className="form-select form-select-sm"
                value={exceptionTarget}
                onChange={(e) => setExceptionTarget(e.target.value)}
              >
                <option value="PENDING">Chưa đến</option>
                <option value="TRAVELLING">Đang di chuyển</option>
                <option value="VISITING">Đang tham quan</option>
                <option value="COMPLETED">Hoàn thành</option>
              </select>
            </div>
            <div className="col-sm-5">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Lý do điều chỉnh *"
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                required
              />
            </div>
            <div className="col-sm-3 d-flex gap-1">
              <button type="submit" className="btn btn-sm btn-warning w-100 fw-semibold" disabled={busy}>
                Áp dụng
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default StopStatusControl;
