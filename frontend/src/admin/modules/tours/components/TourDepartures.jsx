import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, History, AlertTriangle } from 'lucide-react';
import axiosAdmin from '../../../config/axiosAdmin';
import { AdminDataTable, StatusBadge, ActionButtons } from '../../../components/common';

const STATUS_TRANSITIONS = {
  OPEN: ['CLOSED', 'CANCELLED'],
  FULL: ['OPEN', 'CLOSED'],
  CLOSED: ['OPEN'],
  CANCELLED: [],
};

const DEPARTURE_STATUS_MAP = {
  OPEN: { label: 'Mở bán', className: 'status-active' },
  FULL: { label: 'Hết chỗ', className: 'status-draft' },
  CLOSED: { label: 'Đóng', className: 'status-inactive' },
  CANCELLED: { label: 'Đã hủy', className: 'status-inactive' },
};

const toDatetimeLocal = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

/**
 * Component Quản lý Lịch Khởi Hành của một Tour (Admin) - TourGo v2
 * - Quản lý ngày giờ bắt đầu tour (start_datetime) và địa điểm tập trung (meeting_point).
 * - Quản lý sức chứa tour (total_slots, booked_slots, reserved_slots, available_slots).
 * - Khách tự túc di chuyển đến điểm tập trung (loại bỏ phương tiện và điểm xuất phát).
 * - Bắt buộc nhập lý do và lưu lịch sử DepartureChangeLog khi đổi địa điểm tập trung.
 */
function TourDepartures({ productId, autoOpenAdd = false }) {
  const [departures, setDepartures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState('form'); // 'form' | 'logs'
  const [editingDep, setEditingDep] = useState(null);
  const [changeLogs, setChangeLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const initialFormState = {
    start_datetime: '',
    meeting_point: '',
    total_slots: 30,
    status: 'OPEN',
    meeting_point_change_reason: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchDepartures = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get(`/tours/${productId}/departures`);
      setDepartures(res?.data?.departures || []);
    } catch (error) {
      alert(error?.message || 'Không thể tải danh sách lịch khởi hành');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchDepartures();
  }, [fetchDepartures]);

  const loadChangeLogs = async (departureId) => {
    try {
      setLoadingLogs(true);
      const res = await axiosAdmin.get(`/departures/${departureId}/change-logs`);
      setChangeLogs(res?.data || []);
    } catch (err) {
      console.error('Không thể tải lịch sử thay đổi:', err);
      setChangeLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const openAddModal = useCallback(() => {
    setEditingDep(null);
    setChangeLogs([]);
    setModalTab('form');
    const tomorrow = new Date(Date.now() + 86400000);
    setFormData({
      ...initialFormState,
      start_datetime: toDatetimeLocal(tomorrow.toISOString()),
    });
    setShowModal(true);
  }, []);

  useEffect(() => {
    if (autoOpenAdd) {
      openAddModal();
    }
  }, [autoOpenAdd, openAddModal]);

  const openEditModal = (dep, initialTab = 'form') => {
    setEditingDep(dep);
    setModalTab(initialTab);
    setFormData({
      start_datetime: toDatetimeLocal(dep.start_datetime || dep.departure_date),
      meeting_point: dep.meeting_point || dep.meeting_point_address || '',
      total_slots: dep.total_slots || 0,
      status: dep.status || 'OPEN',
      meeting_point_change_reason: '',
    });
    setShowModal(true);
    loadChangeLogs(dep._id);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  // Kiểm tra xem địa điểm tập trung có bị thay đổi so với giá trị ban đầu không
  const initialMeetingPoint = (editingDep?.meeting_point || editingDep?.meeting_point_address || '').trim();
  const isMeetingPointChanged = Boolean(
    editingDep && (formData.meeting_point || '').trim() !== initialMeetingPoint
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.start_datetime) {
      alert('Vui lòng chọn ngày và giờ bắt đầu tour');
      return;
    }

    if (!formData.meeting_point.trim()) {
      alert('Vui lòng nhập địa điểm tập trung');
      return;
    }

    if (isMeetingPointChanged && !formData.meeting_point_change_reason.trim()) {
      alert('Vui lòng nhập lý do thay đổi địa điểm tập trung để lưu lịch sử và thông báo cho khách hàng đã đặt tour.');
      return;
    }

    try {
      const dateIso = new Date(formData.start_datetime).toISOString();

      if (editingDep) {
        const updatePayload = {
          meeting_point: formData.meeting_point.trim(),
          total_slots: Number(formData.total_slots),
        };

        if (isMeetingPointChanged) {
          updatePayload.meeting_point_change_reason = formData.meeting_point_change_reason.trim();
        }

        if (editingDep.booked_slots === 0) {
          updatePayload.start_datetime = dateIso;
        }

        await axiosAdmin.patch(`/departures/${editingDep._id}`, updatePayload);

        if (formData.status !== editingDep.status) {
          await axiosAdmin.patch(`/departures/${editingDep._id}/status`, { status: formData.status });
        }

        alert(
          'Cập nhật lịch khởi hành thành công!' +
            (isMeetingPointChanged
              ? '\nĐã ghi nhận lịch sử thay đổi và gửi email thông báo cho khách hàng có booking.'
              : '')
        );
      } else {
        await axiosAdmin.post(`/tours/${productId}/departures`, {
          start_datetime: dateIso,
          meeting_point: formData.meeting_point.trim(),
          total_slots: Number(formData.total_slots),
        });
        alert('Tạo lịch khởi hành thành công');
      }

      setShowModal(false);
      fetchDepartures();
    } catch (err) {
      const msg =
        Array.isArray(err?.errors) && err.errors.length > 0
          ? err.errors.map((item) => item.message).join('\n')
          : err?.message || 'Lỗi lưu lịch khởi hành';
      alert(msg);
    }
  };

  const handleDelete = async (dep) => {
    if (dep.booked_slots > 0) {
      return alert('Không thể xóa lịch khởi hành đã có khách đặt chỗ.');
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch khởi hành này?')) return;
    try {
      await axiosAdmin.delete(`/departures/${dep._id}`);
      alert('Đã xóa lịch khởi hành thành công');
      fetchDepartures();
    } catch (err) {
      alert(err?.message || 'Lỗi khi xóa lịch khởi hành');
    }
  };

  const getStatusOptions = () => {
    if (!editingDep) return ['OPEN'];
    return [editingDep.status, ...(STATUS_TRANSITIONS[editingDep.status] || [])];
  };

  const columns = [
    {
      key: 'start_datetime',
      title: 'Ngày giờ bắt đầu',
      render: (dep) =>
        new Date(dep.start_datetime || dep.departure_date).toLocaleString('vi-VN', {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
    },
    {
      key: 'meeting_point',
      title: 'Địa điểm tập trung',
      render: (dep) => {
        const point = dep.meeting_point || dep.meeting_point_address;
        return (
          <span
            style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            title={point || 'Chưa thiết lập'}
          >
            {point ? (
              <span style={{ color: '#1e293b' }}>
                📍 {point.length > 35 ? point.slice(0, 35) + '...' : point}
              </span>
            ) : (
              <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa thiết lập</span>
            )}
          </span>
        );
      },
    },
    {
      key: 'total_slots',
      title: 'Tổng chỗ',
      width: '85px',
      align: 'center',
    },
    {
      key: 'booked_slots',
      title: 'Đã đặt',
      width: '75px',
      align: 'center',
    },
    {
      key: 'reserved_slots',
      title: 'Giữ tạm',
      width: '75px',
      align: 'center',
    },
    {
      key: 'available_slots',
      title: 'Còn lại',
      width: '75px',
      align: 'center',
      render: (dep) => (
        <span
          style={{
            fontWeight: 600,
            color: dep.available_slots > 0 ? 'var(--secondary-color)' : 'var(--danger-color)',
          }}
        >
          {dep.available_slots}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: '110px',
      render: (dep) => <StatusBadge status={dep.status} statusMap={DEPARTURE_STATUS_MAP} />,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      width: '120px',
      align: 'center',
      render: (dep) => (
        <ActionButtons
          actions={[
            {
              key: 'logs',
              icon: History,
              title: 'Xem lịch sử thay đổi',
              onClick: () => openEditModal(dep, 'logs'),
              variant: 'view',
            },
            {
              key: 'edit',
              icon: Edit2,
              title: 'Chỉnh sửa lịch khởi hành',
              onClick: () => openEditModal(dep, 'form'),
              variant: 'edit',
            },
            {
              key: 'delete',
              icon: Trash2,
              title: dep.booked_slots > 0 ? 'Đã có khách đặt (không thể xóa)' : 'Xóa lịch khởi hành',
              onClick: () => handleDelete(dep),
              variant: 'delete',
              disabled: dep.booked_slots > 0,
              style: { opacity: dep.booked_slots > 0 ? 0.4 : 1 },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ margin: 0 }}>Danh sách lịch khởi hành ({departures.length})</h3>
        <button type="button" className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> <span>Thêm lịch khởi hành</span>
        </button>
      </div>

      {departures.length === 0 && !loading && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#b45309', fontSize: '0.875rem' }}>
            ⚠️ Chuyến đi này chưa có lịch khởi hành nào. Hãy tạo lịch để khách hàng có thể đặt chỗ!
          </span>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openAddModal}
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            + Thêm ngày đi ngay
          </button>
        </div>
      )}

      <AdminDataTable
        columns={columns}
        data={departures}
        loading={loading}
        emptyText="Chưa có lịch khởi hành nào"
        hideStt={true}
      />

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '640px',
              maxWidth: '96%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              borderRadius: '12px',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                {editingDep ? 'Chỉnh sửa lịch khởi hành' : 'Thêm lịch khởi hành mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '20px',
              }}
            >
              <button
                type="button"
                onClick={() => setModalTab('form')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'form' ? '2px solid #2563eb' : '2px solid transparent',
                  color: modalTab === 'form' ? '#2563eb' : '#64748b',
                  fontWeight: modalTab === 'form' ? 600 : 500,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Thông tin lịch khởi hành
              </button>
              {editingDep && (
                <button
                  type="button"
                  onClick={() => setModalTab('logs')}
                  style={{
                    padding: '8px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: modalTab === 'logs' ? '2px solid #2563eb' : '2px solid transparent',
                    color: modalTab === 'logs' ? '#2563eb' : '#64748b',
                    fontWeight: modalTab === 'logs' ? 600 : 500,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <History size={15} />
                  Lịch sử thay đổi điểm tập trung ({changeLogs.length})
                </button>
              )}
            </div>

            {/* TAB CONTENT */}
            {modalTab === 'logs' ? (
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: '#1e293b' }}>
                  Lịch sử thay đổi địa điểm tập trung (DepartureChangeLog)
                </h4>
                {loadingLogs ? (
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Đang tải lịch sử...</p>
                ) : changeLogs.length === 0 ? (
                  <div
                    style={{
                      padding: '24px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontSize: '0.9rem',
                    }}
                  >
                    Chưa có lần thay đổi địa điểm tập trung nào được ghi nhận.
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                    }}
                  >
                    {changeLogs.map((log) => (
                      <div
                        key={log._id}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '14px 16px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '6px',
                            fontSize: '0.85rem',
                          }}
                        >
                          <span style={{ color: '#475569', fontWeight: 600 }}>
                            👤 {log.changed_by?.full_name || log.changed_by?.email || 'Quản trị viên'}
                          </span>
                          <span style={{ color: '#94a3b8' }}>
                            ⏱ {new Date(log.changed_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', marginBottom: '6px' }}>
                          <span style={{ color: '#991b1b', textDecoration: 'line-through' }}>
                            {log.old_value}
                          </span>
                          <span style={{ margin: '0 8px', color: '#64748b' }}>➔</span>
                          <strong style={{ color: '#166534' }}>{log.new_value}</strong>
                        </div>
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: '#334155',
                            background: '#fff',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            borderLeft: '3px solid #2563eb',
                          }}
                        >
                          <strong>Lý do:</strong> {log.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: '24px',
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '16px',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setModalTab('form')}
                  >
                    Quay lại chỉnh sửa
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Ngày & Giờ tour bắt đầu *</label>
                  <input
                    type="datetime-local"
                    name="start_datetime"
                    className="form-control"
                    value={formData.start_datetime}
                    onChange={handleChange}
                    required
                    disabled={Boolean(editingDep && editingDep.booked_slots > 0)}
                  />
                  {editingDep && editingDep.booked_slots > 0 ? (
                    <small style={{ color: 'var(--text-muted)' }}>
                      Lịch đã có {editingDep.booked_slots} khách đặt nên không thể đổi ngày giờ.
                    </small>
                  ) : (
                    <small style={{ color: 'var(--text-muted)' }}>
                      Thống nhất theo giờ Việt Nam (Asia/Ho_Chi_Minh).
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    📍 Địa điểm tập trung của đoàn * {isMeetingPointChanged && <span style={{ color: '#ea580c' }}>(Đã thay đổi)</span>}
                  </label>
                  <input
                    type="text"
                    name="meeting_point"
                    className="form-control"
                    value={formData.meeting_point}
                    onChange={handleChange}
                    placeholder="VD: Cột số 12, Ga Quốc Nội, Sân bay Tân Sơn Nhất, TP.HCM"
                    required
                  />
                  <small style={{ color: 'var(--text-muted)' }}>
                    Địa chỉ/mô tả rõ ràng để khách tự di chuyển và có mặt đúng giờ.
                  </small>
                </div>

                {isMeetingPointChanged && (
                  <div
                    className="form-group"
                    style={{
                      background: '#fff1f2',
                      padding: '14px',
                      borderRadius: '8px',
                      border: '1px solid #fecdd3',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <AlertTriangle size={18} color="#be123c" />
                      <strong style={{ color: '#9f1239' }}>
                        Lý do thay đổi địa điểm tập trung * (Bắt buộc)
                      </strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#881337', marginBottom: '6px' }}>
                      Địa điểm cũ: <em>{initialMeetingPoint || '(Chưa cấu hình)'}</em>
                    </div>
                    <textarea
                      name="meeting_point_change_reason"
                      className="form-control"
                      rows={2}
                      value={formData.meeting_point_change_reason}
                      onChange={handleChange}
                      placeholder="VD: Do đối tác sửa chữa sảnh đón, dời điểm tập trung sang Cột 15..."
                      required
                    />
                    <small style={{ color: '#be123c', fontSize: '0.78rem', display: 'block', marginTop: '4px' }}>
                      Lý do này sẽ được ghi vào lịch sử và gửi trực tiếp qua email thông báo cho khách hàng đã đặt tour.
                    </small>
                  </div>
                )}

                <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Tổng số khách tối đa *</label>
                    <input
                      type="number"
                      name="total_slots"
                      className="form-control"
                      value={formData.total_slots}
                      onChange={handleChange}
                      min={
                        editingDep
                          ? editingDep.booked_slots + editingDep.reserved_slots || 1
                          : 1
                      }
                      required
                    />
                    {editingDep && editingDep.booked_slots + editingDep.reserved_slots > 0 ? (
                      <small style={{ color: '#b45309' }}>
                        Tối thiểu {editingDep.booked_slots + editingDep.reserved_slots} khách (đã đặt:{' '}
                        {editingDep.booked_slots}, giữ tạm: {editingDep.reserved_slots}).
                      </small>
                    ) : (
                      <small style={{ color: 'var(--text-muted)' }}>
                        Số lượng khách cố định do Admin sắp xếp cho đợt này.
                      </small>
                    )}
                  </div>

                  {editingDep && (
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Trạng thái đợt</label>
                      <select
                        name="status"
                        className="form-control"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        {getStatusOptions().map((st) => (
                          <option key={st} value={st}>
                            {DEPARTURE_STATUS_MAP[st]?.label || st} ({st})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    marginTop: '24px',
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '16px',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowModal(false)}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingDep ? 'Lưu lịch khởi hành' : 'Tạo lịch khởi hành'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TourDepartures;
