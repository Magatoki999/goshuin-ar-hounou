import { ethers } from 'ethers';
import { Resend } from 'resend';

const CONTRACT_ADDRESS = '0x3A637bD5a5Ff49667Ff279BDa263c9118e7b2a03';

const ABI = [
  'function mint(address to, string memory uri, string memory shrine, string memory date, string memory weather, string memory timeOfDay, string memory blessing, string memory lang, uint256 amount) public returns (uint256)',
  'function _tokenIdCounter() public view returns (uint256)',
];

const BASE_URL = 'https://goshuin-ar-hounou.vercel.app';

function getMetadataUri(tokenId) {
  return `https://goshuin-ar-hounou.vercel.app/api/metadata?tokenId=${tokenId}`;
}

async function getOrCreatePrivyWallet(email) {
  const appId = process.env.PRIVY_APP_ID;
  const secretKey = process.env.PRIVY_SECRET_KEY;
  const authHeader = `Basic ${Buffer.from(`${appId}:${secretKey}`).toString('base64')}`;
  const headers = {
    'Authorization': authHeader,
    'privy-app-id': appId,
    'Content-Type': 'application/json',
  };

  const searchRes = await fetch(`https://auth.privy.io/api/v1/users?email=${encodeURIComponent(email)}`, { headers });
  const searchData = await searchRes.json();

  if (searchData.data && searchData.data.length > 0) {
    const user = searchData.data[0];
    const wallet = user.linked_accounts?.find(
      a => a.type === 'wallet' || a.type === 'ethereum' || a.chain_type === 'ethereum'
    );
    if (wallet) return wallet.address;
  }

  const createRes = await fetch('https://auth.privy.io/api/v1/users', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      linked_accounts: [{ type: 'email', address: email }],
      create_ethereum_wallet: true,
    })
  });

  const createData = await createRes.json();
  const wallet = createData.linked_accounts?.find(
    a => a.type === 'wallet' || a.type === 'ethereum' || a.chain_type === 'ethereum'
  );

  if (!wallet) throw new Error('ウォレットの作成に失敗しました: ' + JSON.stringify(createData));
  return wallet.address;
}

async function sendNFTEmail(email, txHash, walletAddress, shrine, date, blessing, lang) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const isJa = lang === 'ja';
  const etherscanUrl = `https://goshuin-ar-hounou.vercel.app/nft.html?tx=${txHash}`;

  const subject = isJa
    ? `【御朱印AR】${shrine}への参拝記念NFTが届きました`
    : `[Goshuin AR] Your commemorative NFT from ${shrine} has arrived`;

  const html = isJa ? `
    <div style="font-family:'Yu Mincho',serif; max-width:560px; margin:0 auto; background:#0d0a04; color:#e8e0d0; padding:40px 32px; border-radius:12px;">
      <div style="text-align:center; margin-bottom:32px;">
        <div style="font-size:32px; margin-bottom:8px;">🌸</div>
        <div style="font-size:22px; color:#D4AF37; letter-spacing:3px;">参拝之証</div>
      </div>
      <p style="font-size:15px; line-height:2; margin-bottom:24px;">
        ${shrine}へのご参拝、誠にありがとうございます。<br>
        参拝の記念として、インボイスNFTを発行いたしました。
      </p>
      <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(212,175,55,0.3); border-radius:10px; padding:20px; margin-bottom:24px;">
        <div style="font-size:12px; color:rgba(212,175,55,0.7); letter-spacing:2px; margin-bottom:8px;">参拝記録</div>
        <div style="font-size:14px; line-height:2;">
          🏛️ 神社：${shrine}<br>
          📅 日付：${date}<br>
          🎋 ご利益：${blessing}
        </div>
      </div>
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:16px; margin-bottom:24px;">
        <div style="font-size:11px; color:rgba(255,255,255,0.4); letter-spacing:2px; margin-bottom:6px;">ウォレットアドレス</div>
        <div style="font-size:11px; color:#D4AF37; word-break:break-all; font-family:monospace;">${walletAddress}</div>
      </div>
      <div style="text-align:center; margin-bottom:24px;">
        <a href="${etherscanUrl}" style="display:inline-block; background:#D4AF37; color:#1a1208; padding:14px 32px; border-radius:25px; text-decoration:none; font-size:14px; font-weight:bold; letter-spacing:2px;">
          NFTを確認する
        </a>
      </div>
      <p style="font-size:11px; color:rgba(255,255,255,0.3); text-align:center; line-height:1.8;">
        このNFTはPolygon zkEVM上に永久記録されます。<br>
        MAGATOKI Laboratory
      </p>
    </div>
  ` : `
    <div style="font-family:Georgia,serif; max-width:560px; margin:0 auto; background:#0d0a04; color:#e8e0d0; padding:40px 32px; border-radius:12px;">
      <div style="text-align:center; margin-bottom:32px;">
        <div style="font-size:32px; margin-bottom:8px;">🌸</div>
        <div style="font-size:22px; color:#D4AF37; letter-spacing:3px;">Proof of Visit</div>
      </div>
      <p style="font-size:15px; line-height:2; margin-bottom:24px;">
        Thank you for your visit to ${shrine}.<br>
        Your commemorative Invoice NFT has been issued.
      </p>
      <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(212,175,55,0.3); border-radius:10px; padding:20px; margin-bottom:24px;">
        <div style="font-size:12px; color:rgba(212,175,55,0.7); letter-spacing:2px; margin-bottom:8px;">Visit Record</div>
        <div style="font-size:14px; line-height:2;">
          🏛️ Shrine: ${shrine}<br>
          📅 Date: ${date}<br>
          🎋 Blessing: ${blessing}
        </div>
      </div>
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:16px; margin-bottom:24px;">
        <div style="font-size:11px; color:rgba(255,255,255,0.4); letter-spacing:2px; margin-bottom:6px;">Wallet Address</div>
        <div style="font-size:11px; color:#D4AF37; word-break:break-all; font-family:monospace;">${walletAddress}</div>
      </div>
      <div style="text-align:center; margin-bottom:24px;">
        <a href="${etherscanUrl}" style="display:inline-block; background:#D4AF37; color:#1a1208; padding:14px 32px; border-radius:25px; text-decoration:none; font-size:14px; font-weight:bold; letter-spacing:2px;">
          View My NFT
        </a>
      </div>
      <p style="font-size:11px; color:rgba(255,255,255,0.3); text-align:center; line-height:1.8;">
        This NFT is permanently recorded on the blockchain.<br>
        MAGATOKI Laboratory
      </p>
    </div>
  `;

  await resend.emails.send({
    from: 'MAGATOKI Laboratory <onboarding@resend.dev>',
    to: email,
    subject,
    html,
  });

  console.log(`メール送信完了: ${email}`);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, shrine, date, weather, timeOfDay, blessing, lang, amount } = req.body;

  if (!email) return res.status(400).json({ error: 'メールアドレスが必要です' });

  try {
    console.log(`Privyウォレット取得中: ${email}`);
    const walletAddress = await getOrCreatePrivyWallet(email);
    console.log(`ウォレットアドレス: ${walletAddress}`);

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    // 次のtokenIdを取得して動的メタデータURLを設定
    let nextTokenId = '0';
    try {
      const counter = await contract._tokenIdCounter();
      nextTokenId = counter.toString();
    } catch (e) {
      console.warn('tokenIdCounter取得失敗:', e.message);
    }
    const uri = `${BASE_URL}/api/metadata?tokenId=${nextTokenId}`;
    console.log(`メタデータURI: ${uri}`);

    const tx = await contract.mint(
      walletAddress,
      uri,
      shrine || '飛梅天満宮',
      date || new Date().toLocaleDateString('ja-JP'),
      weather || 'clear',
      timeOfDay || 'midday',
      blessing || '心願成就',
      lang || 'ja',
      amount || 0
    );

    const receipt = await tx.wait();

    // TransferイベントからtokenIdを確認
    const transferTopic = ethers.id('Transfer(address,address,uint256)');
    const log = receipt.logs.find(l => l.topics[0] === transferTopic);
    const mintedTokenId = log ? BigInt(log.topics[3]).toString() : nextTokenId;
    console.log(`NFTミント完了: ${tx.hash} tokenId: ${mintedTokenId}`);

    // メール送信
    await sendNFTEmail(
      email,
      tx.hash,
      walletAddress,
      shrine || '飛梅天満宮',
      date || new Date().toLocaleDateString('ja-JP'),
      blessing || '心願成就',
      lang || 'ja'
    );

    return res.status(200).json({
      success: true,
      txHash: tx.hash,
      tokenId: mintedTokenId,
      walletAddress,
      message: 'NFTが発行されました'
    });

  } catch (err) {
    console.error('エラー:', err);
    return res.status(500).json({ error: err.message || 'NFTの発行に失敗しました' });
  }
}