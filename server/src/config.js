const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const PHIMAPI_BASE = process.env.PHIMAPI_BASE || 'https://phimapi.com';

module.exports = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/phimhay',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  phimapiBase: PHIMAPI_BASE,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  /** Nếu set, header x-admin-secret khi đăng ký sẽ tạo tài khoản admin */
  initialAdminSecret: process.env.INITIAL_ADMIN_SECRET || '',
  vnp: {
    tmnCode: process.env.VNP_TMN_CODE || '',
    hashSecret: process.env.VNP_HASH_SECRET || '',
    url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNP_RETURN_URL || 'http://localhost:4000/api/payment/vnpay-return',
    vipAmount: Number(process.env.VNP_VIP_AMOUNT) || 100000
  }
};
