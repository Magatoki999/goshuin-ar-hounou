/**
 * api/admin-auth.js
 * 管理者パスワード照合 → セッショントークン発行
 *
 * 必要な環境変数:
 *   ADMIN_PASSWORD      管理者パスワード
 *   ADMIN_TOKEN_SECRET  HMAC署名用シークレット（任意のランダム文字列）
 */

import crypto from 'crypto';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  const ADMIN_PW     = process.env.ADMIN_PASSWORD;
  const SECRET       = process.env.ADMIN_TOKEN_SECRET || 'goshuin-admin-fallback-secret';

  if (!ADMIN_PW) {
    console.error('[admin-auth] ADMIN_PASSWORD is not configured');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  // タイミング攻撃対策: timingSafeEqual で比較
  const pwBuf       = Buffer.from(password || '', 'utf8');
  const correctBuf  = Buffer.from(ADMIN_PW, 'utf8');
  const match = pwBuf.length === correctBuf.length &&
    crypto.timingSafeEqual(pwBuf, correctBuf);

  if (!match) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  // トークン生成: payload:HMAC(payload, secret) を base64 エンコード
  const payload = `admin:${Date.now()}:${crypto.randomBytes(8).toString('hex')}`;
  const sig     = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  const token   = Buffer.from(`${payload}:${sig}`).toString('base64url');

  return res.status(200).json({ token });
}
