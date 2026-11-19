import { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, UserCheck, Wifi, WifiOff, Clock, RefreshCw } from 'lucide-react';
import {
  getJourneyDetail,
  getJourneyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createJourneySocket,
} from '../journeyService';
import {
  JOURNEY_STATUS_META,
  formatDateTimeVN,
  formatDateVN,
  computeExpectedEndDate,
} from '../journeyConstants';
import JourneyProgress from '../components/JourneyProgress';
import JourneyTimeline from '../components/JourneyTimeline';
import JourneyMap from '../components/JourneyMap';
import JourneyNotifications from '../components/JourneyNotifications';

function JourneyDetail() {
  const { journeyId } = useParams();
  const [journey, setJourney] = useState(null);
  const [stops, setStops] = useState([]);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [selectedStopId, setSelectedStopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [reconnectingBanner, setReconnectingBanner] = useState(false);

  const socketRef = useRef(null);
  const wasDisconnectedRef = useRef(false);

  const loadAllData = useCallback(async () => {
    try {
      setError('');
      const [detailRes, notifRes] = await Promise.all([
        getJourneyDetail(journeyId),
        getJourneyNotifications(journeyId).catch(() => ({ data: [] })),
      ]);
      const data = detailRes?.data;
      setJourney(data?.journey || null);
      setStops(data?.stops || []);
      setStats(data?.stats || null);
      setNotifications(notifRes?.data || []);
    } catch (err) {
      setError(err?.message || 'Không thể tải thông tin hành trình.');
    } finally {
      setLoading(false);
    }
  }, [journeyId]);

  useEffect(() => {
    setLoading(true);
    loadAllData();
  }, [loadAllData]);

  // Kết nối Socket.IO và đồng bộ realtime
  useEffect(() => {
    if (!journeyId) return;

    const socket = createJourneySocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      setReconnectingBanner(false);
      socket.emit('journey:join', { journeyId });

      // Nếu trước đó bị mất kết nối, tự động đồng bộ lại dữ liệu mới nhất từ API
      if (wasDisconnectedRef.current) {
        wasDisconnectedRef.current = false;
        loadAllData();
      }
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      wasDisconnectedRef.current = true;
      setReconnectingBanner(true);
    });

    socket.on('connect_error', () => {
      setSocketConnected(false);
      wasDisconnectedRef.current = true;
    });

    socket.on('journey:started', (payload) => {
      setJourney((prev) =>
        prev ? { ...prev, status: 'IN_PROGRESS', started_at: payload.started_at, progress: payload.progress } : prev
      );
      if (payload.stats) setStats(payload.stats);
      if (payload.firstStop) {
        setStops((prev) => prev.map((s) => (s._id === payload.firstStop._id ? payload.firstStop : s)));
      }
    });

    socket.on('journey:completed', (payload) => {
      setJourney((prev) =>
        prev ? { ...prev, status: 'COMPLETED', completed_at: payload.completed_at, progress: payload.progress } : prev
      );
      if (payload.stats) setStats(payload.stats);
    });

    socket.on('journey:status_updated', (payload) => {
      setJourney((prev) =>
        prev
          ? {
              ...prev,
              ...(payload.status ? { status: payload.status } : {}),
              ...(payload.progress !== undefined ? { progress: payload.progress } : {}),
              ...(payload.guide !== undefined ? { guide_id: payload.guide } : {}),
              ...(payload.cancel_reason ? { cancel_reason: payload.cancel_reason } : {}),
            }
          : prev
      );
      if (payload.stats) setStats(payload.stats);
    });

    socket.on('journey:stop_updated', (payload) => {
      if (payload.stop) {
        setStops((prev) =>
          prev.map((s) => (s._id === payload.stop._id ? payload.stop : s)).sort((a, b) => a.order - b.order)
        );
      }
      if (payload.progress !== undefined) {
        setJourney((prev) => (prev ? { ...prev, progress: payload.progress } : prev));
      }
      if (payload.stats) setStats(payload.stats);
    });

    socket.on('journey:schedule_changed', (payload) => {
      if (Array.isArray(payload.stops)) {
        setStops(payload.stops);
      } else if (payload.stop) {
        setStops((prev) => {
          const exists = prev.some((s) => s._id === payload.stop._id);
          const next = exists
            ? prev.map((s) => (s._id === payload.stop._id ? payload.stop : s))
            : [...prev, payload.stop];
          return next.sort((a, b) => a.order - b.order);
        });
      }
      if (payload.progress !== undefined) {
        setJourney((prev) => (prev ? { ...prev, progress: payload.progress } : prev));
      }
      if (payload.stats) setStats(payload.stats);
    });

    socket.on('journey:notification', (payload) => {
      if (payload?.notification) {
        setNotifications((prev) => [payload.notification, ...prev]);
      }
    });

    return () => {
      socket.emit('journey:leave', { journeyId });
      socket.disconnect();
    };
  }, [journeyId, loadAllData]);

  const handleMarkRead = async (notifId) => {
    try {
      await markNotificationRead(journeyId, notifId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(journeyId);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" style={{ color: '#ea580c' }} />
      </div>
    );
  }

  if (error || !journey) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">{error || 'Không tìm thấy hành trình.'}</Alert>
        <Button as={Link} to="/my-journeys" variant="warning">
          Quay lại hành trình của tôi
        </Button>
      </Container>
    );
  }

  const tour = journey.tour_id || {};
  const dep = journey.departure_id || {};
  const expectedEnd = computeExpectedEndDate(dep.start_datetime, tour.duration);
  const statusMeta = JOURNEY_STATUS_META[journey.status] || JOURNEY_STATUS_META.NOT_STARTED;
  const currentVisiting = stops.find((s) => s.status === 'VISITING');

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '28px 0 72px' }}>
      <Container>
        {/* Top bar */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <Link
            to="/my-journeys"
            className="text-decoration-none d-inline-flex align-items-center gap-1 fw-semibold"
            style={{ color: '#475569', fontSize: '14px' }}
          >
            <ArrowLeft size={16} /> Quay lại danh sách hành trình
          </Link>

          <div className="d-flex align-items-center gap-2">
            <span
              className="badge rounded-pill d-inline-flex align-items-center gap-1 px-3 py-2"
              style={{
                backgroundColor: socketConnected ? '#dcfce7' : '#fee2e2',
                color: socketConnected ? '#15803d' : '#b91c1c',
                fontSize: '12px',
              }}
            >
              {socketConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
              {socketConnected ? 'Đang đồng bộ trực tiếp' : 'Mất kết nối realtime'}
            </span>
            <Button
              size="sm"
              variant="outline-secondary"
              className="d-inline-flex align-items-center gap-1"
              onClick={loadAllData}
            >
              <RefreshCw size={13} /> Làm mới
            </Button>
          </div>
        </div>

        {reconnectingBanner && (
          <Alert variant="warning" className="py-2">
            Kết nối đồng bộ tạm gián đoạn. Hệ thống sẽ tự động tải lại trạng thái mới nhất ngay khi có mạng.
          </Alert>
        )}

        {journey.status === 'CANCELLED' && (
          <Alert variant="danger">
            <strong>Hành trình đã bị hủy.</strong>{' '}
            {journey.cancel_reason ? `Lý do: ${journey.cancel_reason}` : ''}
          </Alert>
        )}

        {!journey.is_departure_day_reached && journey.status === 'NOT_STARTED' && (
          <Alert variant="info">
            Chưa đến ngày khởi hành ({formatDateVN(dep.start_datetime)}). Bạn đang xem lịch trình dự kiến; tiến độ thực tế chưa bắt đầu.
          </Alert>
        )}

        {/* Header thông tin Tour & Đoàn */}
        <div className="bg-white rounded-4 border shadow-sm p-3 p-md-4 mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <span className="badge bg-light text-dark border">Mã tour: {tour.code}</span>
                <span
                  className="badge"
                  style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}
                >
                  {statusMeta.label}
                </span>
              </div>
              <h1 style={{ fontSize: '23px', fontWeight: 800, color: '#0f172a', margin: '6px 0 10px' }}>
                {tour.title}
              </h1>

              <div className="d-flex flex-wrap gap-3 text-secondary" style={{ fontSize: '13.5px' }}>
                <span className="d-inline-flex align-items-center gap-1">
                  <Calendar size={15} color="#ea580c" />
                  Khởi hành: <strong>{formatDateTimeVN(dep.start_datetime)}</strong>
                </span>
                {expectedEnd && (
                  <span className="d-inline-flex align-items-center gap-1">
                    <Clock size={15} color="#ea580c" />
                    Dự kiến kết thúc: <strong>{formatDateVN(expectedEnd)}</strong> ({tour.duration})
                  </span>
                )}
                <span className="d-inline-flex align-items-center gap-1">
                  <MapPin size={15} color="#ea580c" />
                  Tập trung: <strong>{dep.meeting_point}</strong>
                </span>
                <span className="d-inline-flex align-items-center gap-1">
                  <Users size={15} color="#ea580c" />
                  Đoàn: <strong>{dep.booked_slots || 0}/{dep.total_slots || 0} khách</strong>
                </span>
                {journey.guide_id && (
                  <span className="d-inline-flex align-items-center gap-1">
                    <UserCheck size={15} color="#ea580c" />
                    HDV: <strong>{journey.guide_id.full_name}</strong> ({journey.guide_id.phone})
                  </span>
                )}
              </div>
            </div>
          </div>

          {currentVisiting && (
            <div
              className="mt-3 p-3 rounded-3 d-flex flex-wrap justify-content-between align-items-center gap-2"
              style={{ backgroundColor: '#fff7ed', border: '1px solid #fdba74' }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ea580c' }}>
                  ĐỊA ĐIỂM ĐANG THAM QUAN HIỆN TẠI
                </div>
                <div className="fw-bold" style={{ fontSize: '16px', color: '#0f172a' }}>
                  {currentVisiting.name}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline-warning"
                style={{ color: '#ea580c', borderColor: '#ea580c' }}
                onClick={() => setSelectedStopId(currentVisiting._id)}
              >
                Xem trên bản đồ
              </Button>
            </div>
          )}
        </div>

        {/* Tiến độ tổng thể */}
        <JourneyProgress journey={journey} stats={stats} />

        {/* Nội dung chính: Timeline + Bản đồ + Thông báo */}
        <Row className="gy-4">
          <Col lg={7}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>
                Lịch trình thực tế ({stops.length} điểm)
              </h5>
            </div>
            <JourneyTimeline
              stops={stops}
              selectedStopId={selectedStopId}
              onSelectStop={(stop) => setSelectedStopId(stop._id)}
            />
          </Col>

          <Col lg={5}>
            <div className="d-flex flex-column gap-4">
              <JourneyMap
                stops={stops}
                selectedStopId={selectedStopId}
                onSelectStop={(stop) => setSelectedStopId(stop._id)}
                height="400px"
              />
              <JourneyNotifications
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onMarkAllRead={handleMarkAllRead}
              />
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default JourneyDetail;

