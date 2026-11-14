import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserCheck, Eye, AlertTriangle, XCircle, RefreshCw, Compass } from 'lucide-react';
import {
  listAllJourneysAdmin,
  getAssignedJourneysStaff,
  getAvailableGuidesAdmin,
  cancelJourneyAdmin,
} from '../journeyAdminService';
import { JOURNEY_STATUS_META, formatDateTimeVN } from '../../../../user/modules/journey/journeyConstants';
import AssignGuideModal from '../components/AssignGuideModal';
import CreateJourneyModal from '../components/CreateJourneyModal';
import { AdminPageHeader } from '../../../components/common';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || {};
  } catch {
    return {};
  }
}

function JourneyList({ mode = 'auto' }) {
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const isAdminUser =
    currentUser.role?.code === 'admin' ||
    (Array.isArray(currentUser.roles) && currentUser.roles.includes('ADMIN'));
  const isAdminMode = mode === 'admin' || (mode === 'auto' && isAdminUser);

  const [journeys, setJourneys] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [guideFilter, setGuideFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [attentionOnly, setAttentionOnly] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignModalJourney, setAssignModalJourney] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      if (dateFilter) params.date = dateFilter;

      if (isAdminMode) {
        if (guideFilter) params.guide_id = guideFilter;
        if (attentionOnly) params.attention_only = true;
        const [listRes, guideRes] = await Promise.all([
          listAllJourneysAdmin(params),
          guides.length === 0 ? getAvailableGuidesAdmin().catch(() => ({ data: [] })) : Promise.resolve(null),
        ]);
        setJourneys(listRes?.data?.items || []);
        if (guideRes?.data) setGuides(guideRes.data);
      } else {
        const res = await getAssignedJourneysStaff(params);
        setJourneys(res?.data?.items || []);
      }
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách hành trình.');
    } finally {
      setLoading(false);
    }
  }, [isAdminMode, statusFilter, search, guideFilter, dateFilter, attentionOnly, guides.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleCancelJourney = async (journey) => {
    const reason = window.prompt(
      `Nhập lý do hủy hành trình cho tour "${journey.tour_id?.title}":`
    );
    if (!reason || !reason.trim()) return;
    try {
      await cancelJourneyAdmin(journey._id, { reason: reason.trim() });
      fetchData();
    } catch (err) {
      alert(err?.message || 'Không thể hủy hành trình.');
    }
  };

  return (
    <div>
      <AdminPageHeader
        title={isAdminMode ? 'Giám sát Hành trình Tour' : 'Hành trình được phân công'}
        subtitle={
          isAdminMode
            ? 'Theo dõi tiến độ các đoàn khởi hành, phân công hướng dẫn viên và kiểm tra lịch sử điều chỉnh.'
            : 'Quản lý trạng thái tham quan và điều chỉnh lịch trình thực tế cho các đoàn bạn phụ trách.'
        }
        actions={
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-light border d-inline-flex align-items-center gap-1"
              onClick={fetchData}
            >
              <RefreshCw size={15} /> Làm mới
            </button>
            {isAdminMode && (
              <button
                type="button"
                className="btn btn-primary d-inline-flex align-items-center gap-1"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} /> Khởi tạo hành trình
              </button>
            )}
          </div>
        }
      />

      {/* Bộ lọc */}
      <div className="bg-white rounded-3 border p-3 mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label small fw-semibold mb-1">Tìm kiếm</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Tên tour, mã tour, hướng dẫn viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <label className="form-label small fw-semibold mb-1">Trạng thái</label>
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả</option>
              <option value="NOT_STARTED">Chưa bắt đầu</option>
              <option value="IN_PROGRESS">Đang diễn ra</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label small fw-semibold mb-1">Ngày khởi hành</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          {isAdminMode && (
            <div className="col-md-3">
              <label className="form-label small fw-semibold mb-1">Hướng dẫn viên</label>
              <select
                className="form-select form-select-sm"
                value={guideFilter}
                onChange={(e) => setGuideFilter(e.target.value)}
              >
                <option value="">Tất cả nhân viên</option>
                {guides.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isAdminMode && (
            <div className="col-md-2">
              <div className="form-check mb-1">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="attentionOnlyCheck"
                  checked={attentionOnly}
                  onChange={(e) => setAttentionOnly(e.target.checked)}
                />
                <label className="form-check-label small fw-semibold text-danger" htmlFor="attentionOnlyCheck">
                  Cần chú ý / Bất thường
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="bg-white rounded-3 border p-5 text-center text-muted">
          Đang tải danh sách hành trình...
        </div>
      ) : journeys.length === 0 ? (
        <div className="bg-white rounded-3 border p-5 text-center text-muted">
          <Compass size={40} className="mb-2 text-secondary" />
          <div>Không có hành trình nào phù hợp với bộ lọc.</div>
        </div>
      ) : (
        <div className="bg-white rounded-3 border overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13.5px' }}>
              <thead className="table-light">
                <tr>
                  <th>Tour & Đợt khởi hành</th>
                  <th>Hướng dẫn viên</th>
                  <th>Trạng thái</th>
                  <th>Tiến độ</th>
                  {isAdminMode && <th>Cảnh báo</th>}
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {journeys.map((j) => {
                  const statusMeta = JOURNEY_STATUS_META[j.status] || JOURNEY_STATUS_META.NOT_STARTED;
                  const alerts = j.alerts || {};
                  return (
                    <tr key={j._id}>
                      <td>
                        <div className="fw-bold text-dark">
                          [{j.tour_id?.code}] {j.tour_id?.title}
                        </div>
                        <div className="text-muted small">
                          Khởi hành: {formatDateTimeVN(j.departure_id?.start_datetime)} • Tập trung:{' '}
                          {j.departure_id?.meeting_point}
                        </div>
                        <div className="text-muted small">
                          Khách: {j.departure_id?.booked_slots || 0}/{j.departure_id?.total_slots || 0}
                        </div>
                      </td>

                      <td>
                        {j.guide_id ? (
                          <div>
                            <div className="fw-semibold">{j.guide_id.full_name}</div>
                            <div className="text-muted small">{j.guide_id.phone}</div>
                          </div>
                        ) : (
                          <span className="badge bg-warning text-dark">Chưa phân công</span>
                        )}
                      </td>

                      <td>
                        <span
                          className="badge px-2 py-1"
                          style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}
                        >
                          {statusMeta.label}
                        </span>
                      </td>

                      <td style={{ minWidth: '130px' }}>
                        <div className="d-flex justify-content-between small mb-1">
                          <span>
                            {j.stats?.completed_stops || 0}/{j.stats?.active_stops || 0} điểm
                          </span>
                          <strong>{j.progress || 0}%</strong>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div
                            className={`progress-bar ${j.status === 'COMPLETED' ? 'bg-success' : 'bg-warning'}`}
                            style={{ width: `${j.progress || 0}%` }}
                          />
                        </div>
                      </td>

                      {isAdminMode && (
                        <td>
                          <div className="d-flex flex-column gap-1">
                            {alerts.not_started_on_day && (
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center gap-1">
                                <AlertTriangle size={12} /> Đến ngày chưa bắt đầu
                              </span>
                            )}
                            {alerts.long_running && (
                              <span className="badge bg-warning-subtle text-warning-emphasis border">
                                Đang diễn ra kéo dài
                              </span>
                            )}
                            {alerts.has_schedule_changes && (
                              <span className="badge bg-info-subtle text-info-emphasis border">
                                {j.schedule_changes_count} lần đổi lịch trình
                              </span>
                            )}
                            {!alerts.not_started_on_day &&
                              !alerts.long_running &&
                              !alerts.has_schedule_changes && (
                                <span className="text-muted small">Bình thường</span>
                              )}
                          </div>
                        </td>
                      )}

                      <td className="text-end">
                        <div className="d-inline-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                            onClick={() => navigate(`/admin/journeys/${j._id}`)}
                          >
                            <Eye size={14} /> {isAdminMode ? 'Giám sát' : 'Điều hành'}
                          </button>

                          {isAdminMode && !['COMPLETED', 'CANCELLED'].includes(j.status) && (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                                title="Phân công hướng dẫn viên"
                                onClick={() => setAssignModalJourney(j)}
                              >
                                <UserCheck size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                                title="Hủy hành trình"
                                onClick={() => handleCancelJourney(j)}
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAdminMode && (
        <>
          <AssignGuideModal
            show={!!assignModalJourney}
            journey={assignModalJourney}
            guides={guides}
            onClose={() => setAssignModalJourney(null)}
            onSuccess={fetchData}
          />
          <CreateJourneyModal
            show={showCreateModal}
            guides={guides}
            onClose={() => setShowCreateModal(false)}
            onSuccess={fetchData}
          />
        </>
      )}
    </div>
  );
}

export default JourneyList;
