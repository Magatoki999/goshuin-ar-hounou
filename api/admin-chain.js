/**
 * api/admin-chain.js
 * goshuin-dev ウォレットの ETH 残高を返す軽量API
 *
 * GET /api/admin-chain?type=balance  → ETH残高
 * GET /api/admin-chain?type=nft-detail&txHash=0x…  → NFT詳細（モーダル用）
 *
 * 必要な環境変数:
 *   SEPOLIA_RPC_URL
 *   ADMIN_TOKEN_SECRET
 */

import { ethers } from 'ethers';
import { verifyAdminToken } from './_verify.js';

const CONTRACT_ADDRESS = '0x3A637bD5a5Ff49667Ff279BDa263c9118e7b2a03';
const OWNER_ADDRESS    = '0x0a4a4F7F8D69Af17F8Dc69cadeBc5eD1B2e90716';

const ABI = [
  'function getRecord(uint256 tokenId) view returns (tuple(string shrine, string date, string weather, string timeOfDay, string blessing, string lang, uint256 amount, uint256 timestamp))',
  'function records(uint256 tokenId) view returns (string shrine, string date, string weather, string timeOfDay, string blessing, string lang, uint256 amount, uint256 timestamp)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

function getProvider() {
  const rpc = process.env.SEPOLIA_RPC_URL;
  if (!rpc) throw new Error('SEPOLIA_RPC_URL is not configured');
  return new ethers.JsonRpcProvider(rpc);
}

async function getTokenIdFromTx(provider, txHash) {
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) return null;
  const transferTopic = ethers.id('Transfer(address,address,uint256)');
  const log = receipt.logs.find(l =>
    l.topics[0] === transferTopic &&
    l.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
  );
  return log ? ethers.toBigInt(log.topics[3]).toString() : null;
}

async function fetchRecord(contract, tokenId) {
  try {
    const r = await contract.getRecord(tokenId);
    return { shrine: r.shrine, date: r.date, weather: r.weather,
             timeOfDay: r.timeOfDay, blessing: r.blessing, lang: r.lang,
             amount: r.amount.toString(), timestamp: r.timestamp.toString() };
  } catch {
    try {
      const r = await contract.records(tokenId);
      return { shrine: r.shrine, date: r.date, weather: r.weather,
               timeOfDay: r.timeOfDay, blessing: r.blessing, lang: r.lang,
               amount: r.amount.toString(), timestamp: r.timestamp.toString() };
    } catch { return null; }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyAdminToken(req)) return res.status(401).json({ error: 'Unauthorized' });

  const type   = req.query.type || 'balance';
  const txHash = req.query.txHash || null;

  try {
    const provider = getProvider();

    /* ── NFT詳細（モーダル用） ── */
    if (type === 'nft-detail' && txHash) {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const tokenId  = await getTokenIdFromTx(provider, txHash);
      if (!tokenId) return res.status(200).json({ tokenId: null, record: null });
      const record = await fetchRecord(contract, tokenId);
      return res.status(200).json({ tokenId, record });
    }

    /* ── ETH残高（ヘッダー表示用） ── */
    const balanceBig   = await provider.getBalance(OWNER_ADDRESS);
    const ownerBalance = ethers.formatEther(balanceBig);
    return res.status(200).json({
      ownerBalance: parseFloat(ownerBalance).toFixed(4),
    });

  } catch (err) {
    console.error('[admin-chain]', err);
    return res.status(500).json({ error: err.message });
  }
}
