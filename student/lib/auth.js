const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'student-info-system-secret-key';

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function getBearerToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}

function requireAuth(req, roles = []) {
  const token = getBearerToken(req);
  if (!token) {
    return { error: '未登录', status: 401 };
  }
  const user = verifyToken(token);
  if (!user) {
    return { error: '登录已过期，请重新登录', status: 401 };
  }
  if (roles.length && !roles.includes(user.role)) {
    return { error: '无权限访问', status: 403 };
  }
  return { user };
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  getBearerToken,
  requireAuth,
};
