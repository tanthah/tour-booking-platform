import { MapPin, Clock, CheckCircle2, Navigation, SkipForward, PlusCircle, MessageSquare } from 'lucide-react';
import { STOP_STATUS_META, formatTimeVN, formatDateTimeVN } from '../journeyConstants';

function StopCard({ stop, index, isSelected, onSelect }) {
  const meta = STOP_STATUS_META[stop.status] || STOP_STATUS_META.PENDING;
  const isVisiting = stop.status === 'VISITING';
  const isTravelling = stop.status === 'TRAVELLING';
  const isSkipped = stop.status === 'SKIPPED';

  return (
    <div
      onClick={() => onSelect && onSelect(stop)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect && onSelect(stop);
      }}
      className="p-3 rounded-3 mb-3 position-relative"
      style={{
        backgroundColor: isVisiting ? '#fff7ed' : isSelected ? '#f8fafc' : '#ffffff',
        border: isVisiting
          ? '2px solid #ea580c'
          : isTravelling
          ? '2px solid #2563eb'
          : isSelected
          ? '1.5px solid #0f172a'
          : '1px solid #e2e8f0',
        boxShadow: isVisiting ? '0 8px 20px -4px rgba(234, 88, 12, 0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
        opacity: isSkipped ? 0.72 : 1,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
    >
      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold text-white"
            style={{
              width: '28px',
              height: '28px',
              fontSize: '13px',
              backgroundColor: meta.markerBg,
              flexShrink: 0,
            }}
          >
            {index + 1}
          </span>
          <h6
            className="mb-0 fw-bold"
            style={{
              color: '#0f172a',
              textDecoration: isSkipped ? 'line-through' : 'none',
            }}
          >
            {stop.name}
          </h6>
          {stop.is_additional && (
            <span
              className="badge d-inline-flex align-items-center gap-1"
              style={{ backgroundColor: '#e0e7ff', color: '#3730a3', fontSize: '11px' }}
            >
              <PlusCircle size={12} /> Phát sinh
            </span>
          )}
        </div>

        <span
          className="px-2 py-1 rounded-pill fw-semibold d-inline-flex align-items-center gap-1"
          style={{
            backgroundColor: meta.bg,
            color: meta.color,
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}
        >
          {stop.status === 'COMPLETED' && <CheckCircle2 size={13} />}
          {stop.status === 'TRAVELLING' && <Navigation size={13} />}
          {stop.status === 'SKIPPED' && <SkipForward size={13} />}
          {meta.label}
        </span>
      </div>

      {stop.description && (
        <p className="mb-2 text-secondary" style={{ fontSize: '13.5px', lineHeight: 1.5 }}>
          {stop.description}
        </p>
      )}

      {stop.address && (
        <div className="d-flex align-items-center gap-1 text-muted mb-2" style={{ fontSize: '12.5px' }}>
          <MapPin size={14} color="#ea580c" style={{ flexShrink: 0 }} />
          <span>{stop.address}</span>
        </div>
      )}

      <div className="d-flex flex-wrap gap-3 text-muted" style={{ fontSize: '12.5px' }}>
        {(stop.planned_start || stop.planned_end) && (
          <div className="d-flex align-items-center gap-1">
            <Clock size={13} />
            <span>
              Dự kiến: {formatTimeVN(stop.planned_start)} – {formatTimeVN(stop.planned_end)}
            </span>
          </div>
        )}
        {stop.departed_at && <span>Xuất phát: {formatTimeVN(stop.departed_at)}</span>}
        {stop.arrived_at && (
          <span className="text-primary fw-semibold">Đến nơi: {formatDateTimeVN(stop.arrived_at)}</span>
        )}
        {stop.completed_at && (
          <span className="text-success fw-semibold">Hoàn thành: {formatDateTimeVN(stop.completed_at)}</span>
        )}
      </div>

      {stop.status === 'SKIPPED' && stop.skipped_reason && (
        <div
          className="mt-2 px-2 py-1 rounded-2"
          style={{ backgroundColor: '#f1f5f9', fontSize: '12.5px', color: '#475569' }}
        >
          <strong>Lý do bỏ qua:</strong> {stop.skipped_reason}
        </div>
      )}

      {stop.note && (
        <div
          className="mt-2 px-2 py-1 rounded-2 d-flex align-items-start gap-1"
          style={{ backgroundColor: '#fefce8', fontSize: '12.5px', color: '#854d0e' }}
        >
          <MessageSquare size={13} className="mt-1 flex-shrink-0" />
          <span>{stop.note}</span>
        </div>
      )}
    </div>
  );
}

export default StopCard;

