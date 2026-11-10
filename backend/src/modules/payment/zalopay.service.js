const {
  generateCreateOrderMac,
  generateQueryOrderMac,
  generateRefundMac,
} = require('./zalopay.signature');

const getConfig = () => ({
  app_id: process.env.ZALOPAY_APP_ID || '2554',
  key1: process.env.ZALOPAY_KEY1 || 'sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn',
  key2: process.env.ZALOPAY_KEY2 || 'trMrHtvjo6myautxDUiAcYsVtaeQ8nhf',
  createEndpoint: process.env.ZALOPAY_CREATE_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create',
  queryEndpoint: process.env.ZALOPAY_QUERY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/query',
  refundEndpoint: process.env.ZALOPAY_REFUND_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/refund',
  callbackUrl: process.env.ZALOPAY_CALLBACK_URL || 'https://your-public-domain.ngrok-free.app/api/payments/zalopay/callback',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
});

function getYYMMDD() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/**
 * Gọi ZaloPay API v2 tạo giao dịch thanh toán
 */
async function createZaloPayTransaction({ orderId, orderCode, customerId, amount, paymentType }) {
  const config = getConfig();
  const transID = Math.floor(100000 + Math.random() * 900000);
  const app_trans_id = `${getYYMMDD()}_${transID}`;
  const app_time = Date.now();
  const app_user = customerId.toString();

  const embed_data = JSON.stringify({
    redirecturl: `${config.frontendUrl}/don-hang/${orderId}`,
    orderId: orderId.toString(),
    orderCode: orderCode || '',
  });

  const item = JSON.stringify([
    {
      orderId: orderId.toString(),
      orderCode: orderCode || '',
      type: paymentType,
    },
  ]);

  const orderPayload = {
    app_id: parseInt(config.app_id, 10),
    app_trans_id,
    app_user,
    app_time,
    item,
    embed_data,
    amount: parseInt(amount, 10),
    description: `Thanh toán tour du lịch - Đơn hàng #${orderCode || orderId}`,
    bank_code: 'zalopayapp',
    callback_url: config.callbackUrl,
  };

  orderPayload.mac = generateCreateOrderMac(orderPayload, config.key1);

  try {
    const response = await fetch(config.createEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(orderPayload),
    });

    const data = await response.json();
    return {
      app_trans_id,
      ...data,
    };
  } catch (error) {
    const err = new Error(`Lỗi kết nối ZaloPay Gateway: ${error.message}`);
    err.statusCode = 502;
    throw err;
  }
}

/**
 * Gọi ZaloPay API v2 truy vấn trạng thái đơn hàng
 */
async function queryZaloPayTransaction(app_trans_id) {
  const config = getConfig();
  const queryPayload = {
    app_id: parseInt(config.app_id, 10),
    app_trans_id,
  };

  queryPayload.mac = generateQueryOrderMac(queryPayload, config.key1);

  try {
    const response = await fetch(config.queryEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(queryPayload),
    });

    return await response.json();
  } catch (error) {
    const err = new Error(`Lỗi truy vấn trạng thái ZaloPay: ${error.message}`);
    err.statusCode = 502;
    throw err;
  }
}

/**
 * Gọi ZaloPay API v2 hoàn tiền giao dịch
 */
async function refundZaloPayTransaction({ m_refund_id, zp_trans_id, amount, description }) {
  const config = getConfig();
  const timestamp = Date.now();

  const refundPayload = {
    app_id: parseInt(config.app_id, 10),
    m_refund_id,
    zp_trans_id,
    amount: parseInt(amount, 10),
    timestamp,
    description: description || 'Hoàn tiền tour du lịch',
  };

  refundPayload.mac = generateRefundMac(refundPayload, config.key1);

  try {
    const response = await fetch(config.refundEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(refundPayload),
    });

    return await response.json();
  } catch (error) {
    const err = new Error(`Lỗi gọi ZaloPay Refund API: ${error.message}`);
    err.statusCode = 502;
    throw err;
  }
}

module.exports = {
  createZaloPayTransaction,
  queryZaloPayTransaction,
  refundZaloPayTransaction,
  getYYMMDD,
  getConfig,
};

