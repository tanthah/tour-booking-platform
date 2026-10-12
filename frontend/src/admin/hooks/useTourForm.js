import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosAdmin from '../config/axiosAdmin';

/**
 * Custom Hook quản lý state và logic của form Tour
 * Tách riêng logic ra khỏi component để giữ file không quá 300 dòng
 * @param {string|undefined} tourId - ID Tour khi ở chế độ cập nhật
 */
const useTourForm = (tourId) => {
  const navigate = useNavigate();
  const isEdit = Boolean(tourId);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Hàm chuẩn hóa trạng thái về ACTIVE / INACTIVE cho form
  const normalizeTourStatus = (st) => {
    if (!st || st === 'ACTIVE' || st === 'PUBLISHED') return 'ACTIVE';
    return 'INACTIVE';
  };

  // Khởi tạo dữ liệu form mặc định
  const [formData, setFormData] = useState({
    title: '', code: '', category: '', status: 'ACTIVE',
    departure_location: '', destination_location: '', duration: '',
    vehicle: '', departure_date: '', main_image: '', gallery: [],
    description: '', content_html: '',
    price: 0, original_price: 0,
    price_adult: 0, price_child: 0, price_baby: 0,
    original_price_adult: 0, original_price_child: 0, original_price_baby: 0,
    total_slots: 1, remaining_slots: 1,
    max_adults: 0, max_children: 0, max_babies: 0,
    itinerary: [],
    region: 'MIEN_BAC',
  });

  // Danh sách điểm khởi hành có sẵn
  const departureOptions = ['Hà Nội', 'Đà Nẵng', 'Nha Trang', 'Hồ Chí Minh'];

  // Lấy danh sách danh mục hoạt động từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosAdmin.get('/categories/active');
        if (res?.success) setCategories(res.data || []);
      } catch (err) {
        console.error('Lỗi khi tải danh mục:', err);
      }
    };
    fetchCategories();
  }, []);

  // Khi sửa: tải dữ liệu Tour hiện tại từ API
  useEffect(() => {
    if (!isEdit) return;
    const fetchTour = async () => {
      try {
        setLoading(true);
        const res = await axiosAdmin.get(`/tours/${tourId}`);
        if (res?.success && res.data) {
          const t = res.data;
          setFormData({
            title: t.title || '', code: t.code || '',
            category: t.category?._id || t.category || '',
            status: normalizeTourStatus(t.status),
            departure_location: t.departure_location || '',
            destination_location: t.destination_location || '',
            duration: t.duration || '', vehicle: t.vehicle || '',
            departure_date: t.departure_date ? t.departure_date.substring(0, 10) : '',
            main_image: t.main_image || '', gallery: t.gallery || [],
            description: t.description || '', content_html: t.content_html || '',
            price: t.price || 0, original_price: t.original_price || 0,
            price_adult: t.price_adult || 0, price_child: t.price_child || 0,
            price_baby: t.price_baby || 0,
            original_price_adult: t.original_price_adult || 0,
            original_price_child: t.original_price_child || 0,
            original_price_baby: t.original_price_baby || 0,
            total_slots: t.total_slots || 1, remaining_slots: t.remaining_slots || 1,
            max_adults: t.max_adults || 0, max_children: t.max_children || 0,
            max_babies: t.max_babies || 0,
            itinerary: t.itinerary || [],
            region: t.region || 'MIEN_BAC',
          });
        }
      } catch (err) {
        alert(err.message || 'Không thể tải thông tin Tour');
        navigate('/admin/tours');
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [tourId, isEdit, navigate]);

  // Cập nhật giá trị trường form
  const handleChange = useCallback((e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  }, []);

  // Cập nhật trực tiếp một trường bất kỳ
  const setField = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Gửi dữ liệu form lên API
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.code.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }
    try {
      setSubmitting(true);
      const payload = { ...formData, price: Number(formData.price) };
      if (isEdit) {
        await axiosAdmin.put(`/tours/${tourId}`, payload);
        alert('Cập nhật Tour thành công');
      } else {
        await axiosAdmin.post('/tours', payload);
        alert('Tạo Tour thành công');
      }
      navigate('/admin/tours');
    } catch (err) {
      alert(err.message || 'Có lỗi xảy ra khi lưu Tour');
    } finally {
      setSubmitting(false);
    }
  }, [formData, isEdit, tourId, navigate]);

  return {
    formData, categories, loading, submitting, isEdit, departureOptions,
    handleChange, setField, handleSubmit, navigate,
  };
};

export default useTourForm;

