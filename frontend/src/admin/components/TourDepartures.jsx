import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';
import { AdminDataTable, StatusBadge, ActionButtons } from './common';

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
 * Component Quản lý Đợt Khởi Hành của một Tour (Admin)
 */
function TourDepartures({ productId, autoOpenAdd = false }) {
  const [departures, setDepartures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDep, setEditingDep] = useState(null);
  const [formData, setFormData] = useState({
    departure_date: '', departure_location: '', vehicle: 'Ô tô 45 chỗ', total_slots: 30, status: 'OPEN',
  });

  const fetchDepartures = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get(`/tours/${productId}/departures`);
      setDepartures(res?.data?.departures || []);
    } catch (error) {
      alert(error?.message || 'Không thể tải danh sách đợt khởi hành');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { fetchDepartures(); }, [fetchDepartures]);

  const openAddModal = useCallback(() => {
    setEditingDep(null);
    const tomorrow = new Date(Date.now() + 86400000);
    setFormData({
      departure_date: toDatetimeLocal(tomorrow.toISOString()),
      departure_location: 'TP. Hồ Chí Minh', vehicle: 'Ô tô 45 chỗ', total_slots: 30, status: 'OPEN',
    });
    setShowModal(true);
  }, []);

  useEffect(() => {
    if (autoOpenAdd) {
      openAddModal();
    }
  }, [autoOpenAdd, openAddModal]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const openEditModal = (dep) => {
    setEditingDep(dep);
    setFormData({
      departure_date: toDatetimeLocal(dep.departure_date),
      departure_location: dep.departure_location || '', vehicle: dep.vehicle || '',
      total_slots: dep.total_slots || 0, status: dep.status || 'OPEN',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.departure_location.trim() || !formData.departure_date) {
      alert('Vui lòng nhập đầy đủ thông tin ngày và điểm khởi hành');
      return;
    }
    try {
      const dateIso = new Date(formData.departure_date).toISOString();
      if (editingDep) {
        const updatePayload = {
          departure_location: formData.departure_location, vehicle: formData.vehicle,
          total_slots: Number(formData.total_slots),
        };
        if (editingDep.booked_slots === 0) updatePayload.departure_date = dateIso;
        await axiosAdmin.patch(`/departures/${editingDep._id}`, updatePayload);

        if (formData.status !== editingDep.status) {
          await axiosAdmin.patch(`/departures/${editingDep._id}/status`, { status: formData.status });
        }
        alert('Cập nhật đợt khởi hành thành công');
      } else {
        await axiosAdmin.post(`/tours/${productId}/departures`, {
          departure_date: dateIso, departure_location: formData.departure_location,
          vehicle: formData.vehicle, total_slots: Number(formData.total_slots),
        });
        alert('Thêm đợt khởi hành thành công');
      }
      setShowModal(false);
      fetchDepartures();
    } catch (err) {
      const msg = Array.isArray(err?.errors) && err.errors.length > 0
        ? err.errors.map((item) => item.message).join('\n')
        : (err?.message || 'Lỗi lưu đợt khởi hành');
      alert(msg);
    }
  };

  const handleDelete = async (dep) => {
    if (dep.booked_slots > 0) return alert('Không thể xóa đợt khởi hành đã có khách đặt chỗ.');
    if (!window.confirm('Bạn có chắc chắn muốn xóa đợt khởi hành này?')) return;
    try {
      await axiosAdmin.delete(`/departures/${dep._id}`);
      alert('Đã xóa đợt khởi hành');
      fetchDepartures();
    } catch (err) {
      alert(err?.message || 'Lỗi khi xóa đợt');
    }
  };

  const getStatusOptions = () => {
    if (!editingDep) return ['OPEN'];
    return [editingDep.status, ...(STATUS_TRANSITIONS[editingDep.status] || [])];
  };

  const columns = [
    {
      key: 'departure_date',
      title: 'Ngày khởi hành',
      render: (dep) => new Date(dep.departure_date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      key: 'departure_location',
      title: 'Điểm đi',
    },
    {
      key: 'vehicle',
      title: 'Phương tiện',
    },
    {
      key: 'total_slots',
      title: 'Tổng chỗ',
      width: '90px',
      align: 'center',
    },
    {
      key: 'booked_slots',
      title: 'Đã đặt',
      width: '80px',
      align: 'center',
    },
    {
      key: 'reserved_slots',
      title: 'Giữ tạm',
      width: '80px',
      align: 'center',
    },
    {
      key: 'available_slots',
      title: 'Còn lại',
      width: '80px',
      align: 'center',
      render: (dep) => (
        <span style={{ fontWeight: 600, color: dep.available_slots > 0 ? 'var(--secondary-color)' : 'var(--danger-color)' }}>
          {dep.available_slots}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: '120px',
      render: (dep) => <StatusBadge status={dep.status} statusMap={DEPARTURE_STATUS_MAP} />,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      width: '100px',
      align: 'center',
      render: (dep) => (
        <ActionButtons
          actions={[
            {
              key: 'edit',
              icon: Edit2,
              title: 'Chỉnh sửa đợt khởi hành',
              onClick: () => openEditModal(dep),
              variant: 'edit',
            },
            {
              key: 'delete',
              icon: Trash2,
              title: dep.booked_slots > 0 ? 'Đã có khách đặt (không thể xóa)' : 'Xóa đợt khởi hành',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Danh sách đợt khởi hành ({departures.length})</h3>
        <button type="button" className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> <span>Thêm đợt khởi hành</span>
        </button>
      </div>

      {departures.length === 0 && !loading && (
        <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#b45309', fontSize: '0.875rem' }}>
            ⚠️ Chuyến đi này chưa có đợt khởi hành nào. Hãy tạo ngày khởi hành để khách hàng có thể đặt chỗ!
          </span>
          <button type="button" className="btn btn-primary" onClick={openAddModal} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            + Thêm ngày đi ngay
          </button>
        </div>
      )}

      <AdminDataTable
        columns={columns}
        data={departures}
        loading={loading}
        emptyText="Chưa có đợt khởi hành nào"
        hideStt={true}
      />

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '520px', maxWidth: '90%', padding: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>{editingDep ? 'Sửa đợt khởi hành' : 'Thêm đợt khởi hành'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Ngày & Giờ khởi hành</label>
                <input type="datetime-local" name="departure_date" className="form-control" value={formData.departure_date} onChange={handleChange} required disabled={Boolean(editingDep && editingDep.booked_slots > 0)} />
                {editingDep && editingDep.booked_slots > 0 && <small style={{ color: 'var(--text-muted)' }}>Đợt đã có khách đặt nên không thể đổi ngày.</small>}
              </div>

              <div className="form-group">
                <label className="form-label">Điểm xuất phát</label>
                <input type="text" name="departure_location" className="form-control" value={formData.departure_location} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label className="form-label">Phương tiện di chuyển</label>
                <input type="text" name="vehicle" className="form-control" value={formData.vehicle} onChange={handleChange} required />
              </div>

              <div className="form-row">
                <div className="form-group form-col">
                  <label className="form-label">Tổng số chỗ</label>
                  <input type="number" name="total_slots" className="form-control" value={formData.total_slots} onChange={handleChange} min={editingDep ? (editingDep.booked_slots + editingDep.reserved_slots) || 1 : 1} required />
                  {editingDep && (editingDep.booked_slots + editingDep.reserved_slots > 0) && (
                    <small style={{ color: 'var(--text-muted)' }}>Tối thiểu {editingDep.booked_slots + editingDep.reserved_slots} chỗ.</small>
                  )}
                </div>

                {editingDep && (
                  <div className="form-group form-col">
                    <label className="form-label">Trạng thái đợt</label>
                    <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                      {getStatusOptions().map((st) => (
                        <option key={st} value={st}>{DEPARTURE_STATUS_MAP[st]?.label || st} ({st})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu đợt khởi hành</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TourDepartures;
