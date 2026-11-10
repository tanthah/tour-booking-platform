const crypto = require('crypto');

/**
 * Tạo MAC cho yêu cầu tạo đơn hàng ZaloPay v2
 * Data format: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
 */
function generateCreateOrderMac(orderData, key1) {
  const data = `${orderData.app_id}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${orderData.embed_data}|${orderData.item}`;
  return crypto.createHmac('sha256', key1).update(data).digest('hex');
}

/**
 * Xác thực MAC callback (IPN) từ ZaloPay Server
 */
function verifyCallbackMac(dataStr, reqMac, key2) {
  try {
    const calculatedMac = crypto.createHmac('sha256', key2).update(dataStr).digest('hex');
    const calcBuf = Buffer.from(calculatedMac, 'hex');
    const reqBuf = Buffer.from(reqMac, 'hex');
    if (calcBuf.length !== reqBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(calcBuf, reqBuf);
  } catch {
    return false;
  }
}

/**
 * Tạo MAC truy vấn trạng thái đơn hàng ZaloPay v2
 * Data format: app_id|app_trans_id|key1
 */
function generateQueryOrderMac(queryData, key1) {
  const data = `${queryData.app_id}|${queryData.app_trans_id}|${key1}`;
  return crypto.createHmac('sha256', key1).update(data).digest('hex');
}

/**
 * Tạo MAC cho yêu cầu hoàn tiền ZaloPay v2
 * Data format: app_id|m_refund_id|zp_trans_id|amount|timestamp
 */
function generateRefundMac(refundData, key1) {
  const data = `${refundData.app_id}|${refundData.m_refund_id}|${refundData.zp_trans_id}|${refundData.amount}|${refundData.timestamp}`;
  return crypto.createHmac('sha256', key1).update(data).digest('hex');
}

module.exports = {
  generateCreateOrderMac,
  verifyCallbackMac,
  generateQueryOrderMac,
  generateRefundMac,
};

