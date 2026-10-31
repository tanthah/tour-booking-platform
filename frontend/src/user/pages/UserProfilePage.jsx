import { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Nav, Card, Form, Button, Spinner, ToastContainer, Toast } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../config/axiosClient';
import UserOrdersList from '../modules/order/components/UserOrdersList';

const UserProfilePage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
    address: user?.address || '',
    gender: user?.gender || '',
    id_number: user?.id_number || '',
  });

  useEffect(() => {
    const fetchFreshProfile = async () => {
      try {
        const res = await axiosClient.get('/auth/me');
        if (res?.data) {
          const freshUser = res.data;
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
  
  const fileInputRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('cartUpdated'));
    navigate('/');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('avatar', file);

    try {
      setLoading(true);
      const res = await axiosClient.patch('/auth/me', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const updatedUser = res.data.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setToast({ show: true, message: 'Cập nhật ảnh đại diện thành công', variant: 'success' });
    } catch (error) {
      setToast({ show: true, message: error?.response?.data?.message || 'Lỗi khi cập nhật ảnh', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axiosClient.patch('/auth/me', formData);
      const updatedUser = res.data.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setToast({ show: true, message: 'Cập nhật thông tin thành công', variant: 'success' });
    } catch (error) {
      setToast({ show: true, message: error?.response?.data?.message || 'Lỗi khi cập nhật thông tin', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <ToastContainer position="top-end" className="p-3">
        <Toast bg={toast.variant} show={toast.show} delay={3000} autohide onClose={() => setToast({ ...toast, show: false })}>
          <Toast.Body className={toast.variant === 'success' ? 'text-white' : ''}>{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      <Row>
        {/* Sidebar */}
        <Col md={3}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="text-center">
              <div className="position-relative d-inline-block mb-3">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="rounded-circle" style={{ width: '120px', height: '120px', objectFit: 'cover', border: '3px solid #ea580c' }} />
                ) : (
                  <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: '120px', height: '120px', backgroundColor: '#ea580c', fontSize: '48px', fontWeight: 'bold', margin: '0 auto' }}>
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <Button 
                  variant="light" 
                  size="sm" 
                  className="position-absolute bottom-0 end-0 rounded-circle shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </Button>
                <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handleAvatarChange} />
              </div>
              <h5 className="mb-1">{user?.full_name}</h5>
              <p className="text-muted mb-0">{user?.email}</p>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Nav variant="pills" className="flex-column p-2" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
              <Nav.Item>
                <Nav.Link eventKey="profile" className="text-dark" style={{ cursor: 'pointer', borderRadius: '8px', marginBottom: '4px' }}>Hồ sơ cá nhân</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="orders" className="text-dark" style={{ cursor: 'pointer', borderRadius: '8px', marginBottom: '4px' }}>Đơn hàng của tôi</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="wishlist" className="text-dark" style={{ cursor: 'pointer', borderRadius: '8px', marginBottom: '4px' }}>Danh sách yêu thích</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link className="text-danger" onClick={handleLogout} style={{ cursor: 'pointer', borderRadius: '8px' }}>Đăng xuất</Nav.Link>
              </Nav.Item>
            </Nav>
          </Card>
        </Col>

        {/* Content */}
        <Col md={9}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              {activeTab === 'profile' && (
                <div>
                  <h4 className="mb-4" style={{ color: '#ea580c', fontWeight: 600 }}>Thông tin cá nhân</h4>
                  <Form onSubmit={handleSubmitProfile}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Họ và tên</Form.Label>
                          <Form.Control type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Email</Form.Label>
                          <Form.Control type="email" value={user?.email || ''} disabled />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Số điện thoại</Form.Label>
                          <Form.Control type="text" name="phone" value={formData.phone} onChange={handleInputChange} required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Ngày sinh</Form.Label>
                          <Form.Control type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Giới tính</Form.Label>
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
                          <Form.Label className="fw-semibold">Số CCCD / Hộ chiếu</Form.Label>
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
                          <Form.Label className="fw-semibold">Địa chỉ</Form.Label>
                          <Form.Control type="text" name="address" value={formData.address} onChange={handleInputChange} />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="text-end mt-3">
                      <Button type="submit" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c', fontWeight: 500 }} disabled={loading}>
                        {loading ? <Spinner size="sm" animation="border" /> : 'Lưu thay đổi'}
                      </Button>
                    </div>
                  </Form>
                </div>
              )}
              {activeTab === 'orders' && (
                <UserOrdersList />
              )}
              {activeTab === 'wishlist' && (
                <div>
                  <h4 className="mb-4" style={{ color: '#ea580c', fontWeight: 600 }}>Danh sách yêu thích</h4>
                  <div className="text-center py-5 text-muted bg-light rounded">
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
