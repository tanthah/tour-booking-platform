import { Container, Row, Col, Form, Spinner, Alert } from 'react-bootstrap';
import PassengerItemForm from '../components/checkout/PassengerItemForm';
import CustomerInfoSection from '../components/checkout/CustomerInfoSection';
import PaymentMethodSection from '../components/checkout/PaymentMethodSection';
import CheckoutSummaryCard from '../components/checkout/CheckoutSummaryCard';
import useCheckout from '../hooks/useCheckout';
import '../assets/styles/checkout.css';

/**
 * CheckoutPage - Trang Đặt Tour & Thanh Toán
 * - Tự động điền ngày sinh, CCCD của người đặt
 * - Duy nhất Khách 1 có thể dùng thông tin người đặt hoặc nhập thông tin mới
 * - Các khách 2, 3, 4,... mặc định nhập thông tin riêng
 * - Tóm tắt tour chứa ô nhập mã giảm giá và hiển thị đầy đủ thông tin
 */
const CheckoutPage = () => {
  const {
    loading,
    submitting,
    errorMsg,
    setErrorMsg,
    selectedCartItems,
    customerInfo,
    customerErrors,
    handleCustomerInfoChange,
    passengers,
    passengerErrors,
    handlePassengerChange,
    useBookerInfo,
    handleToggleBookerInfo,
    paymentMethod,
    setPaymentMethod,
    paymentType,
    setPaymentType,
    depositEligibility,
    subtotal,
    totalAmount,
    couponCode,
    setCouponCode,
    discount,
    appliedCoupon,
    couponMessage,
    couponError,
    handleApplyCoupon,
    handleRecommendCoupon,
    handleRemoveCoupon,
    handleSubmitOrder,
  } = useCheckout();


  if (loading) {
    return (
      <div className="checkout-wrapper d-flex justify-content-center align-items-center">
        <Spinner animation="border" style={{ color: '#ea580c' }} />
      </div>
    );
  }

  return (
    <div className="checkout-wrapper">
      <Container>
        <div className="checkout-steps">
          <div className="checkout-step-item">
            <span className="checkout-step-num">1</span>
            <span>Giỏ hàng</span>
          </div>
          <span style={{ color: '#cbd5e1' }}>&gt;</span>
          <div className="checkout-step-item active">
            <span className="checkout-step-num">2</span>
            <span>Thông tin đặt tour</span>
          </div>
          <span style={{ color: '#cbd5e1' }}>&gt;</span>
          <div className="checkout-step-item">
            <span className="checkout-step-num">3</span>
            <span>Hoàn tất đặt</span>
          </div>
        </div>

        {depositEligibility?.canBook === false && (
          <Alert variant="danger" className="mb-4">
            ⚠️ <strong>Không thể đặt tour:</strong> {depositEligibility.reason}
          </Alert>
        )}

        {errorMsg && (
          <Alert variant="danger" dismissible onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        <Form onSubmit={handleSubmitOrder}>
          <Row className="gy-4">
            <Col lg={8}>
              <CustomerInfoSection
                customerInfo={customerInfo}
                onChange={handleCustomerInfoChange}
                errors={customerErrors}
              />

              <div className="checkout-card">
                <h2 className="checkout-card-title">
                  2. Thông Tin Khách Đi Tour ({passengers.length} khách)
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  Vui lòng cung cấp chính xác thông tin hành khách để làm bảo hiểm du lịch và xác nhận chỗ.
                </p>
                {passengers.map((passenger, idx) => (
                  <PassengerItemForm
                    key={`${passenger.cart_item_id}-${idx}`}
                    index={idx}
                    passenger={passenger}
                    itemTitle={passenger.item_title}
                    useBookerInfo={useBookerInfo}
                    onToggleBookerInfo={handleToggleBookerInfo}
                    onChange={handlePassengerChange}
                    errors={passengerErrors[idx] || {}}
                  />
                ))}
              </div>

              <PaymentMethodSection
                paymentType={paymentType}
                onPaymentTypeChange={setPaymentType}
                paymentMethod={paymentMethod}
                onChange={setPaymentMethod}
                totalAmount={totalAmount}
                depositEligibility={depositEligibility}
              />
            </Col>

            <Col lg={4}>
              <CheckoutSummaryCard
                selectedCartItems={selectedCartItems}
                subtotal={subtotal}
                totalAmount={totalAmount}
                paymentType={paymentType}
                submitting={submitting}
                couponCode={couponCode}
                setCouponCode={setCouponCode}
                discount={discount}
                appliedCoupon={appliedCoupon}
                couponMessage={couponMessage}
                couponError={couponError}
                onApplyCoupon={handleApplyCoupon}
                onRecommendCoupon={handleRecommendCoupon}
                onRemoveCoupon={handleRemoveCoupon}
                canBook={depositEligibility?.canBook !== false}
              />
            </Col>
          </Row>
        </Form>
      </Container>
    </div>
  );
};

export default CheckoutPage;
