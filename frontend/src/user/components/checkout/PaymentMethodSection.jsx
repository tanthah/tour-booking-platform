/**
 * PaymentMethodSection — Chọn mức thanh toán & phương thức thanh toán
 * Mức thanh toán: Đặt cọc 50% trước hoặc Thanh toán toàn bộ 100%
 * Phương thức: Tại quầy, QR đa năng, Thẻ nội địa, Thẻ quốc tế, Ví MoMo
 */

const PAYMENT_METHODS = [
  {
    id: 'COUNTER',
    label: 'Thanh toán tại quầy',
    desc: 'Quý khách thanh toán trực tiếp tại văn phòng công ty trước ngày khởi hành.',
    badge: 'Phổ biến',
  },
  {
    id: 'QR_CODE',
    label: 'QR đa năng',
    desc: 'Quét mã QR thanh toán bằng bất kỳ ứng dụng ngân hàng nào đang dùng.',
  },
  {
    id: 'DOMESTIC_CARD',
    label: 'Thẻ nội địa (ATM / Internet Banking)',
    desc: 'Thanh toán an toàn qua thẻ ATM hoặc tài khoản ngân hàng nội địa.',
  },
  {
    id: 'INTERNATIONAL_CARD',
    label: 'Thẻ quốc tế (VISA / Mastercard)',
    desc: 'Thanh toán bằng thẻ tín dụng quốc tế, bảo mật qua cổng 3D Secure.',
  },
  {
    id: 'MOMO',
    label: 'Ví điện tử MoMo',
    desc: 'Quét mã QR MoMo để thanh toán tức thì và nhận xác nhận đơn ngay.',
  },
];

const PaymentMethodSection = ({
  paymentType,
  onPaymentTypeChange,
  paymentMethod,
  onChange,
  totalAmount,
  depositEligibility = { allowed: true, daysRemaining: null, reason: '' },
}) => {
  const isDepositAllowed = depositEligibility?.allowed !== false;
  const depositAmount = Math.ceil((totalAmount || 0) * 0.5);
  const remainingAmount = (totalAmount || 0) - depositAmount;

  return (
    <>
      {/* ===== Section 3: Mức Thanh Toán ===== */}
      <div className="checkout-card">
        <h2 className="checkout-card-title">
          <span className="checkout-card-step-num">3</span>
          Chọn Mức Thanh Toán
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '-10px', marginBottom: '18px' }}>
          Chọn hình thức thanh toán phù hợp với nhu cầu của bạn.
        </p>

        {/* Cọc trước 50% */}
        <div
          className={`payment-level-card${paymentType === 'DEPOSIT' ? ' selected' : ''}${!isDepositAllowed ? ' disabled' : ''}`}
          onClick={() => isDepositAllowed && onPaymentTypeChange('DEPOSIT')}
          role="button"
          tabIndex={isDepositAllowed ? 0 : -1}
          onKeyDown={(e) => isDepositAllowed && e.key === 'Enter' && onPaymentTypeChange('DEPOSIT')}
          style={!isDepositAllowed ? { opacity: 0.7, cursor: 'not-allowed', background: '#f8fafc' } : {}}
        >
          <input
            type="radio"
            name="payment_type"
            className="payment-method-radio"
            checked={paymentType === 'DEPOSIT'}
            onChange={() => isDepositAllowed && onPaymentTypeChange('DEPOSIT')}
            disabled={!isDepositAllowed}
          />
          <div className="payment-level-content">
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b', marginBottom: '5px' }}>
              Đặt cọc trước 50%
              {!isDepositAllowed ? (
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#fee2e2', color: '#dc2626', marginLeft: '8px' }}>
                  Không áp dụng
                </span>
              ) : depositEligibility?.daysRemaining !== null ? (
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569', marginLeft: '8px' }}>
                  Khởi hành sau {depositEligibility.daysRemaining} ngày
                </span>
              ) : null}
            </div>
            <div className="payment-level-amount-line">
              Thanh toán ngay:&nbsp;
              <strong style={{ color: !isDepositAllowed ? '#94a3b8' : '#ea580c', fontSize: '16px' }}>
                {depositAmount.toLocaleString('vi-VN')} đ
              </strong>
            </div>
            <div className="payment-level-note">
              Còn lại {remainingAmount.toLocaleString('vi-VN')} đ — thanh toán trước ngày khởi hành
            </div>

            {!isDepositAllowed && (
              <div style={{ marginTop: '10px', padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12.5px', color: '#b91c1c', lineHeight: 1.5 }}>
                ⚠️ <strong>Lưu ý:</strong> {depositEligibility?.reason || 'Tour khởi hành trong vòng 3 ngày tới, vui lòng thanh toán toàn bộ 100% để bộ phận điều hành kịp xuất vé và gửi danh sách bảo hiểm du lịch.'}
              </div>
            )}
          </div>
        </div>

        {/* Thanh toán toàn bộ 100% */}
        <div
          className={`payment-level-card${paymentType === 'FULL' ? ' selected' : ''}`}
          onClick={() => onPaymentTypeChange('FULL')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onPaymentTypeChange('FULL')}
        >
          <input
            type="radio"
            name="payment_type"
            className="payment-method-radio"
            checked={paymentType === 'FULL'}
            onChange={() => onPaymentTypeChange('FULL')}
          />
          <div className="payment-level-content">
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b', marginBottom: '5px' }}>
              Thanh toán toàn bộ 100%
              <span className="payment-level-badge-confirm">Xác nhận ngay</span>
            </div>
            <div className="payment-level-amount-line">
              Thanh toán ngay:&nbsp;
              <strong style={{ color: '#ea580c', fontSize: '16px' }}>
                {(totalAmount || 0).toLocaleString('vi-VN')} đ
              </strong>
            </div>
            <div className="payment-level-note">
              Đơn hàng được xác nhận ngay sau khi thanh toán thành công.
            </div>
          </div>
        </div>
      </div>

      {/* ===== Section 4: Phương Thức Thanh Toán ===== */}
      <div className="checkout-card">
        <h2 className="checkout-card-title">
          <span className="checkout-card-step-num">4</span>
          Chọn Phương Thức Thanh Toán
        </h2>

        {PAYMENT_METHODS.map((method) => (
          <div
            key={method.id}
            className={`payment-method-card${paymentMethod === method.id ? ' selected' : ''}`}
            onClick={() => onChange(method.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onChange(method.id)}
          >
            <input
              type="radio"
              name="payment_method"
              className="payment-method-radio"
              checked={paymentMethod === method.id}
              onChange={() => onChange(method.id)}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
                {method.label}
                {method.badge && (
                  <span className="payment-method-badge">{method.badge}</span>
                )}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                {method.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default PaymentMethodSection;
