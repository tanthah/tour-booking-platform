import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';
import CouponScopeFields from '../components/CouponScopeFields';

const API_URL = '/coupons/admin';

function CouponForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_percent: 10,
    max_discount_amount: '',
    min_order_amount: '',
    usage_limit: '',
    per_user_limit: 1,
    start_at: new Date().toISOString().slice(0, 16),
    end_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    status: 'ACTIVE',
    user_target: 'ALL',
    applies_to: 'ALL',
    applicable_categories: [],
    applicable_seasons: [],
    is_batch: false,
    prefix: '',
    count: 10,
  });

  useEffect(() => {
    if (!isEdit) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await axiosAdmin.get(`${API_URL}/${id}`);
        const c = res?.data || res;
        setFormData({
          code: c.code || '',
          description: c.description || '',
          discount_percent: c.discount_percent || 10,
          max_discount_amount: c.max_discount_amount ?? '',
          min_order_amount: c.min_order_amount ?? '',
          usage_limit: c.usage_limit ?? '',
          per_user_limit: c.per_user_limit || 1,
          start_at: c.start_at ? new Date(c.start_at).toISOString().slice(0, 16) : '',
          end_at: c.end_at ? new Date(c.end_at).toISOString().slice(0, 16) : '',
          status: c.status || 'ACTIVE',
          user_target: c.user_target || 'ALL',
          applies_to: c.applies_to || 'ALL',
          applicable_categories: c.applicable_categories || [],
          applicable_seasons: c.applicable_seasons || [],
          is_batch: false,
          prefix: '',
          count: 10,
        });
      } catch (err) {
        alert(err.message || 'Không thể tải thông tin coupon');
        navigate('/admin/coupons');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase().trim() : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.end_at) <= new Date(formData.start_at)) {
      alert('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }

    const payload = {
      ...formData,
      discount_percent: Number(formData.discount_percent),
      per_user_limit: Number(formData.per_user_limit) || 1,
      max_discount_amount: formData.max_discount_amount === '' ? null : Number(formData.max_discount_amount),
      min_order_amount: formData.min_order_amount === '' ? null : Number(formData.min_order_amount),
      usage_limit: formData.usage_limit === '' ? null : Number(formData.usage_limit),
    };

    try {
      setSubmitting(true);
      if (isEdit) {
        await axiosAdmin.patch(`${API_URL}/${id}`, payload);
        alert('Cập nhật mã giảm giá thành công!');
      } else if (formData.is_batch) {
        const batchRes = await axiosAdmin.post(`${API_URL}/batch`, {
          prefix: formData.prefix || 'VOUCHER',
          count: Number(formData.count) || 10,
          ...payload,
        });
        const totalGen = batchRes?.data?.total_generated || formData.count;
        alert(`Phát hành thành công lô ${totalGen} mã giảm giá!`);
      } else {
        await axiosAdmin.post(API_URL, payload);
        alert('Tạo mã giảm giá mới thành công!');
      }
      navigate('/admin/coupons');
    } catch (err) {
      alert(err.message || 'Đã có lỗi xảy ra khi lưu coupon');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Đang tải dữ liệu...</div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/coupons')}>
            <ArrowLeft size={18} />
          </button>
          <h1 className="page-title">{isEdit ? `Sửa Coupon: ${formData.code}` : 'Thêm Coupon Mới'}</h1>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '820px', margin: '0 auto', padding: '24px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {!formData.is_batch && (
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                  Mã Coupon <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required={!formData.is_batch}
                  disabled={isEdit}
                  placeholder="VD: HE2026, WELCOME10..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 700, textTransform: 'uppercase' }}
                />
                <small style={{ color: '#64748b' }}>Chữ hoa, số, gạch ngang hoặc dưới</small>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                Phần trăm giảm (%) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                name="discount_percent"
                min="1"
                max="100"
                value={formData.discount_percent}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Giảm tối đa (VNĐ)</label>
              <input
                type="number"
                name="max_discount_amount"
                min="0"
                value={formData.max_discount_amount}
                onChange={handleChange}
                placeholder="Để trống = Không giới hạn"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Đơn tối thiểu (VNĐ)</label>
              <input
                type="number"
                name="min_order_amount"
                min="0"
                value={formData.min_order_amount}
                onChange={handleChange}
                placeholder="Để trống = Không yêu cầu"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Tổng lượt sử dụng tối đa</label>
              <input
                type="number"
                name="usage_limit"
                min="1"
                value={formData.usage_limit}
                onChange={handleChange}
                placeholder="Để trống = Không giới hạn"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Giới hạn mỗi khách hàng</label>
              <input
                type="number"
                name="per_user_limit"
                min="1"
                value={formData.per_user_limit}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                Bắt đầu áp dụng <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="datetime-local"
                name="start_at"
                value={formData.start_at}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                Hết hạn áp dụng <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="datetime-local"
                name="end_at"
                value={formData.end_at}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
          </div>

          {/* Cấu hình đối tượng & phạm vi áp dụng */}
          <CouponScopeFields formData={formData} setFormData={setFormData} isEdit={isEdit} />

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Mô tả chương trình ưu đãi</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="VD: Ưu đãi chào mừng mùa hè 2026..."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Trạng thái</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{ width: '100%', maxWidth: '300px', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            >
              <option value="ACTIVE">Kích hoạt (ACTIVE)</option>
              <option value="INACTIVE">Tạm dừng (INACTIVE)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={18} />
              <span>{submitting ? 'Đang lưu...' : formData.is_batch ? 'Phát Hành Theo Lô' : 'Lưu Coupon'}</span>
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/coupons')}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CouponForm;
