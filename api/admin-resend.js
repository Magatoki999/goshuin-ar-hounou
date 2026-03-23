/**
 * api/admin-resend.js
 * 管理者によるメール再送信
 *
 * POST /api/admin-resend
 * Body: { paymentId: string, email: string }
 *
 * 必要な環境変数:
 *   RESEND_API_KEY
 *   STRIPE_SECRET_KEY
 *   ADMIN_TOKEN_SECRET
 */

import { Resend }  from 'resend';
import Stripe       from 'stripe';
import { verifyAdminToken } from './_verify.js';

/* ── メール HTML テンプレート ────────────── */
function buildHtml({ amount, createdAt, paymentId, txHash, wallet }) {
  const esBase = 'https://sepolia.etherscan.io';
  const nftUrl = txHash
    ? `https://goshuin-ar-hounou.vercel.app/nft.html?tx=${txHash}`
    : null;

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#08080b;color:#e2ddd2;font-family:'Hiragino Mincho ProN','Yu Mincho',serif;">
<div style="max-width:500px;margin:0 auto;padding:48px 24px;">

  <!-- ヘッダー -->
  <div style="text-align:center;margin-bottom:36px;">
    <div style="font-size:48px;color:#c8a84b;letter-spacing:2px;line-height:1;">梅</div>
    <div style="font-size:10px;letter-spacing:8px;color:#524e45;margin-top:6px;text-transform:uppercase;">
      MAGATOKI LABORATORY
    </div>
  </div>

  <!-- 本文 -->
  <div style="border:1px solid #1c1c27;padding:32px;margin-bottom:20px;">
    <h2 style="font-size:15px;font-weight:400;letter-spacing:3px;color:#c8a84b;margin:0 0 20px;">
      ご奉納ありがとうございます
    </h2>
    <p style="font-size:13px;line-height:2;color:#9a9485;margin:0 0 24px;">
      このたびはご参拝・ご奉納いただき、誠にありがとうございます。<br>
      お参りの記録をブロックチェーンに永久に刻みました。
    </p>

    <!-- 奉納詳細 -->
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <tr style="border-bottom:1px solid #1c1c27;">
        <td style="padding:10px 0;color:#524e45;width:110px;letter-spacing:2px;">奉納金額</td>
        <td style="padding:10px 0;color:#c8a84b;font-family:monospace;">¥${amount.toLocaleString()}</td>
      </tr>
      <tr style="border-bottom:1px solid #1c1c27;">
        <td style="padding:10px 0;color:#524e45;letter-spacing:2px;">参拝日時</td>
        <td style="padding:10px 0;font-family:monospace;font-size:11px;">${createdAt}</td>
      </tr>
      <tr style="border-bottom:${txHash?'1px solid #1c1c27':'none'};">
        <td style="padding:10px 0;color:#524e45;letter-spacing:2px;">証明ID</td>
        <td style="padding:10px 0;font-family:monospace;font-size:10px;word-break:break-all;">${paymentId}</td>
      </tr>
      ${wallet ? `
      <tr style="border-bottom:${txHash?'1px solid #1c1c27':'none'};">
        <td style="padding:10px 0;color:#524e45;letter-spacing:2px;">ウォレット</td>
        <td style="padding:10px 0;font-family:monospace;font-size:11px;">
          ${wallet.slice(0,8)}…${wallet.slice(-4)}
        </td>
      </tr>` : ''}
      ${txHash ? `
      <tr>
        <td style="padding:10px 0;color:#524e45;letter-spacing:2px;">TX Hash</td>
        <td style="padding:10px 0;font-family:monospace;font-size:10px;word-break:break-all;">
          <a href="${esBase}/tx/${txHash}" style="color:#c8a84b;">${txHash}</a>
        </td>
      </tr>` : ''}
    </table>
  </div>

  <!-- CTAボタン -->
  ${nftUrl ? `
  <div style="text-align:center;margin-bottom:20px;">
    <a href="${nftUrl}"
      style="display:inline-block;padding:14px 44px;
             border:1px solid #c8a84b;color:#c8a84b;
             font-size:12px;letter-spacing:5px;text-decoration:none;">
      記念NFTを確認する
    </a>
  </div>
  <div style="text-align:center;margin-bottom:28px;">
    <a href="${esBase}/tx/${txHash}"
      style="font-size:10px;color:#524e45;letter-spacing:2px;text-decoration:none;">
      Etherscan でブロックチェーン記録を確認 →
    </a>
  </div>
  ` : `
  <div style="border:1px solid #1c1c27;padding:16px;margin-bottom:20px;text-align:center;">
    <p style="font-size:11px;color:#524e45;letter-spacing:2px;margin:0;">
      NFT は現在処理中です。しばらくお待ちください。
    </p>
  </div>`}

  <!-- フッター -->
  <div style="border-top:1px solid #1c1c27;padding-top:20px;text-align:center;">
    <p style="font-size:10px;color:#524e45;line-height:1.9;margin:0;">
      このメールは管理者による再送信です。<br>
      ご不明な点は
      <a href="mailto:info@magatokilab.com" style="color:#c8a84b;">info@magatokilab.com</a>
      までお問い合わせください。
    </p>
  </div>

</div>
</body>
</html>`;
}

/* ── メインハンドラ ──────────────────────── */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyAdminToken(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { paymentId, email } = req.body || {};
  if (!paymentId || !email) {
    return res.status(400).json({ error: 'paymentId and email are required' });
  }

  // メールアドレス簡易バリデーション
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    // Stripe から最新情報を取得
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    const pi     = await stripe.paymentIntents.retrieve(paymentId);
    const meta   = pi.metadata || {};

    const txHash   = meta.txHash || null;
    const wallet   = meta.walletAddress || null;
    const amount   = pi.amount || 0;
    const createdAt = new Date(pi.created * 1000).toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year:     'numeric',
      month:    '2-digit',
      day:      '2-digit',
      hour:     '2-digit',
      minute:   '2-digit',
    });

    const html = buildHtml({ amount, createdAt, paymentId, txHash, wallet });

    // Resend 送信
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from:    'noreply@magatokilab.com',
      to:      email,
      subject: '【再送】ご奉納ありがとうございます — 御朱印AR奉納システム',
      html,
    });

    if (result.error) {
      console.error('[admin-resend] Resend error:', result.error);
      return res.status(502).json({ error: result.error.message });
    }

    console.log(`[admin-resend] OK: to=${email} paymentId=${paymentId} resend_id=${result.data?.id}`);
    return res.status(200).json({ success: true, resendId: result.data?.id });

  } catch (err) {
    console.error('[admin-resend]', err);
    return res.status(500).json({ error: err.message });
  }
}
