import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  ArrowLeft,
  Users,
  CreditCard,
  Send,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Heart,
  Mail,
  FileCheck,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminDataTable,
} from '../../../components/common';
import {
  getAlbumDetail,
  getAlbumPhotos,
  uploadAlbumPhotos,
  updatePhoto,
  deletePhoto,
  getDepartureCustomers,
  getAlbumCards,
  batchCreateCards,
  batchSubmitCardReview,
  submitCardReview,
  resendCardEmail,
} from '../souvenirAdminService';
import {
  PHOTO_CATEGORY_META,
  CARD_STATUS_META,
  EMAIL_STATUS_META,
} from '../souvenirConstants';
import CardPreviewModal from '../components/CardPreviewModal';
import CardEditModal from '../components/CardEditModal';
import AssignPhotoModal from '../components/AssignPhotoModal';

function AlbumManage() {
  const { albumId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'customers' | 'cards'
  const [loading, setLoading] = useState(true);
  const [albumData, setAlbumData] = useState(null);
  const [error, setError] = useState(null);

  // Tab 1: Photos
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadCategory, setUploadCategory] = useState('GROUP');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  // Tab 2: Customers
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [assigningCustomer, setAssigningCustomer] = useState(null);

  // Tab 3: Cards
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [previewCardId, setPreviewCardId] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [batchActionLoading, setBatchActionLoading] = useState(false);

  // Fetch Album Detail
  const fetchAlbumDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAlbumDetail(albumId);
      if (res?.success) {
        setAlbumData(res.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tải thông tin Album');
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  // Fetch Photos
  const fetchPhotos = useCallback(async () => {
    try {
      setPhotosLoading(true);
      const params = { limit: 100 };
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      const res = await getAlbumPhotos(albumId, params);
      if (res?.success) {
        setPhotos(res.data.photos || []);
      }
    } catch (err) {
      console.error('Lỗi tải ảnh:', err);
    } finally {
      setPhotosLoading(false);
    }
  }, [albumId, categoryFilter]);

  // Fetch Customers
  const fetchCustomers = useCallback(async () => {
    try {
      setCustomersLoading(true);
      const res = await getDepartureCustomers(albumId);
      if (res?.success) {
        setCustomers(res.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách khách:', err);
    } finally {
      setCustomersLoading(false);
    }
  }, [albumId]);

  // Fetch Cards
  const fetchCards = useCallback(async () => {
    try {
      setCardsLoading(true);
      const res = await getAlbumCards(albumId, { limit: 100 });
      if (res?.success) {
        setCards(res.data.cards || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách thiệp:', err);
    } finally {
      setCardsLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    fetchAlbumDetail();
  }, [fetchAlbumDetail]);

  useEffect(() => {
    if (activeTab === 'photos') fetchPhotos();
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'cards') fetchCards();
  }, [activeTab, fetchPhotos, fetchCustomers, fetchCards]);

  // Upload handler
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return alert('Vui lòng chọn ít nhất 1 ảnh');

    const formData = new FormData();
    for (const file of uploadFiles) {
      formData.append('photos', file);
    }
    formData.append('category', uploadCategory);
    formData.append('caption', uploadCaption);

    try {
      setUploading(true);
      const res = await uploadAlbumPhotos(albumId, formData);
      if (res?.success) {
        alert(`Tải lên thành công ${res.data.total_uploaded} ảnh!`);
        setUploadFiles([]);
        setUploadCaption('');
        fetchAlbumDetail();
        fetchPhotos();
      }
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  // Delete photo handler
  const handleDeletePhoto = async (photo) => {
    if (!window.confirm('Bạn có chắc muốn xóa ảnh này khỏi Album?')) return;
    try {
      const res = await deletePhoto(photo._id, false);
      if (res?.data?.warning) {
        if (window.confirm(res.data.message)) {
          await deletePhoto(photo._id, true);
          fetchPhotos();
          fetchAlbumDetail();
        }
      } else {
        fetchPhotos();
        fetchAlbumDetail();
      }
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi khi xóa ảnh');
    }
  };

  // Batch Card Creation
  const handleBatchCreateCards = async () => {
    if (!window.confirm('Tạo thiệp bản nháp cho toàn bộ khách hàng chưa có thiệp trong đoàn?')) return;
    try {
      setBatchActionLoading(true);
      const res = await batchCreateCards(albumId);
      if (res?.success) {
        alert(`Đã tạo thành công ${res.data.created_count} thiệp!`);
        fetchCards();
      }
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi khi tạo thiệp hàng loạt');
    } finally {
      setBatchActionLoading(false);
    }
  };

  // Batch Submit Cards
  const handleBatchSubmitCards = async () => {
    if (!window.confirm('Gửi toàn bộ thiệp nháp sang Admin chờ duyệt?')) return;
    try {
      setBatchActionLoading(true);
      const res = await batchSubmitCardReview(albumId);
      if (res?.success) {
        alert(`Đã gửi duyệt ${res.data.submitted} thiệp thành công!`);
        fetchCards();
      }
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi gửi duyệt');
    } finally {
      setBatchActionLoading(false);
    }
  };

  // Single Card Submit Review
  const handleSubmitSingleCard = async (cardId) => {
    try {
      const res = await submitCardReview(cardId);
      if (res?.success) {
        fetchCards();
      }
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi khi gửi duyệt thiệp');
    }
  };

  // Resend email
  const handleResendEmail = async (cardId) => {
    if (!window.confirm('Gửi lại email thông báo thiệp cho khách này?')) return;
    try {
      const res = await resendCardEmail(cardId);
      if (res?.success) {
        alert('Đã kích hoạt gửi lại email thành công!');
        fetchCards();
      }
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi gửi lại email');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải Album...</div>;
  }

  if (error || !albumData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
        {error || 'Không tìm thấy Album'}
        <div style={{ marginTop: '16px' }}>
          <button className="btn btn-outline" onClick={() => navigate('/admin/souvenirs')}>
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const { album, photo_stats, customer_count } = albumData;
  const tour = album.tour_id || {};
  const departure = album.departure_id || {};

  return (
    <div className="admin-page-container">
      {/* Top Navigation & Info */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => navigate('/admin/souvenirs')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#2563eb',
            cursor: 'pointer',
            fontSize: '0.875rem',
            padding: 0,
            marginBottom: '10px',
          }}
        >
          <ArrowLeft size={16} /> Quay lại danh sách đợt khởi hành
        </button>

        <AdminPageHeader
          title={album.title}
          subtitle={`Tour: ${tour.title || tour.name} (${tour.code}) · Khởi hành: ${
            departure.start_datetime ? new Date(departure.start_datetime).toLocaleDateString('vi-VN') : ''
          } · ${customer_count} khách`}
          actions={
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  fetchAlbumDetail();
                  if (activeTab === 'photos') fetchPhotos();
                  if (activeTab === 'customers') fetchCustomers();
                  if (activeTab === 'cards') fetchCards();
                }}
              >
                <RefreshCw size={14} /> Làm mới
              </button>
            </div>
          }
        />
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ padding: '14px 18px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.813rem', color: '#64748b' }}>Tổng số ảnh</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
            {photo_stats.TOTAL}
          </div>
        </div>
        <div style={{ padding: '14px 18px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.813rem', color: '#2563eb' }}>Ảnh tập thể đoàn</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
            {photo_stats.GROUP}
          </div>
        </div>
        <div style={{ padding: '14px 18px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.813rem', color: '#059669' }}>Địa điểm & Hoạt động</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
            {photo_stats.LOCATION + photo_stats.ACTIVITY}
          </div>
        </div>
        <div style={{ padding: '14px 18px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.813rem', color: '#7c3aed' }}>Ảnh riêng khách hàng</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#7c3aed', marginTop: '4px' }}>
            {photo_stats.PERSONAL}
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '20px',
        }}
      >
        {[
          { key: 'photos', label: 'Kho Ảnh Album', icon: <Camera size={16} /> },
          { key: 'customers', label: 'Gắn Ảnh Hành Khách', icon: <Users size={16} /> },
          { key: 'cards', label: 'Quản Lý Thiệp Điện Tử', icon: <CreditCard size={16} /> },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
                marginBottom: '-2px',
                color: isActive ? '#2563eb' : '#64748b',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.938rem',
                cursor: 'pointer',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* ==================================================== */}
      {/* TAB 1: KHO ẢNH (PHOTO GALLERY)                       */}
      {/* ==================================================== */}
      {activeTab === 'photos' && (
        <div>
          {/* Upload Box */}
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
            }}
          >
            <h4 style={{ margin: '0 0 12px', fontSize: '0.938rem', fontWeight: 600, color: '#1e293b' }}>
              📤 Tải ảnh lên Album (Tối đa 20 ảnh/lần, 10MB/ảnh)
            </h4>
            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 250px' }}>
                <label style={{ display: 'block', fontSize: '0.813rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                  Chọn tệp ảnh (JPEG, PNG, WebP)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setUploadFiles(Array.from(e.target.files))}
                  style={{ width: '100%', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ width: '180px' }}>
                <label style={{ display: 'block', fontSize: '0.813rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                  Phân loại ảnh
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                >
                  <option value="GROUP">Ảnh chung cả đoàn</option>
                  <option value="LOCATION">Địa điểm tham quan</option>
                  <option value="ACTIVITY">Hoạt động trải nghiệm</option>
                  <option value="PERSONAL">Ảnh riêng hành khách</option>
                </select>
              </div>

              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '0.813rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                  Chú thích chung (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cả đoàn chụp tại Đỉnh Fansipan"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={uploading || uploadFiles.length === 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <Upload size={16} />
                {uploading ? 'Đang tải lên...' : `Tải lên (${uploadFiles.length})`}
              </button>
            </form>
          </div>

          {/* Filter Bar for Photos */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>Lọc theo nhóm:</span>
            {[
              { key: 'ALL', label: `Tất cả (${photo_stats.TOTAL})` },
              { key: 'GROUP', label: `Tập thể đoàn (${photo_stats.GROUP})` },
              { key: 'LOCATION', label: `Địa điểm (${photo_stats.LOCATION})` },
              { key: 'ACTIVITY', label: `Hoạt động (${photo_stats.ACTIVITY})` },
              { key: 'PERSONAL', label: `Ảnh riêng (${photo_stats.PERSONAL})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCategoryFilter(tab.key)}
                style={{
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.813rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  backgroundColor: categoryFilter === tab.key ? '#2563eb' : '#fff',
                  color: categoryFilter === tab.key ? '#fff' : '#475569',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Photos Grid */}
          {photosLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải danh sách ảnh...</div>
          ) : photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '12px', color: '#94a3b8' }}>
              Chưa có ảnh nào trong mục này. Vui lòng tải ảnh lên ở khung phía trên.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '14px',
              }}
            >
              {photos.map((p) => {
                const catMeta = PHOTO_CATEGORY_META[p.category] || { label: p.category, color: '#64748b', bg: '#f1f5f9' };
                return (
                  <div
                    key={p._id}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ position: 'relative', height: '140px', backgroundColor: '#f8fafc' }}>
                      <img
                        src={p.thumbnail_url || p.url}
                        alt={p.caption || 'Photo'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          fontSize: '0.688rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: catMeta.bg,
                          color: catMeta.color,
                        }}
                      >
                        {catMeta.label}
                      </span>
                    </div>

                    <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div
                        style={{
                          fontSize: '0.813rem',
                          color: p.caption ? '#1e293b' : '#94a3b8',
                          fontStyle: p.caption ? 'normal' : 'italic',
                          marginBottom: '8px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.caption || 'Chưa có chú thích'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {p.category === 'PERSONAL' ? `Gắn: ${p.assigned_customers?.length || 0} khách` : 'Chung đoàn'}
                        </span>
                        <button
                          onClick={() => handleDeletePhoto(p)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Xóa ảnh"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: GẮN ẢNH HÀNH KHÁCH (CUSTOMER ASSIGNMENT)      */}
      {/* ==================================================== */}
      {activeTab === 'customers' && (
        <div>
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '16px',
              fontSize: '0.875rem',
              color: '#475569',
            }}
          >
            💡 <strong>Hướng dẫn:</strong> Bấm vào nút <strong>"Gắn ảnh riêng"</strong> ở từng khách để mở kho ảnh và gắn những bức ảnh chụp riêng cho khách đó. Ảnh cá nhân chỉ có hành khách đó và chủ đơn mới được xem trong thiệp.
          </div>

          <AdminDataTable
            columns={[
              {
                key: 'full_name',
                title: 'Họ và tên hành khách',
                render: (row) => (
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{row.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Đơn: <strong>{row.order_code}</strong> · {row.gender || ''}
                    </div>
                  </div>
                ),
              },
              {
                key: 'contact',
                title: 'Liên hệ',
                render: (row) => (
                  <div style={{ fontSize: '0.813rem' }}>
                    <div>📞 {row.phone}</div>
                    <div style={{ color: '#64748b' }}>✉️ {row.email || 'Không có email'}</div>
                  </div>
                ),
              },
              {
                key: 'photos_assigned',
                title: 'Ảnh riêng đã gắn',
                align: 'center',
                width: '160px',
                render: (row) => {
                  const count = row.personal_photos_count || 0;
                  return (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        backgroundColor: count > 0 ? '#f5f3ff' : '#f1f5f9',
                        color: count > 0 ? '#7c3aed' : '#94a3b8',
                        fontWeight: 600,
                        fontSize: '0.813rem',
                      }}
                    >
                      <Heart size={14} fill={count > 0 ? '#7c3aed' : 'none'} />
                      {count} ảnh
                    </span>
                  );
                },
              },
              {
                key: 'card_status',
                title: 'Trạng thái Thiệp',
                width: '160px',
                render: (row) => {
                  if (!row.card) {
                    return <span style={{ color: '#94a3b8', fontSize: '0.813rem' }}>Chưa tạo</span>;
                  }
                  const meta = CARD_STATUS_META[row.card.status] || { label: row.card.status, color: '#64748b' };
                  return (
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: `${meta.color}15`,
                        color: meta.color,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    >
                      {meta.label}
                    </span>
                  );
                },
              },
              {
                key: 'actions',
                title: 'Thao tác',
                align: 'right',
                width: '160px',
                render: (row) => (
                  <button
                    className="btn btn-outline-primary btn-sm"
                    style={{
                      fontSize: '0.813rem',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setAssigningCustomer(row)}
                  >
                    Gắn ảnh riêng
                  </button>
                ),
              },
            ]}
            data={customers}
            loading={customersLoading}
            emptyText="Không có hành khách nào trong đợt khởi hành này."
            rowKey="booking_customer_id"
          />
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: QUẢN LÝ THIỆP ĐIỆN TỬ (CARDS MANAGEMENT)       */}
      {/* ==================================================== */}
      {activeTab === 'cards' && (
        <div>
          {/* Action Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Tổng cộng <strong>{cards.length}</strong> thiệp trong đợt khởi hành này
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={handleBatchCreateCards}
                disabled={batchActionLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.813rem',
                }}
              >
                <Sparkles size={15} /> Tạo thiệp hàng loạt
              </button>

              <button
                className="btn btn-primary btn-sm"
                onClick={handleBatchSubmitCards}
                disabled={batchActionLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.813rem',
                }}
              >
                <Send size={15} /> Gửi duyệt toàn bộ bản nháp
              </button>
            </div>
          </div>

          <AdminDataTable
            columns={[
              {
                key: 'recipient',
                title: 'Hành khách nhận thiệp',
                render: (row) => (
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{row.recipient_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Mã thiệp: <code style={{ backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: '4px' }}>{row.public_code}</code>
                    </div>
                  </div>
                ),
              },
              {
                key: 'email',
                title: 'Email nhận',
                render: (row) => {
                  const emailStatus = EMAIL_STATUS_META[row.email_status] || { label: row.email_status, color: '#64748b' };
                  return (
                    <div>
                      <div style={{ fontSize: '0.813rem', color: '#1e293b' }}>{row.recipient_email || 'Chưa có email'}</div>
                      <span style={{ fontSize: '0.688rem', fontWeight: 600, color: emailStatus.color }}>
                        ● {emailStatus.label}
                      </span>
                    </div>
                  );
                },
              },
              {
                key: 'status',
                title: 'Trạng thái Thiệp',
                width: '160px',
                render: (row) => {
                  const meta = CARD_STATUS_META[row.status] || { label: row.status, color: '#64748b' };
                  return (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: `${meta.color}15`,
                        color: meta.color,
                        fontWeight: 600,
                        fontSize: '0.813rem',
                      }}
                    >
                      {meta.label}
                    </span>
                  );
                },
              },
              {
                key: 'viewed',
                title: 'Khách xem',
                width: '110px',
                align: 'center',
                render: (row) => (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: row.customer_viewed ? '#10b981' : '#94a3b8',
                      fontWeight: 600,
                    }}
                  >
                    {row.customer_viewed ? '✓ Đã xem' : 'Chưa xem'}
                  </span>
                ),
              },
              {
                key: 'actions',
                title: 'Thao tác',
                align: 'right',
                width: '260px',
                render: (row) => (
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      title="Xem trước thiệp"
                      onClick={() => setPreviewCardId(row._id)}
                    >
                      <Eye size={14} /> Xem trước
                    </button>

                    {['DRAFT', 'REVISION_REQUESTED'].includes(row.status) && (
                      <>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          title="Sửa thiệp"
                          onClick={() => setEditingCard(row)}
                        >
                          <Edit size={14} /> Sửa
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#2563eb', color: '#fff', border: 'none' }}
                          title="Gửi duyệt"
                          onClick={() => handleSubmitSingleCard(row._id)}
                        >
                          <Send size={14} /> Gửi duyệt
                        </button>
                      </>
                    )}

                    {row.status === 'PUBLISHED' && row.email_status === 'FAILED' && (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444', borderColor: '#ef4444' }}
                        title="Gửi lại email"
                        onClick={() => handleResendEmail(row._id)}
                      >
                        <Mail size={14} /> Gửi lại email
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            data={cards}
            loading={cardsLoading}
            emptyText="Chưa có thiệp nào. Nhấn nút 'Tạo thiệp hàng loạt' để bắt đầu."
            rowKey="_id"
          />
        </div>
      )}

      {/* MODALS */}
      {previewCardId && (
        <CardPreviewModal cardId={previewCardId} onClose={() => setPreviewCardId(null)} />
      )}

      {editingCard && (
        <CardEditModal
          card={editingCard}
          albumId={albumId}
          onClose={() => setEditingCard(null)}
          onSuccess={(updated) => {
            setEditingCard(null);
            fetchCards();
          }}
        />
      )}

      {assigningCustomer && (
        <AssignPhotoModal
          customer={assigningCustomer}
          albumId={albumId}
          onClose={() => setAssigningCustomer(null)}
          onUpdated={() => {
            fetchCustomers();
            fetchAlbumDetail();
          }}
        />
      )}
    </div>
  );
}

export default AlbumManage;

