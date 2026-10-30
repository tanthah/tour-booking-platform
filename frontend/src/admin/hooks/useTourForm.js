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

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Khởi tạo dữ liệu form mặc định theo API mới
  const [formData, setFormData] = useState({
    title: '', code: '', category: 'DOMESTIC', status: 'ACTIVE',
    region: 'MIEN_BAC', destination_location: '', duration: '',
    original_price: 0, discount_percent: 0,
    main_image: '', gallery: [],
    content_html: '', itinerary: [],
    services_included: [], services_excluded: [], special_conditions: '',
    is_hot: false, is_flash_sale: false,
  });

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
            category: t.category || 'DOMESTIC',
            status: t.status || 'DRAFT',
            region: t.region || 'MIEN_BAC',
            destination_location: t.destination_location || '',
            duration: t.duration || '',
            original_price: t.original_price || 0,
            discount_percent: t.discount_percent || 0,
            main_image: t.main_image || '', gallery: t.gallery || [],
            content_html: t.content_html || '',
            itinerary: t.itinerary || [],
            services_included: t.services_included || [],
            services_excluded: t.services_excluded || [],
            special_conditions: t.special_conditions || '',
            is_hot: t.is_hot || false,
            is_flash_sale: t.is_flash_sale || false,
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value),
    }));
  }, []);

  // Cập nhật trực tiếp một trường bất kỳ
  const setField = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Gửi dữ liệu form lên API
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || (!isEdit && !formData.code.trim())) {
      alert('Vui lòng nhập đầy đủ tên và mã Tour');
      return;
    }
    if (!formData.destination_location.trim()) {
      alert('Vui lòng nhập điểm đến chính của Tour');
      return;
    }
    if (!formData.duration.trim()) {
      alert('Vui lòng nhập thời lượng Tour (VD: 3 Ngày 2 Đêm)');
      return;
    }
    if (!formData.main_image.trim()) {
      alert('Vui lòng tải lên ảnh đại diện cho Tour');
      return;
    }

    try {
      setSubmitting(true);
      const servicesInc = Array.isArray(formData.services_included)
        ? formData.services_included
        : (formData.services_included || '').split('\n').map((s) => s.trim()).filter(Boolean);
      const servicesExc = Array.isArray(formData.services_excluded)
        ? formData.services_excluded
        : (formData.services_excluded || '').split('\n').map((s) => s.trim()).filter(Boolean);

      const payload = {
        ...formData,
        original_price: Number(formData.original_price) || 0,
        discount_percent: Number(formData.discount_percent) || 0,
        services_included: servicesInc,
        services_excluded: servicesExc,
        special_conditions: (formData.special_conditions || '').trim(),
      };

      if (isEdit) {
        delete payload.code; // Mã Tour không cho phép chỉnh sửa
        await axiosAdmin.patch(`/tours/${tourId}`, payload);
        alert('Cập nhật Tour thành công');
      } else {
        const res = await axiosAdmin.post('/tours', payload);
        const newTourId = res?.data?._id;
        alert('Tạo Tour thành công! Tiếp tục thêm các đợt khởi hành cho chuyến đi này.');
        if (newTourId) {
          navigate(`/admin/tours/edit/${newTourId}?tab=departures&autoAdd=true`);
        } else {
          navigate('/admin/tours');
        }
      }
    } catch (err) {
      const errorMsg = Array.isArray(err?.errors) && err.errors.length > 0
        ? err.errors.map((item) => item.message).join('\n')
        : (err?.message || 'Có lỗi xảy ra khi lưu Tour');
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }, [formData, isEdit, tourId, navigate]);

  return {
    formData, loading, submitting, isEdit,
    handleChange, setField, handleSubmit, navigate, tourId
  };
};

export default useTourForm;
