import { ProgressBar } from 'react-bootstrap';
import { JOURNEY_STATUS_META } from '../journeyConstants';

function JourneyProgress({ journey, stats }) {
  const statusMeta = JOURNEY_STATUS_META[journey?.status] || JOURNEY_STATUS_META.NOT_STARTED;
  const progress = Number(journey?.progress || 0);
  const completedCount = stats?.completed_stops ?? 0;
  const activeTotal = stats?.active_stops ?? 0;
  const skippedCount = stats?.skipped_stops ?? 0;

  return (
    <div
      className="p-3 p-md-4 rounded-4 bg-white border shadow-sm mb-4"
      style={{ borderColor: '#e2e8f0' }}
    >
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <div className="text-muted" style={{ fontSize: '13px', fontWeight: 600 }}>
            TIẾN ĐỘ HÀNH TRÌNH
          </div>
          <div className="d-flex align-items-baseline gap-2 mt-1">
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
              {progress}%
            </span>
            <span className="text-muted" style={{ fontSize: '14px' }}>
              ({completedCount}/{activeTotal} địa điểm đã hoàn thành
              {skippedCount > 0 ? ` • ${skippedCount} điểm bỏ qua` : ''})
            </span>
          </div>
        </div>

        <span
          className="px-3 py-2 rounded-pill fw-bold"
          style={{
            backgroundColor: statusMeta.bg,
            color: statusMeta.color,
            fontSize: '13.5px',
            border: `1px solid ${statusMeta.color}30`,
          }}
        >
          {statusMeta.label}
        </span>
      </div>

      <ProgressBar
        now={progress}
        variant={journey?.status === 'COMPLETED' ? 'success' : 'warning'}
        animated={journey?.status === 'IN_PROGRESS'}
        style={{ height: '12px', borderRadius: '999px', backgroundColor: '#f1f5f9' }}
      />
    </div>
  );
}

export default JourneyProgress;

