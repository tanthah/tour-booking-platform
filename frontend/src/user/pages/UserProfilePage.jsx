import { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Nav, Card, Form, Button, Spinner, ToastContainer, Toast } from 'react-bootstrap';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { User as UserIcon, Package, Heart, LogOut, Camera } from 'lucide-react';
import axiosClient from '../config/axiosClient';
import UserOrdersList from '../modules/order/components/UserOrdersList';
import '../assets/styles/tour.css';

const UserProfilePage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Xác định tab ban đầu: Ưu tiên URL param ?tab=, kế đến location.state, kế đến localStorage, mặc định 'profile'
  const getInitialTab = () => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['profile', 'orders', 'wishlist'].includes(tabFromUrl)) {
      return tabFromUrl;
    }
    if (location.state?.tab && ['profile', 'orders', 'wishlist'].includes(location.state.tab)) {
      return location.state.tab;
    }
    const savedTab = localStorage.getItem('user_profile_active_tab');
    if (savedTab && ['profile', 'orders', 'wishlist'].includes(savedTab)) {
      return savedTab;
    }
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  // State lưu file ảnh được chọn và URL xem trước (Chỉ lưu ở client, không gọi API ngay)
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Đồng bộ tab vào URL query và localStorage khi người dùng chọn tab
  const handleTabSelect = (tabKey) => {
    if (!tabKey) return;
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey }, { replace: true });
    localStorage.setItem('user_profile_active_tab', tabKey);
  };

  // Lắng nghe nếu searchParams hoặc location.state thay đổi từ bên ngoài
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab && ['profile', 'orders', 'wishlist'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
      localStorage.setItem('user_profile_active_tab', tabFromUrl);
    } else if (location.state?.tab && location.state.tab !== activeTab) {
      setActiveTab(location.state.tab);
      setSearchParams({ tab: location.state.tab }, { replace: true });
      localStorage.setItem('user_profile_active_tab', location.state.tab);
    }
  }, [searchParams, location.state]);

  // Đảm bảo URL luôn có ?tab= tương ứng khi vừa tải trang
  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, []);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
    address: user?.address || '',
    gender: user?.gender || '',
    id_number: user?.id_number || '',
  });

  // Tải dữ liệu hồ sơ mới nhất từ server
  useEffect(() => {
    const fetchFreshProfile = async () => {
      try {
        const res = await axiosClient.get('/auth/me');
        const freshUser = res?.data || res;
        if (freshUser && freshUser.email) {
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
          setFormData({
            full_name: freshUser.full_name || '',
            phone: freshUser.phone || '',
            date_of_birth: freshUser.date_of_birth ? new Date(freshUser.date_of_birth).toISOString().split('T')[0] : '',
            address: freshUser.address || '',
            gender: freshUser.gender || '',
            id_number: freshUser.id_number || '',
          });
        }
      } catch (err) {
        console.error('Lỗi tải thông tin cá nhân:', err);
      }
    };
    fetchFreshProfile();
  }, [setUser]);

  // Dọn dẹp object URL khi đổi ảnh hoặc unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const fileInputRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_profile_active_tab');
    setUser(null);
    window.dispatchEvent(new Event('cartUpdated'));
    navigate('/');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * Chỉ chọn file và tạo ảnh xem trước cục bộ (Preview).
   * TUYỆT ĐỐI KHÔNG gọi API cập nhật server ngay tại đây
   * để tránh lỗi phiên đăng nhập khi người dùng chưa bấm "Lưu thay đổi".
   */
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ show: true, message: 'Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP...)', variant: 'danger' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ show: true, message: 'Dung lượng ảnh không được vượt quá 5MB', variant: 'danger' });
      return;
    }

    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    setToast({
      show: true,
      message: 'Đã chọn ảnh mới. Hãy bấm "Lưu thay đổi" bên dưới để hoàn tất cập nhật.',
      variant: 'info',
    });
  };

  /**
   * Khi người dùng chủ động bấm "Lưu thay đổi":
   * Gửi thông tin hồ sơ kèm file ảnh (nếu có) lên server.
   * Nếu có lỗi phiên đăng nhập (401), chỉ thông báo và chuyển hướng tại thời điểm này.
   */
  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let res;

      if (avatarFile) {
        // Gửi cả ảnh và thông tin trong FormData
        const data = new FormData();
        data.append('avatar', avatarFile);
        Object.keys(formData).forEach((key) => {
          if (formData[key] !== undefined && formData[key] !== null) {
            data.append(key, formData[key]);
          }
        });

        res = await axiosClient.patch('/auth/me', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Chỉ cập nhật thông tin văn bản
        res = await axiosClient.patch('/auth/me', formData);
      }

      const updatedUser = res?.data || res;
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      // Xóa preview tạm thời
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }
      setAvatarFile(null);

      setToast({ show: true, message: 'Cập nhật thông tin thành công!', variant: 'success' });
    } catch (error) {
      const isAuthError = error?.status === 401 || error?.statusCode === 401 || error?.response?.status === 401;
      if (isAuthError) {
        setToast({ show: true, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', variant: 'danger' });
        setTimeout(() => {
          handleLogout();
        }, 1500);
      } else {
        setToast({
          show: true,
          message: error?.message || error?.response?.data?.message || 'Lỗi khi cập nhật thông tin',
          variant: 'danger',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const currentDisplayAvatar = avatarPreview || user?.avatar_url;

  return (
    <Container className="py-5">
      <ToastContainer position="top-end" className="p-3">
        <Toast bg={toast.variant} show={toast.show} delay={3500} autohide onClose={() => setToast({ ...toast, show: false })}>
          <Toast.Body className={toast.variant === 'success' || toast.variant === 'danger' ? 'text-white' : ''}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <Row>
        {/* ============================================================
            1. SIDEBAR BÊN TRÁI (Tô màu cam #ea580c khi active)
            ============================================================ */}
        <Col md={3}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="text-center">
              <div className="position-relative d-inline-block mb-3">
                {currentDisplayAvatar ? (
                  <img
                    src={currentDisplayAvatar}
                    alt="Avatar"
                    className="rounded-circle shadow-sm"
                    style={{ width: '120px', height: '120px', objectFit: 'cover', border: '3px solid #ea580c' }}
                  />
                ) : (
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm"
                    style={{
                      width: '120px',
                      height: '120px',
                      backgroundColor: '#ea580c',
                      fontSize: '48px',
                      fontWeight: 'bold',
                      margin: '0 auto',
                    }}
                  >
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}

                <Button
                  variant="light"
                  size="sm"
                  className="position-absolute bottom-0 end-0 rounded-circle shadow"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}
                  title="Chọn ảnh đại diện mới"
                >
                  <Camera size={18} className="text-dark" />
                </Button>
                <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handleAvatarChange} />
              </div>

              {/* Thông báo nếu đã chọn ảnh mới nhưng chưa bấm lưu */}
              {avatarFile && (
                <div className="mb-2">
                  <span className="badge bg-warning text-dark px-2 py-1" style={{ fontSize: '11px' }}>
                    Ảnh mới (Chưa lưu)
                  </span>
                  <div>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-danger text-decoration-none"
                      style={{ fontSize: '11.5px' }}
                      onClick={() => {
                        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                        setAvatarPreview(null);
                        setAvatarFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      Hủy chọn ảnh
                    </button>
                  </div>
                </div>
              )}

              <h5 className="mb-1 fw-bold text-dark">{user?.full_name}</h5>
              <p className="text-muted mb-0" style={{ fontSize: '13.5px' }}>{user?.email}</p>
            </Card.Body>
          </Card>

          {/* Menu Điều Hướng Sidebar - Nền Cam khi Active */}
          <Card className="border-0 shadow-sm">
            <Nav
              variant="pills"
              className="flex-column p-2 user-sidebar-nav"
              activeKey={activeTab}
              onSelect={handleTabSelect}
            >
              <Nav.Item>
                <Nav.Link
                  eventKey="profile"
                  className={`user-sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
                >
                  <UserIcon size={17} />
                  <span>Hồ sơ cá nhân</span>
                </Nav.Link>
              </Nav.Item>

              <Nav.Item>
                <Nav.Link
                  eventKey="orders"
                  className={`user-sidebar-link ${activeTab === 'orders' ? 'active' : ''}`}
                >
                  <Package size={17} />
                  <span>Đơn hàng của tôi</span>
                </Nav.Link>
              </Nav.Item>

              <Nav.Item>
                <Nav.Link
                  eventKey="wishlist"
                  className={`user-sidebar-link ${activeTab === 'wishlist' ? 'active' : ''}`}
                >
                  <Heart size={17} />
                  <span>Danh sách yêu thích</span>
                </Nav.Link>
              </Nav.Item>

              <Nav.Item>
                <Nav.Link
                  onClick={handleLogout}
                  className="user-sidebar-link nav-link-logout"
                >
                  <LogOut size={17} />
                  <span>Đăng xuất</span>
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card>
        </Col>

        {/* ============================================================
            2. VÙNG NỘI DUNG CHÍNH BÊN PHẢI
            ============================================================ */}
        <Col md={9}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              {/* TAB 1: HỒ SƠ CÁ NHÂN */}
              {activeTab === 'profile' && (
                <div>
                  <h4 className="mb-4" style={{ color: '#ea580c', fontWeight: 700 }}>Thông tin cá nhân</h4>
                  <Form onSubmit={handleSubmitProfile}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold" style={{ fontSize: '13.5px' }}>Họ và tên</Form.Label>
                          <Form.Control type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold" style={{ fontSize: '13.5px' }}>Email</Form.Label>
                          <Form.Control type="email" value={user?.email || ''} disabled style={{ backgroundColor: '#f8fafc' }} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold" style={{ fontSize: '13.5px' }}>Số điện thoại</Form.Label>
                          <Form.Control type="text" name="phone" value={formData.phone} onChange={handleInputChange} required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold" style={{ fontSize: '13.5px' }}>Ngày sinh</Form.Label>
                          <Form.Control type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold" style={{ fontSize: '13.5px' }}>Giới tính</Form.Label>
                          <Form.Select name="gender" value={formData.gender} onChange={handleInputChange}>
                            <option value="">-- Chọn giới tính --</option>
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                            <option value="OTHER">Khác</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold" style={{ fontSize: '13.5px' }}>Số CCCD / Hộ chiếu</Form.Label>
                          <Form.Control
                            type="text"
                            name="id_number"
                            placeholder="Nhập số CCCD hoặc hộ chiếu"
                            value={formData.id_number}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold" style={{ fontSize: '13.5px' }}>Địa chỉ</Form.Label>
                          <Form.Control type="text" name="address" value={formData.address} onChange={handleInputChange} />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="text-end mt-3">
                      <Button
                        type="submit"
                        style={{ backgroundColor: '#ea580c', borderColor: '#ea580c', fontWeight: 600, padding: '9px 24px', borderRadius: '8px' }}
                        disabled={loading}
                      >
                        {loading ? <Spinner size="sm" animation="border" /> : 'Lưu thay đổi'}
                      </Button>
                    </div>
                  </Form>
                </div>
              )}

              {/* TAB 2: ĐƠN HÀNG CỦA TÔI */}
              {activeTab === 'orders' && (
                <UserOrdersList />
              )}

              {/* TAB 3: DANH SÁCH YÊU THÍCH */}
              {activeTab === 'wishlist' && (
                <div>
                  <h4 className="mb-4" style={{ color: '#ea580c', fontWeight: 700 }}>Danh sách yêu thích</h4>
                  <div className="text-center py-5 text-muted bg-light rounded-3">
                    Chưa có tour nào trong danh sách yêu thích
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfilePage;
