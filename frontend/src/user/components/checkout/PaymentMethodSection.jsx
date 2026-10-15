/**
 * PaymentMethodSection - Khối chọn phương thức thanh toán
 * Hỗ trợ: Thanh toán khi đi tour (CASH), MoMo (MOMO), Chuyển khoản (BANK_TRANSFER)
 */
const PaymentMethodSection = ({ paymentMethod, onChange }) => {
  return (
    <div className="checkout-card">
      <h2 className="checkout-card-title">3. Chọn Phương Thức Thanh Toán</h2>

      {/* Lựa chọn 1: Thanh toán khi đi tour */}
      <div
        className={`payment-method-card ${paymentMethod === 'CASH' ? 'selected' : ''}`}
        onClick={() => onChange('CASH')}
      >
        <input
          type="radio"
          name="payment_method"
          className="payment-method-radio"
          checked={paymentMethod === 'CASH'}
          onChange={() => onChange('CASH')}
        />
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
            Thanh toán khi đi tour (Tiền mặt)
            <span className="payment-method-badge">Phổ biến</span>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Quý khách thanh toán trực tiếp cho nhân viên hoặc hướng dẫn viên khi bắt đầu khởi hành.
          </div>
        </div>
      </div>

      {/* Lựa chọn 2: MoMo */}
      <div
        className={`payment-method-card ${paymentMethod === 'MOMO' ? 'selected' : ''}`}
        onClick={() => onChange('MOMO')}
      >
        <input
          type="radio"
          name="payment_method"
          className="payment-method-radio"
          checked={paymentMethod === 'MOMO'}
          onChange={() => onChange('MOMO')}
        />
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
            Ví điện tử MoMo
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Quét mã QR thanh toán tức thì và nhận xác nhận đơn ngay.
          </div>
        </div>
      </div>

      {/* Lựa chọn 3: Chuyển khoản */}
      <div
        className={`payment-method-card ${paymentMethod === 'BANK_TRANSFER' ? 'selected' : ''}`}
        onClick={() => onChange('BANK_TRANSFER')}
      >
        <input
          type="radio"
          name="payment_method"
          className="payment-method-radio"
          checked={paymentMethod === 'BANK_TRANSFER'}
          onChange={() => onChange('BANK_TRANSFER')}
        />
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
            Chuyển khoản ngân hàng (Internet Banking)
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Chuyển khoản qua số tài khoản công ty với cú pháp là Mã đơn hàng.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSection;
