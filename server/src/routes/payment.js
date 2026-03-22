const express = require('express');
const crypto = require('crypto');
const querystring = require('querystring');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { createPaymentUrl, verifyReturn } = require('../utils/vnpay');
const config = require('../config');

const router = express.Router();

function clientIp(req) {
  const x = req.headers['x-forwarded-for'];
  if (typeof x === 'string' && x.length) return x.split(',')[0].trim();
  return req.socket?.remoteAddress || '127.0.0.1';
}

router.post('/vnpay-create', requireAuth, async (req, res) => {
  try {
    const { tmnCode, hashSecret, url, returnUrl, vipAmount } = config.vnp;
    if (!tmnCode || !hashSecret) {
      return res.status(503).json({ error: 'VNPay chưa cấu hình (VNP_TMN_CODE, VNP_HASH_SECRET)' });
    }
    const txnRef = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    await Payment.create({
      userId: req.user._id,
      txnRef,
      amount: vipAmount,
      status: 'pending'
    });
    const payUrl = createPaymentUrl({
      tmnCode,
      hashSecret,
      payUrl: url,
      returnUrl,
      ipAddr: clientIp(req),
      amountVnd: vipAmount,
      orderInfo: `PhimHay VIP ${txnRef}`,
      txnRef,
      locale: 'vn'
    });
    res.json({ payUrl, txnRef });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/vnpay-return', async (req, res) => {
  const vnp = req.query;
  const { hashSecret } = config.vnp;
  if (!hashSecret || !verifyReturn(vnp, hashSecret)) {
    return res.redirect(`${config.clientUrl}/payment/return?${querystring.stringify({ success: '0', msg: 'invalid_signature' })}`);
  }
  const txnRef = vnp.vnp_TxnRef;
  const payment = await Payment.findOne({ txnRef });
  if (!payment) {
    return res.redirect(`${config.clientUrl}/payment/return?${querystring.stringify({ success: '0', msg: 'unknown_order' })}`);
  }
  if (vnp.vnp_ResponseCode === '00') {
    payment.status = 'success';
    payment.vnpResponse = vnp;
    await payment.save();
    const days = Number(process.env.VIP_DURATION_DAYS) || 365;
    const until = new Date();
    until.setDate(until.getDate() + days);
    await User.findByIdAndUpdate(payment.userId, { isVip: true, vipExpiresAt: until });
  } else {
    payment.status = 'failed';
    payment.vnpResponse = vnp;
    await payment.save();
  }
  const q = querystring.stringify({
    success: vnp.vnp_ResponseCode === '00' ? '1' : '0',
    code: vnp.vnp_ResponseCode || ''
  });
  res.redirect(`${config.clientUrl}/payment/return?${q}`);
});

module.exports = router;
