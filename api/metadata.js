import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x3A637bD5a5Ff49667Ff279BDa263c9118e7b2a03';

const ABI = [
  'function getRecord(uint256 tokenId) public view returns (tuple(string shrine, string date, string weather, string timeOfDay, string blessing, string lang, uint256 amount, uint256 timestamp))'
];

function getImageUrl(weather, timeOfDay, date) {
  // 特定日判定
  const d = new Date();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  if (month === 1 && day <= 3) {
    return 'ipfs://bafybeigbxuy6vnqlljtn53w2ln3vepqtvkg652cymwfsihjs2qeudqrpee'; // 疾風迅雷（元旦）
  }
  if (day === 25) {
    return 'ipfs://bafybeigbxuy6vnqlljtn53w2ln3vepqtvkg652cymwfsihjs2qeudqrpee'; // 疾風迅雷（天神縁日）
  }

  // 天気で選択
  if (weather === 'rain') {
    return 'ipfs://bafybeihljyb3sh7uqf2kiiee574emyd3o7mfkunhr2wfhdecpdozqol2ga'; // 雲外蒼天
  }
  if (weather === 'snow') {
    return 'ipfs://bafybeiebgib4vkt4re3ywwqdw77jncwp4znxgquwoxwrqijtlqrwzzof44'; // 不撓不屈
  }
  return 'ipfs://bafybeigbxuy6vnqlljtn53w2ln3vepqtvkg652cymwfsihjs2qeudqrpee'; // 疾風迅雷（晴れ）
}

function getTitle(weather, timeOfDay, blessing) {
  const weatherMap = { clear: '晴天', rain: '雨天', snow: '雪天' };
  const timeMap = { morning: '朝霧', midday: '白日', evening: '黄昏', night: '月明かり' };
  return `${timeMap[timeOfDay] || timeOfDay}の${weatherMap[weather] || weather} — ${blessing}`;
}

function getDescription(shrine, date, weather, timeOfDay, blessing, lang) {
  if (lang === 'en') {
    const weatherMap = { clear: 'clear skies', rain: 'rain', snow: 'snow' };
    const timeMap = { morning: 'morning mist', midday: 'midday light', evening: 'evening glow', night: 'moonlight' };
    return `A visit to ${shrine} on ${date}, under ${timeMap[timeOfDay] || timeOfDay} and ${weatherMap[weather] || weather}. Blessing: ${blessing}.`;
  }
  const weatherMap = { clear: '晴れ', rain: '雨', snow: '雪' };
  const timeMap = { morning: '朝霧の中', midday: '白日の下', evening: '黄昏時に', night: '月明かりの下' };
  return `${date}、${timeMap[timeOfDay] || timeOfDay}${shrine}を参拝。ご利益：${blessing}。`;
}

export default async function handler(req, res) {
  const { tokenId } = req.query;
  if (tokenId === undefined) return res.status(400).json({ error: 'tokenIdが必要です' });

  try {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const record = await contract.getRecord(tokenId);

    const shrine    = record[0];
    const date      = record[1];
    const weather   = record[2];
    const timeOfDay = record[3];
    const blessing  = record[4];
    const lang      = record[5];
    const amount    = record[6].toString();

    const image = getImageUrl(weather, timeOfDay, date);
    const title = getTitle(weather, timeOfDay, blessing);
    const description = getDescription(shrine, date, weather, timeOfDay, blessing, lang);

    const weatherMap = { clear: '晴れ ☀️', rain: '雨 🌧️', snow: '雪 ❄️' };
    const timeMap = { morning: '朝霧', midday: '白日', evening: '黄昏', night: '月明かり' };

    const metadata = {
      name: `御朱印インボイスNFT #${tokenId} — ${title}`,
      description,
      image,
      attributes: [
        { trait_type: '神社',     value: shrine },
        { trait_type: '参拝日',   value: date },
        { trait_type: '天気',     value: weatherMap[weather] || weather },
        { trait_type: '時間帯',   value: timeMap[timeOfDay] || timeOfDay },
        { trait_type: 'ご利益',   value: blessing },
        { trait_type: '奉納金額', value: amount > 0 ? `¥${Number(amount).toLocaleString()}` : '奉納なし' },
        { trait_type: '言語',     value: lang === 'ja' ? '日本語' : 'English' },
      ]
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).json(metadata);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}