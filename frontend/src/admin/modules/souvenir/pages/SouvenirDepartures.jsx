import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  FolderPlus,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
  Inbox,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminDataTable,
} from '../../../components/common';
import {
  getCompletedDepartures,
  createAlbum,
} from '../souvenirAdminService';

function SouvenirDepartures() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [departures, setDepartures] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [creatingDepId, setCreatingDepId] = useState(null);

  const fetchDepartures = useCallback(async (page = 1, searchQuery = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCompletedDepartures({
        page,
        limit: pagination.limit,
        search: searchQuery,
      });

      if (res?.success) {
        setDepartures(res.data.items || []);
        setPagination({
          page: res.data.pagination.page,
          limit: res.data.pagination.limit,
          total: res.data.pagination.total,
          totalPages: res.data.pagination.total_pages,
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách đợt khởi hành');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, search]);

  useEffect(() => {
    fetchDepartures(1);
  }, []);

  const handleCreateAlbum = async (depId) => {
    if (!window.confirm('Bạn có chắc muốn tạo Album kỷ niệm cho đợt khởi hành này?')) return;

    try {
      setCreatingDepId(depId);
      const res = await createAlbum({ departure_id: depId });
      if (res?.success) {
        navigate(`/admin/souvenirs/albums/${res.data._id}`);
      }
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi khi tạo album');
    } finally {
      setCreatingDepId(null);
    }
  };

  const columns = [
    {
      key: 'tour_info',
      title: 'Tour / Điểm đến',
      render: (row) => {
        const tour = row.tour || {};
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {tour.main_image ? (
              <img
                src={tour.main_image}
                alt={tour.title || tour.name}
                style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                }}
              >
                <Camera size={20} />
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>
                {tour.title || tour.name || 'Tour chưa đặt tên'}
              </div>
              <div style={{ fontSize: '0.813rem', color: '#64748b', marginTop: '2px' }}>
                Mã: <strong>{tour.code || 'N/A'}</strong> · {tour.duration || ''}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'departure_date',
      title: 'Ngày khởi hành',
      width: '160px',
      render: (row) => {
        const d = row.start_datetime ? new Date(row.start_datetime) : null;
        return (
          <div>
            <div style={{ fontWeight: 500, color: '#1e293b' }}>
              {d ? d.toLocaleDateString('vi-VN') : '---'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {d ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
            </div>
          </div>
        );
      },
    },
    {
      key: 'customers_count',
      title: 'Số khách',
      width: '110px',
      align: 'center',
      render: (row) => (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: '#f1f5f9',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: '#334155',
          }}
        >
          {row.total_customers} khách
        </span>
      ),
    },
    {
      key: 'album_status',
      title: 'Trạng thái Album',
      width: '180px',
      render: (row) => {
        if (!row.has_album) {
          return (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#64748b',
                fontSize: '0.875rem',
              }}
            >
              <Clock size={15} /> Chưa tạo Album
            </span>
          );
        }
        return (
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#059669',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              <CheckCircle2 size={16} /> Đã có Album
            </span>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              📸 <strong>{row.album?.photo_count || 0}</strong> ảnh trong kho
            </div>
          </div>
        );
      },
    },
    {
      key: 'cards_progress',
      title: 'Tiến độ Thiệp',
      width: '180px',
      render: (row) => {
        const total = row.total_customers || 0;
        const created = row.cards_count || 0;
        const published = row.published_cards_count || 0;
        const pct = total > 0 ? Math.round((published / total) * 100) : 0;

        return (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.813rem',
                marginBottom: '4px',
              }}
            >
              <span>Phát hành:</span>
              <strong>{published}/{total}</strong>
            </div>
            <div
              style={{
                height: '6px',
                borderRadius: '3px',
                backgroundColor: '#e2e8f0',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  backgroundColor: pct === 100 ? '#10b981' : '#3b82f6',
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              {created > published ? `(${created - published} thiệp chờ duyệt/nháp)` : ''}
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      width: '170px',
      align: 'right',
      render: (row) => {
        if (!row.has_album) {
          return (
            <button
              className="btn btn-primary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.813rem',
                padding: '6px 12px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              disabled={creatingDepId === row.departure_id}
              onClick={() => handleCreateAlbum(row.departure_id)}
            >
              <FolderPlus size={15} />
              {creatingDepId === row.departure_id ? 'Đang tạo...' : 'Tạo Album'}
            </button>
          );
        }

        return (
          <button
            className="btn btn-outline-primary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.813rem',
              padding: '6px 12px',
              backgroundColor: '#fff',
              color: '#2563eb',
              border: '1px solid #2563eb',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
            onClick={() => navigate(`/admin/souvenirs/albums/${row.album._id}`)}
          >
            Quản lý Album <ArrowRight size={14} />
          </button>
        );
      },
    },
  ];

  return (
    <div className="admin-page-container">
      <AdminPageHeader
        title="Thiệp Điện Tử & Album Kỷ Niệm"
        subtitle="Quản lý kho ảnh, gắn ảnh hành khách và tạo thiệp tri ân cho các đợt khởi hành đã hoàn thành"
        actions={
          <button
            className="btn btn-outline btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              cursor: 'pointer',
            }}
            onClick={() => fetchDepartures(pagination.page)}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            Làm mới
          </button>
        }
      />

      {/* Filter Bar */}
      <AdminFilterBar
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          fetchDepartures(1, val);
        }}
        searchPlaceholder="Tìm kiếm theo tên hoặc mã tour..."
        onClearFilters={() => {
          setSearch('');
          fetchDepartures(1, '');
        }}
      />

      {/* Main Data Table */}
      <AdminDataTable
        columns={columns}
        data={departures}
        loading={loading}
        error={error}
        emptyText="Không có đợt khởi hành hoàn thành nào phù hợp."
        currentPage={pagination.page}
        pageSize={pagination.limit}
        totalItems={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={(p) => fetchDepartures(p)}
        rowKey="departure_id"
      />
    </div>
  );
}

export default SouvenirDepartures;

