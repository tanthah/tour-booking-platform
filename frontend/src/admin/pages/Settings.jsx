import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';
import ImageUploader from '../components/ImageUploader';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';

const API_URL = '/settings';

/**
 * Settings Component - Quản lý cài đặt chung (Header, Footer, Logo, Contact)
 */
function Settings() {
  const [formData, setFormData] = useState({
    logo_url: '',
    phone: '',
    email: '',
    address: '',
    facebook_url: '',
    instagram_url: '',
    youtube_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const res = await axiosAdmin.get(`${API_URL}/public`);
      if (res.data) {
        setFormData({
          logo_url: res.data.logo_url || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          address: res.data.address || '',
          facebook_url: res.data.facebook_url || '',
          instagram_url: res.data.instagram_url || '',
          youtube_url: res.data.youtube_url || '',
        });
      }
    } catch (error) {
      console.error('Lỗi tải cài đặt:', error);
      alert('Không thể tải dữ liệu cài đặt');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (url) => {
    setFormData((prev) => ({ ...prev, logo_url: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axiosAdmin.put(API_URL, formData);
      alert('Cập nhật cài đặt thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật cài đặt:', error);
      alert('Cập nhật thất bại. Vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <p>Đang tải dữ liệu cài đặt...</p>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h2>Quản lý cài đặt chung</h2>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={4}>
            <Card className="mb-4">
              <Card.Header>Logo Website</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Logo</Form.Label>
                  <ImageUploader 
                    value={formData.logo_url} 
                    onChange={handleImageUpload} 
                  />
                  <Form.Text className="text-muted">
                    Sử dụng ảnh hình vuông hoặc tỷ lệ ngang ngắn.
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          <Col md={8}>
            <Card className="mb-4">
              <Card.Header>Thông tin liên hệ (Header & Footer)</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="VD: 0987654321" 
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="VD: contact@tourbooking.com" 
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Địa chỉ</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    placeholder="Địa chỉ văn phòng" 
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Header>Mạng xã hội (Footer)</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Link Facebook</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="facebook_url" 
                    value={formData.facebook_url} 
                    onChange={handleChange} 
                    placeholder="https://facebook.com/..." 
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Link Instagram</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="instagram_url" 
                    value={formData.instagram_url} 
                    onChange={handleChange} 
                    placeholder="https://instagram.com/..." 
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Link YouTube</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="youtube_url" 
                    value={formData.youtube_url} 
                    onChange={handleChange} 
                    placeholder="https://youtube.com/..." 
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            <div className="d-flex justify-content-end mb-4">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Đang lưu...' : <><Save size={16} className="me-2" /> Lưu Thay Đổi</>}
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

export default Settings;
