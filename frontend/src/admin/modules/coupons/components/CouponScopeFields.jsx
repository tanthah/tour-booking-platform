import React from 'react';

/**
 * CouponScopeFields — Cấu hình phạm vi áp dụng và đối tượng khách hàng (Admin)
 * Tách riêng để giữ CouponForm.jsx 
 */
const CouponScopeFields = ({ formData, setFormData, isEdit }) => {
  const handleScopeChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (category) => {
    setFormData((prev) => {
      const current = prev.applicable_categories || [];
      const updated = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];
      return { ...prev, applicable_categories: updated };
    });
  };

  const handleSeasonToggle = (season) => {
    setFormData((prev) => {
      const current = prev.applicable_seasons || [];
      const updated = current.includes(season)
        ? current.filter((s) => s !== season)
        : [...current, season];
      return { ...prev, applicable_seasons: updated };
    });
  };

  return (
    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '14px' }}>
        🎯 Đối Tượng & Phạm Vi Áp Dụng
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        {/* Đối tượng khách hàng */}
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '13px' }}>
            Đối tượng khách hàng
          </label>
          <select
            name="user_target"
            value={formData.user_target || 'ALL'}
            onChange={handleScopeChange}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
          >
            <option value="ALL">Tất cả khách hàng</option>
            <option value="NEW_USER">🎁 Chào mừng khách mới (Chưa có đơn)</option>
          </select>
        </div>

        {/* Phạm vi tour áp dụng */}
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '13px' }}>
            Phạm vi tour áp dụng
          </label>
          <select
            name="applies_to"
            value={formData.applies_to || 'ALL'}
            onChange={handleScopeChange}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
          >
            <option value="ALL">Áp dụng cho tất cả các Tour</option>
            <option value="CATEGORY">Theo danh mục (Trong nước / Nước ngoài)</option>
            <option value="SEASON">Theo mùa du lịch (Xuân / Hạ / Thu / Đông)</option>
          </select>
        </div>
      </div>

      {/* Tùy chọn chi tiết theo danh mục */}
      {formData.applies_to === 'CATEGORY' && (
        <div style={{ marginBottom: '14px', background: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '13px' }}>
            Chọn danh mục áp dụng:
          </label>
          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13.5px' }}>
              <input
                type="checkbox"
                checked={(formData.applicable_categories || []).includes('DOMESTIC')}
                onChange={() => handleCategoryToggle('DOMESTIC')}
              />
              🇻🇳 Tour Trong Nước
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13.5px' }}>
              <input
                type="checkbox"
                checked={(formData.applicable_categories || []).includes('INTERNATIONAL')}
                onChange={() => handleCategoryToggle('INTERNATIONAL')}
              />
              ✈️ Tour Nước Ngoài
            </label>
          </div>
        </div>
      )}

      {/* Tùy chọn chi tiết theo mùa */}
      {formData.applies_to === 'SEASON' && (
        <div style={{ marginBottom: '14px', background: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '13px' }}>
            Chọn mùa du lịch áp dụng:
          </label>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { id: 'SPRING', label: '🌸 Mùa Xuân (T3-T5)' },
              { id: 'SUMMER', label: '☀️ Mùa Hè (T6-T8)' },
              { id: 'AUTUMN', label: '🍁 Mùa Thu (T9-T11)' },
              { id: 'WINTER', label: '❄️ Mùa Đông (T12-T2)' },
            ].map((season) => (
              <label key={season.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13.5px' }}>
                <input
                  type="checkbox"
                  checked={(formData.applicable_seasons || []).includes(season.id)}
                  onChange={() => handleSeasonToggle(season.id)}
                />
                {season.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Cấu hình phát hành theo lô (Batch Generation) khi tạo mới */}
      {!isEdit && (
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={Boolean(formData.is_batch)}
              onChange={(e) => setFormData((prev) => ({ ...prev, is_batch: e.target.checked }))}
            />
            Phát hành số lượng mã riêng biệt theo lô (Batch Coupon)
          </label>

          {formData.is_batch && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Tiền tố mã (Prefix)
                </label>
                <input
                  type="text"
                  name="prefix"
                  value={formData.prefix || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, prefix: e.target.value.toUpperCase().trim() }))}
                  placeholder="VD: HE2026, VIP..."
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Số lượng mã cần sinh
                </label>
                <input
                  type="number"
                  name="count"
                  min="1"
                  max="200"
                  value={formData.count || 10}
                  onChange={(e) => setFormData((prev) => ({ ...prev, count: Math.max(1, Number(e.target.value)) }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CouponScopeFields;
