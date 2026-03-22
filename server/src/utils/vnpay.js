const crypto = require('crypto');

/** Gần PHP urlencode: space → + (khác encodeURIComponent chỉ ở chỗ này). */
function phpUrlEncode(str) {
  return encodeURIComponent(String(str)).replace(/%20/g, '+');
}

/** VNPay yêu cầu yyyyMMddHHmmss theo GMT+7. */
function formatVnpDateTime(date = new Date()) {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = dtf.formatToParts(date);
  const g = (t) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${g('year')}${g('month')}${g('day')}${g('hour')}${g('minute')}${g('second')}`;
}

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .filter((k) => obj[k] !== '' && obj[k] !== undefined && obj[k] !== null)
    .sort()
    .forEach((k) => {
      sorted[k] = obj[k];
    });
  return sorted;
}

/** Chuỗi dùng cho HMAC SHA512 — từng cặp key/value đều phpUrlEncode (theo sample VNPay). */
function buildHashData(vnpParams) {
  const sign = sortObject(vnpParams);
  return Object.keys(sign)
    .map((k) => `${phpUrlEncode(k)}=${phpUrlEncode(sign[k])}`)
    .join('&');
}

function createPaymentUrl({
  tmnCode,
  hashSecret,
  payUrl,
  returnUrl,
  ipAddr,
  amountVnd,
  orderInfo,
  txnRef,
  locale = 'vn'
}) {
  const now = new Date();
  const createDate = formatVnpDateTime(now);
  const expireDate = formatVnpDateTime(new Date(now.getTime() + 15 * 60 * 1000));

  const vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: String(Math.round(Number(amountVnd)) * 100),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate
  };

  const hashData = buildHashData(vnp_Params);
  const secureHash = crypto.createHmac('sha512', hashSecret).update(hashData, 'utf8').digest('hex');
  const query = `${hashData}&vnp_SecureHash=${secureHash}`;
  return `${payUrl}?${query}`;
}

function verifyReturn(vnpParams, hashSecret) {
  const secureHash = vnpParams.vnp_SecureHash;
  if (!secureHash || typeof secureHash !== 'string') return false;

  const clone = { ...vnpParams };
  delete clone.vnp_SecureHash;
  delete clone.vnp_SecureHashType;

  const hashData = buildHashData(clone);
  const check = crypto.createHmac('sha512', hashSecret).update(hashData, 'utf8').digest('hex');
  const a = secureHash.toLowerCase();
  const b = check.toLowerCase();
  return a.length === b.length && crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

module.exports = { createPaymentUrl, verifyReturn };
