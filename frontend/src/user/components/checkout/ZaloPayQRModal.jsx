import { useState, useEffect, useRef } from 'react';
import { Modal, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { getPaymentStatus } from '../../modules/payment/paymentService';

const formatSeconds = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const ZaloPayQRModal = ({
  show,
  onHide,
  paymentData, // { payment, order_url, expires_at }
  onPaymentSuccess,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(15 * 60);
  const [status, setStatus] = useState('pending'); // 'pending' | 'success' | 'expired'
  const pollTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const paymentId = paymentData?.payment?._id || paymentData?._id;
  const orderUrl = paymentData?.order_url || paymentData?.payment?.order_url;
  const amount = paymentData?.payment?.amount || 0;
  const paymentType = paymentData?.payment?.payment_type;

  // Khởi tạo thời gian đếm ngược
  useEffect(() => {
    if (!show || !paymentData) return;

    setStatus('pending');

    const expireTime = paymentData.expires_at ? new Date(paymentData.expires_at).getTime() : Date.now() + 15 * 60 * 1000;
    const initialSeconds = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
    setRemainingSeconds(initialSeconds);

    // Countdown interval (mỗi giây)
    countdownTimerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Polling interval kiểm tra trạng thái thanh toán (mỗi 3 giây)
    pollTimerRef.current = setInterval(async () => {
      if (!paymentId) return;
      try {
        const result = await getPaymentStatus(paymentId);
        if (result?.status === 'success') {
          clearInterval(pollTimerRef.current);
          clearInterval(countdownTimerRef.current);
          setStatus('success');
          setTimeout(() => {
            if (onPaymentSuccess) onPaymentSuccess(result);
          }, 2000);
        } else if (result?.status === 'expired') {
          clearInterval(pollTimerRef.current);
          clearInterval(countdownTimerRef.current);
          setStatus('expired');
        }
      } catch {
        // Tiếp tục polling
      }
    }, 3000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [show, paymentId, paymentData, onPaymentSuccess]);

  // Sinh QR Code Image từ URL ZaloPay (sử dụng QuickChart API hoặc API sinh QR chuẩn)
  const qrImageSrc = orderUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(orderUrl)}`
    : null;

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2" style={{ fontSize: '1.15rem' }}>
          <span style={{ color: '#0068ff', fontWeight: 700 }}>ZaloPay</span>
          <span>Thanh toán đơn hàng</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="text-center py-4">
        {status === 'success' && (
          <div className="py-3">
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '16px',
              }}
            >
              ✓
            </div>
            <h5 className="text-success fw-bold">Thanh toán thành công!</h5>
            <p className="text-muted mb-0">Hệ thống đang chuyển hướng tới chi tiết đơn hàng...</p>
          </div>
        )}

        {status === 'expired' && (
          <div className="py-3">
            <Alert variant="warning" className="text-start">
              <Alert.Heading style={{ fontSize: '1rem', fontWeight: 700 }}>Mã QR đã hết hạn (15 phút)</Alert.Heading>
              <p className="mb-0" style={{ fontSize: '0.9rem' }}>
                Thời gian giữ chỗ tạm thời đã kết thúc. Vui lòng đóng cửa sổ này và tạo lượt thanh toán mới để hoàn tất đơn hàng.
              </p>
            </Alert>
            <Button variant="secondary" onClick={onHide} className="mt-2">
              Đóng và thử lại
            </Button>
          </div>
        )}

        {status === 'pending' && (
          <div>
            <div className="mb-3">
              <Badge bg="primary" className="px-3 py-2" style={{ fontSize: '0.9rem' }}>
                {paymentType === 'deposit' ? 'Đặt cọc 30%' : 'Thanh toán'} : {amount.toLocaleString('vi-VN')} đ
              </Badge>
            </div>

            <div
              className="p-3 bg-light rounded d-inline-block border mb-3 shadow-sm"
              style={{ minHeight: '260px' }}
            >
              {qrImageSrc ? (
                <img
                  src={qrImageSrc}
                  alt="ZaloPay QR Code"
                  style={{ width: '220px', height: '220px', display: 'block' }}
                />
              ) : (
                <div style={{ width: '220px', height: '220px' }} className="d-flex align-items-center justify-content-center">
                  <Spinner animation="border" variant="primary" />
                </div>
              )}
            </div>

            <div className="mb-3">
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Mã QR sẽ hết hạn sau:</div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: remainingSeconds < 180 ? '#dc2626' : '#2563eb',
                  fontFamily: 'monospace',
                }}
              >
                {formatSeconds(remainingSeconds)}
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#475569' }} className="mb-3">
              Mở ứng dụng <strong>ZaloPay</strong> hoặc ứng dụng <strong>Ngân hàng</strong> bất kỳ để quét mã thanh toán.
            </p>

            <div className="d-flex justify-content-center gap-2">
              {orderUrl && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  href={orderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mở cổng ZaloPay trực tiếp ↗
                </Button>
              )}
              <Button variant="outline-secondary" size="sm" onClick={onHide}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ZaloPayQRModal;
