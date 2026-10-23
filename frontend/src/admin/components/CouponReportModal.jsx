import { useState, useEffect, useCallback } from 'react';
import { X, TrendingUp, CheckCircle, Clock, AlertTriangle, Layers, DollarSign } from 'lucide-react';
import axiosAdmin from '../config/axiosAdmin';

/**
 * CouponReportModal — Báo cáo & Thống kê Chiến dịch Khuyến mãi (Giai đoạn 5 & 6)
 * Tuân thủ rangbuoc.txt: try-catch, kiểm tra lỗi, < 300 dòng
 */
function CouponReportModal({ onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get('/coupons/admin/report');
      const data = res?.data || res;
      setReport(data);
    } catch (err) {
      alert(err.message || 'Lỗi khi tải báo cáo thống kê');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const summary = report?.summary || {};
  const topCoupons = report?.top_coupons || [];
  const batchStats = report?.batch_stats || [];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        
        {/* Header Modal */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="#ea580c" /> Báo Cáo Hiệu Quả Chiến Dịch Coupon
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0 0' }}>
              Số liệu tổng hợp lượt dùng, doanh thu giảm và tỷ lệ chuyển đổi
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Nội dung báo cáo */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải báo cáo số liệu...</div>
          ) : (
            <>
              {/* Thẻ KPI Thống kê */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <div style={{ background: '#fff', border: '1px solid #fed7aa', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ea580c', fontSize: '12px', fontWeight: 700 }}>
                    <DollarSign size={16} /> TỔNG TIỀN ĐÃ GIẢM
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#ea580c', marginTop: '6px' }}>
                    {(summary.total_discount_amount || 0).toLocaleString('vi-VN')} đ
                  </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontSize: '12px', fontWeight: 700 }}>
                    <CheckCircle size={16} /> ĐÃ SỬ DỤNG
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#15803d', marginTop: '6px' }}>
                    {summary.total_used_count || 0} lượt
                  </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #fef08a', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ca8a04', fontSize: '12px', fontWeight: 700 }}>
                    <Clock size={16} /> ĐANG GIỮ CHỖ
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#a16207', marginTop: '6px' }}>
                    {summary.total_reserved_count || 0} lượt
                  </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '12px', fontWeight: 700 }}>
                    <Layers size={16} /> TỔNG MÃ PHÁT HÀNH
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                    {summary.total_coupons || 0} ({summary.active_coupons || 0} đang bật)
                  </div>
                </div>
              </div>

              {/* Bảng Top 5 Mã Hiệu Quả */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                  🔥 Top 5 Mã Giảm Giá Được Dùng Nhiều Nhất
                </h4>
                {topCoupons.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '13px' }}>Chưa có lượt sử dụng nào.</p>
                ) : (
                  <table className="table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Mã Coupon</th>
                        <th>% Giảm</th>
                        <th>Đã Dùng</th>
                        <th>Hạn mức</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCoupons.map((c) => (
                        <tr key={c._id}>
                          <td>
                            <strong style={{ fontFamily: 'monospace', color: '#2563eb' }}>{c.code}</strong>
                          </td>
                          <td style={{ color: '#16a34a', fontWeight: 700 }}>{c.discount_percent}%</td>
                          <td><strong style={{ color: '#ea580c' }}>{c.used_count}</strong> lượt</td>
                          <td>{c.usage_limit ? `${c.usage_limit} lượt` : 'Không giới hạn'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Bảng Thống kê Theo Lô Phát Hành (Batch) */}
              {batchStats.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                    📦 Thống Kê Theo Lô Phát Hành (Batch Coupons)
                  </h4>
                  <table className="table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Mã Lô</th>
                        <th>Số lượng phát hành</th>
                        <th>Số lượt đã dùng</th>
                        <th>Mức giảm</th>
                        <th>Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchStats.map((b) => (
                        <tr key={b._id}>
                          <td>
                            <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '3px 6px', borderRadius: '4px' }}>
                              {b._id}
                            </span>
                          </td>
                          <td><strong>{b.issued_count}</strong> mã</td>
                          <td><strong style={{ color: '#ea580c' }}>{b.used_count}</strong> lượt</td>
                          <td>{b.discount_percent}%</td>
                          <td>{b.created_at ? new Date(b.created_at).toLocaleDateString('vi-VN') : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default CouponReportModal;
