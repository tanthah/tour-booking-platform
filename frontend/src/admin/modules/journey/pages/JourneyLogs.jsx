import { useState, useEffect, useCallback } from 'react';
import { History } from 'lucide-react';
import { getJourneyLogsAdmin } from '../journeyAdminService';
import { LOG_ACTION_LABELS, formatDateTimeVN } from '../../../../user/modules/journey/journeyConstants';

function JourneyLogs({ journeyId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { limit: 100 };
      if (actionFilter) params.action = actionFilter;
      const res = await getJourneyLogsAdmin(journeyId, params);
      setLogs(res?.data?.items || []);
    } catch (err) {
      setError(err?.message || 'Không thể tải lịch sử cập nhật.');
    } finally {
      setLoading(false);
    }
  }, [journeyId, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="bg-white rounded-3 border p-3 p-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
          <History size={18} color="#3b82f6" /> Lịch sử cập nhật & can thiệp
        </h5>

        <select
          className="form-select form-select-sm"
          style={{ maxWidth: '240px' }}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">Tất cả thao tác</option>
          {Object.entries(LOG_ACTION_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {loading ? (
        <div className="text-center py-4 text-muted">Đang tải lịch sử...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-4 text-muted">Chưa có bản ghi lịch sử nào.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr>
                <th>Thời gian</th>
                <th>Người thực hiện</th>
                <th>Thao tác</th>
                <th>Điểm dừng</th>
                <th>Trước / Sau</th>
                <th>Lý do & Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDateTimeVN(log.created_at)}</td>
                  <td>
                    <div className="fw-semibold">{log.performed_by?.full_name || 'Hệ thống'}</div>
                    <div className="text-muted" style={{ fontSize: '11.5px' }}>
                      {log.performed_by?.email || ''}
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border">
                      {LOG_ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td>{log.stop_id?.name || '—'}</td>
                  <td style={{ maxWidth: '260px' }}>
                    {log.old_value && (
                      <div className="text-muted text-truncate" title={JSON.stringify(log.old_value)}>
                        <strong>Trước:</strong> {JSON.stringify(log.old_value)}
                      </div>
                    )}
                    {log.new_value && (
                      <div className="text-dark text-truncate" title={JSON.stringify(log.new_value)}>
                        <strong>Sau:</strong> {JSON.stringify(log.new_value)}
                      </div>
                    )}
                  </td>
                  <td style={{ maxWidth: '240px' }}>
                    <div>{log.reason || '—'}</div>
                    {log.note && <div className="text-muted small">Ghi chú: {log.note}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default JourneyLogs;
