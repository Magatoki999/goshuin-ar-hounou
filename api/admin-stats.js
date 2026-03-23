/**
 * api/admin-stats.js
 * 管理画面向け統計・一覧データ
 *
 * GET /api/admin-stats              → ダッシュボード統計
 * GET /api/admin-stats?type=payments → 全奉納一覧（Stripe）
 * GET /api/admin-stats?type=nfts    → NFT発行一覧
 *
 * 必要な環境変数:
 *   STRIPE_SECRET_KEY
 *   ADMIN_TOKEN_SECRET
 */

import Stripe from 'stripe';
import { verifyAdminToken } from './_verify.js';

/* ── Stripe 全件取得 ──────────────────────── */
async function fetchAllPI(stripe) {
  const all = [];
  let cursor;
  while (true) {
    const p = { limit: 100 };
    if (cursor) p.starting_after = cursor;
    const page = await stripe.paymentIntents.list(p);
    all.push(...page.data);
    if (!page.has_more) break;
    cursor = page.data.at(-1).id;
  }
  return all;
}

/* ── PI → 内部オブジェクト ────────────────── */
function fmt(pi) {
  const m = pi.metadata || {};
  return {
    id:        pi.id,
    amount:    pi.amount,           // 円
    status:    pi.status,
    email:     m.email || pi.receipt_email || null,
    txHash:    m.txHash || null,
    wallet:    m.walletAddress || null,
    paymentId: m.paymentId || pi.id,
    shrine:    m.shrine || null,
    weather:   m.weather || null,
    timeOfDay: m.timeOfDay || null,
    blessing:  m.blessing || null,
    created:   pi.created,
  };
}

/* ── JST 当日 00:00 の Unix秒 ────────────── */
function todayJSTStartSec() {
  const now = new Date();
  // UTC でその日の 0:00 を求め、-9h (JST の前日 15:00 UTC)
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstNow    = new Date(now.getTime() + jstOffset);
  const jstMid    = new Date(
    Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate())
  );
  return Math.floor((jstMid.getTime() - jstOffset) / 1000);
}

/* ── 日別集計（直近N日、JST基準） ────────── */
function buildDaily(succeeded, days) {
  const jstOffset = 9 * 3600;
  const result = [];
  const nowSec  = Math.floor(Date.now() / 1000);

  for (let i = days - 1; i >= 0; i--) {
    const dayStartSec = nowSec - i * 86400;
    const jstTs       = dayStartSec + jstOffset;
    const d           = new Date(jstTs * 1000);
    const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
    const start = dayStartSec - (dayStartSec % 86400);
    const end   = start + 86400;
    const amount = succeeded
      .filter(p => p.created >= start && p.created < end)
      .reduce((s, p) => s + p.amount, 0);
    result.push({ date, amount });
  }
  return result;
}

/* ── メインハンドラ ──────────────────────── */
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyAdminToken(req)) return res.status(401).json({ error: 'Unauthorized' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  const type   = req.query.type || 'dashboard';

  try {
    const pis       = await fetchAllPI(stripe);
    const succeeded = pis.filter(p => p.status === 'succeeded');
    const payments  = pis.map(fmt);

    /* payments 一覧 */
    if (type === 'payments') {
      return res.status(200).json({ payments });
    }

    /* NFTs 一覧 */
    if (type === 'nfts') {
      const nfts = succeeded.map(p => ({
        paymentId: (p.metadata?.paymentId) || p.id,
        email:     p.metadata?.email || p.receipt_email || null,
        wallet:    p.metadata?.walletAddress || null,
        txHash:    p.metadata?.txHash || null,
        created:   p.created,
      }));
      return res.status(200).json({ nfts });
    }

    /* ダッシュボード統計 */
    const totalAmount  = succeeded.reduce((s,p) => s + p.amount, 0);
    const totalCount   = succeeded.length;
    const nftCount     = succeeded.filter(p => p.metadata?.txHash).length;
    const todayStart   = todayJSTStartSec();
    const todayAmount  = succeeded
      .filter(p => p.created >= todayStart)
      .reduce((s,p) => s + p.amount, 0);

    const distribution = { 100: 0, 500: 0, 1000: 0 };
    succeeded.forEach(p => {
      if (distribution[p.amount] !== undefined) distribution[p.amount]++;
    });

    const daily  = buildDaily(succeeded, 30);
    const recent = payments.slice(0, 20); // 最新20件

    return res.status(200).json({
      totalAmount, totalCount, nftCount, todayAmount,
      distribution, daily, recent,
    });

  } catch (err) {
    console.error('[admin-stats]', err);
    return res.status(500).json({ error: err.message });
  }
}
