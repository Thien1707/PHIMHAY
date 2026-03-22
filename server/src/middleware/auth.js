const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), email: user.email, isAdmin: !!user.isAdmin, isVip: !!user.isVip },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

async function optionalAuth(req, _res, next) {
  const h = req.headers.authorization;
  const token = h && h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) {
    req.userPayload = null;
    req.user = null;
    return next();
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userPayload = payload;
    const user = await User.findById(payload.sub).lean();
    req.user = user || null;
  } catch {
    req.userPayload = null;
    req.user = null;
  }
  next();
}

async function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  const token = h && h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Cần đăng nhập' });
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ error: 'Tài khoản không hợp lệ' });
    req.user = user;
    req.userPayload = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Phiên đăng nhập hết hạn' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Chỉ admin' });
  next();
}

function isVipActive(user) {
  if (!user?.isVip) return false;
  if (!user.vipExpiresAt) return true;
  return new Date(user.vipExpiresAt).getTime() > Date.now();
}

module.exports = { signToken, optionalAuth, requireAuth, requireAdmin, isVipActive };
