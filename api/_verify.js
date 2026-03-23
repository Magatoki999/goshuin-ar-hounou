/**
 * api/_verify.js
 * トークン検証共通ヘルパー（admin-auth.js と整合）
 */

import crypto from 'crypto';

export function verifyAdminToken(req) {
  const token  = req.headers['x-admin-token'];
  if (!token) return false;

  try {
    const decoded  = Buffer.from(token, 'base64url').toString('utf-8');
    // "admin:<ts>:<nonce>:<sig>" の形式
    const lastColon = decoded.lastIndexOf(':');
    if (lastColon < 0) return false;
    const payload = decoded.slice(0, lastColon);
    const sig     = decoded.slice(lastColon + 1);
    if (!payload.startsWith('admin:')) return false;

    const SECRET   = process.env.ADMIN_TOKEN_SECRET || 'goshuin-admin-fallback-secret';
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    const sigBuf   = Buffer.from(sig, 'hex');
    const expBuf   = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return false;

    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}
