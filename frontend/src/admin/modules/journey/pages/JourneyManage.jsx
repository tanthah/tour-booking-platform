import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Flag,
  Plus,
  ArrowUpDown,
  History,
  Map as MapIcon,
  Calendar,
  MapPin,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import {
  getJourneyDetail,
  startJourney,
  completeJourney,
} from '../journeyAdminService';
import {
  JOURNEY_STATUS_META,
  formatDateTimeVN,
} from '../../../../user/modules/journey/journeyConstants';
import StopStatusControl from '../components/StopStatusControl';
import AddStopModal from '../components/AddStopModal';
import SkipStopModal from '../components/SkipStopModal';
import AdjustTimeModal from '../components/AdjustTimeModal';
import ReorderStops from '../components/ReorderStops';
import JourneyLogs from './JourneyLogs';
import JourneyMap from '../../../../user/modules/journey/components/JourneyMap';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || {};
  } catch {
    return {};
  }
}

function JourneyManage() {
  const { journeyId } = useParams();
  const currentUser = getStoredUser();
  const isAdmin =
    currentUser.role?.code === 'admin' ||
    (Array.isArray(currentUser.roles) && currentUser.roles.includes('ADMIN'));

  const [journey, setJourney] = useState(null);
  const [stops, setStops] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const [activeTab, setActiveTab] = useState('operations'); // 'operations' | 'map' | 'logs'
  const [selectedStopId, setSelectedStopId] = useState(null);
  const [showAddStop, setShowAddStop] = useState(false);
  const [skipTargetStop, setSkipTargetStop] = useState(null);
  const [adjustTargetStop, setAdjustTargetStop] = useState(null);
  const [reorderMode, setReorderMode] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      setError('');
      const res = await getJourneyDetail(journeyId);
      setJourney(res?.data?.journey || null);
      setStops(res?.data?.stops || []);
      setStats(res?.data?.stats || null);
    } catch (err) {
      setError(err?.message || 'Không thể tải chi tiết hành trình.');
    } finally {
      setLoading(false);
    }
  }, [journeyId]);

  useEffect(() => {
    setLoading(true);
    loadDetail();
  }, [loadDetail]);

  const handleStartJourney = async () => {
    if (!window.confirm('Xác nhận BẮT ĐẦU hành trình? Điểm đầu tiên sẽ chuyển sang "Đang di chuyển".')) {
      return;
    }
    try {
      setActionBusy(true);
      setActionError('');
      await startJourney(journeyId, { version: journey?.version });
      await loadDetail();
    } catch (err) {
      setActionError(err?.message || 'Không thể bắt đầu hành trình.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleCompleteJourney = async () => {
    if (
      !window.confirm(
        'Xác nhận KẾT THÚC toàn bộ hành trình? Thao tác này sẽ đóng tiến độ và thông báo hoàn thành cho tất cả khách hàng.'
      )
    ) {
      return;
    }
    try {
      setActionBusy(true);
      setActionError('');
      await completeJourney(journeyId, { version: journey?.version });
      await loadDetail();
    } catch (err) {
      setActionError(err?.message || 'Không thể kết thúc hành trình.');
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return <div className="p-5 text-center text-muted">Đang tải chi tiết hành trình...</div>;
  }

  if (error || !journey) {
    return (
      <div className="p-4">
        <div className="alert alert-danger">{error || 'Hành trình không tồn tại.'}</div>
        <Link to="/admin/journeys" className="btn btn-secondary">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const tour = journey.tour_id || {};
  const dep = journey.departure_id || {};
  const statusMeta = JOURNEY_STATUS_META[journey.status] || JOURNEY_STATUS_META.NOT_STARTED;
  const hasActiveOtherStop = stops.some((s) => ['TRAVELLING', 'VISITING'].includes(s.status));
  const canEditSchedule = !['COMPLETED', 'CANCELLED'].includes(journey.status);

  return (
    <div>
      {/* Top navigation */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <Link
          to="/admin/journeys"
          className="text-decoration-none d-inline-flex align-items-center gap-1 fw-semibold text-secondary"
        >
          <ArrowLeft size={16} /> Danh sách hành trình
        </Link>
        <button
          type="button"
          className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
          onClick={loadDetail}
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-3 border p-3 p-md-4 mb-3">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
              <span className="badge bg-light text-dark border">{tour.code}</span>
              <span className="badge" style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}>
                {statusMeta.label}
              </span>
            </div>
            <h4 className="fw-bold mb-2">{tour.title}</h4>
            <div className="d-flex flex-wrap gap-3 text-muted small">
              <span className="d-inline-flex align-items-center gap-1">
                <Calendar size={14} /> Khởi hành: {formatDateTimeVN(dep.start_datetime)}
              </span>
              <span className="d-inline-flex align-items-center gap-1">
                <MapPin size={14} /> Tập trung: {dep.meeting_point}
              </span>
              <span className="d-inline-flex align-items-center gap-1">
                <UserCheck size={14} /> HDV: {journey.guide_id?.full_name || 'Chưa phân công'}
              </span>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            {journey.status === 'NOT_STARTED' && (
              <button
                type="button"
                className="btn btn-success d-inline-flex align-items-center gap-2 fw-bold px-3 py-2"
                disabled={actionBusy || !journey.is_departure_day_reached}
                onClick={handleStartJourney}
                title={
                  !journey.is_departure_day_reached
                    ? 'Chỉ có thể bắt đầu vào đúng ngày khởi hành'
                    : 'Bắt đầu hành trình'
                }
              >
                <Play size={16} /> Bắt đầu hành trình
              </button>
            )}

            {journey.status === 'IN_PROGRESS' && (
              <button
                type="button"
                className="btn btn-dark d-inline-flex align-items-center gap-2 fw-bold px-3 py-2"
                disabled={actionBusy}
                onClick={handleCompleteJourney}
              >
                <Flag size={16} /> Kết thúc hành trình
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 pt-3 border-top">
          <div className="d-flex justify-content-between small mb-1">
            <span>
              Tiến độ thực tế: <strong>{stats?.completed_stops || 0}/{stats?.active_stops || 0} điểm</strong>
              {stats?.skipped_stops ? ` (${stats.skipped_stops} điểm bỏ qua)` : ''}
            </span>
            <strong>{journey.progress || 0}%</strong>
          </div>
          <div className="progress" style={{ height: '10px' }}>
            <div
              className={`progress-bar ${journey.status === 'COMPLETED' ? 'bg-success' : 'bg-warning'}`}
              style={{ width: `${journey.progress || 0}%` }}
            />
          </div>
        </div>
      </div>

      {!journey.is_departure_day_reached && journey.status === 'NOT_STARTED' && (
        <div className="alert alert-info py-2 small">
          Chưa đến ngày khởi hành. Nút <strong>"Bắt đầu hành trình"</strong> sẽ tự động khả dụng vào ngày khởi hành.
        </div>
      )}

      {actionError && (
        <div className="alert alert-danger py-2 d-flex justify-content-between align-items-center">
          <span>{actionError}</span>
          <button type="button" className="btn-close" onClick={() => setActionError('')} />
        </div>
      )}

      {/* Tabs */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div className="btn-group">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'operations' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('operations')}
          >
            Điều hành điểm dừng ({stops.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
              activeTab === 'map' ? 'btn-primary' : 'btn-outline-secondary'
            }`}
            onClick={() => setActiveTab('map')}
          >
            <MapIcon size={14} /> Bản đồ
          </button>
          {isAdmin && (
            <button
              type="button"
              className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                activeTab === 'logs' ? 'btn-primary' : 'btn-outline-secondary'
              }`}
              onClick={() => setActiveTab('logs')}
            >
              <History size={14} /> Lịch sử cập nhật
            </button>
          )}
        </div>

        {activeTab === 'operations' && canEditSchedule && (
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
              onClick={() => setShowAddStop(true)}
            >
              <Plus size={14} /> Thêm điểm phát sinh
            </button>
            <button
              type="button"
              className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                reorderMode ? 'btn-dark' : 'btn-outline-dark'
              }`}
              onClick={() => setReorderMode(!reorderMode)}
            >
              <ArrowUpDown size={14} /> {reorderMode ? 'Đóng sắp xếp' : 'Đổi thứ tự'}
            </button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'operations' && (
        <div className="row g-3">
          <div className="col-lg-7">
            {reorderMode ? (
              <ReorderStops
                journeyId={journeyId}
                journeyVersion={journey.version}
                stops={stops}
                onCancel={() => setReorderMode(false)}
                onSuccess={() => {
                  setReorderMode(false);
                  loadDetail();
                }}
              />
            ) : (
              stops.map((stop, idx) => (
                <StopStatusControl
                  key={stop._id}
                  journeyId={journeyId}
                  journeyStatus={journey.status}
                  stop={stop}
                  index={idx}
                  hasActiveOtherStop={
                    hasActiveOtherStop && !['TRAVELLING', 'VISITING'].includes(stop.status)
                  }
                  onUpdated={loadDetail}
                  onOpenSkip={(s) => setSkipTargetStop(s)}
                  onOpenAdjustTime={(s) => setAdjustTargetStop(s)}
                  onError={(msg) => setActionError(msg)}
                />
              ))
            )}
          </div>

          <div className="col-lg-5 d-none d-lg-block">
            <JourneyMap
              stops={stops}
              selectedStopId={selectedStopId}
              onSelectStop={(s) => setSelectedStopId(s._id)}
              height="480px"
            />
          </div>
        </div>
      )}

      {activeTab === 'map' && (
        <JourneyMap
          stops={stops}
          selectedStopId={selectedStopId}
          onSelectStop={(s) => setSelectedStopId(s._id)}
          height="520px"
        />
      )}

      {activeTab === 'logs' && isAdmin && <JourneyLogs journeyId={journeyId} />}

      {/* Modals */}
      <AddStopModal
        show={showAddStop}
        journeyId={journeyId}
        stops={stops}
        onClose={() => setShowAddStop(false)}
        onSuccess={loadDetail}
      />

      <SkipStopModal
        show={!!skipTargetStop}
        journeyId={journeyId}
        stop={skipTargetStop}
        onClose={() => setSkipTargetStop(null)}
        onSuccess={loadDetail}
      />

      <AdjustTimeModal
        show={!!adjustTargetStop}
        journeyId={journeyId}
        stop={adjustTargetStop}
        onClose={() => setAdjustTargetStop(null)}
        onSuccess={loadDetail}
      />
    </div>
  );
}

export default JourneyManage;
