# goshuin-ar-hounou

**次世代御朱印AR × 奉納決済 × インボイスNFT システム**  
**Next-generation Goshuin AR × Offering Payment × Invoice NFT System**

> 参拝者がブロックチェーンを一切意識せずに奉納・NFT受け取りができる、次世代型デジタル奉納プラットフォーム。  
> A next-generation digital offering platform where visitors can make offerings and receive NFTs without any blockchain knowledge.

---

## プロジェクト概要 / Overview

[ar-goshuin-demo](https://github.com/Magatoki999/ar-goshuin-demo)（公開中の御朱印ARアプリ）をベースに、奉納決済・インボイスNFT発行・管理画面・メール通知機能を追加した実証実験プラットフォーム。

### 体験フロー / User Flow

```
参拝者が栞（はさみ紙）にスマホをかざす
    ↓
ARで飛梅と祈りの鶴が出現
    ↓
参拝証をキャプチャ（天気・時間帯・おみくじが自動反映）
    ↓
「ご縁を結ぶ」— 円建てで奉納金額を選ぶ
    ↓
カード / Apple Pay / Google Pay で決済
    ↓
奉納完了 + 証明ID発行
    ↓
メールアドレスを入力するだけ（ウォレット不要）
    ↓
Privyが自動でウォレットを生成
    ↓
インボイスNFTが発行される
    ↓
noreply@magatokilab.com からメール通知
    ↓
専用ページでNFT画像・参拝記録を確認
```

---

## 設計思想 / Design Philosophy

### ユーザーはブロックチェーンを意識しない

| ユーザーが見るもの | 裏側で起きていること |
|---|---|
| 円で奉納 | Stripeで決済処理 |
| メールアドレスを入力 | Privyが自動でウォレット生成 |
| NFTが届いた | SepoliaにNFTがミント（→ Polygon zkEVM予定） |
| 確認ページで記念品を見る | IPFSのメタデータを取得 |

### 手数料ゼロへのロードマップ

```
現在（Phase 1）
参拝者 → Stripe（3.6%手数料）→ 神社

目標（Phase 3）
参拝者 → JPYC直接送金（手数料ほぼゼロ）→ 神社
神社側のみJPYCウォレットが必要
```

---

## 技術スタック / Tech Stack

| カテゴリ | 技術 |
|---|---|
| AR | MindAR 1.2.2 + A-Frame 1.4.2 |
| ホスティング | Vercel（Hobby Plan） |
| 決済 | Stripe（カード / Apple Pay / Google Pay） |
| Webhook | Stripe Webhooks |
| ウォレット生成 | Privy（Embedded Wallet） |
| NFT | ERC-721（GoshuinInvoiceNFT） |
| ブロックチェーン | Sepolia Testnet → Polygon zkEVM（予定） |
| メタデータ | IPFS（Pinata） + 動的生成API |
| メール通知 | Resend |
| 送信元ドメイン | noreply@magatokilab.com |
| 管理画面認証 | パスワード認証 + HMACトークン |

---

## ファイル構成 / File Structure

```
goshuin-ar-hounou/
├── index.html              # メインARアプリ（奉納UI・NFT受取UI組み込み済み）
├── admin.html              # 管理画面
├── legal.html              # 特定商取引法に基づく表記
├── nft.html                # NFT確認ページ（メールリンクから遷移）
├── sw.js                   # Service Worker
├── vercel.json             # Vercel設定（outputDirectory: "."が重要）
├── targets.mind            # MindAR 画像認識ターゲット
├── ume_petal.png           # 梅花びらテクスチャ
├── kamon.png               # 家紋テクスチャ
├── ink_aura.png            # 墨アウラテクスチャ
├── oritsuru_merrygoround.glb # 折り鶴3Dモデル
├── tenmangu_ambient.mp3    # 環境音
├── package.json
└── api/
    ├── create-payment.js   # Stripe Payment Intent生成
    ├── webhook.js          # Stripe Webhook受信
    ├── mint-nft.js         # Privy + NFTミント + Resendメール送信 + Stripe metadata更新
    ├── nft-info.js         # TXハッシュ → NFT情報取得
    ├── metadata.js         # NFTメタデータ動的生成
    ├── check-wallet.js     # ウォレット残高確認（開発用）
    ├── admin-auth.js       # 管理者パスワード認証 + HMACトークン発行
    ├── admin-stats.js      # Stripe集計・一覧取得
    ├── admin-chain.js      # ETH残高・NFT詳細照会（ethers.js）
    ├── admin-resend.js     # メール再送信（Resend）
    └── _verify.js          # トークン検証共通モジュール
```

---

## 環境変数 / Environment Variables（Vercel）

| KEY | 説明 |
|---|---|
| STRIPE_SECRET_KEY | Stripe シークレットキー |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe 公開可能キー |
| STRIPE_WEBHOOK_SECRET | Stripe Webhook署名シークレット |
| PRIVY_APP_ID | Privy アプリID |
| PRIVY_SECRET_KEY | Privy シークレットキー |
| SEPOLIA_RPC_URL | Alchemy Sepolia RPC URL |
| PRIVATE_KEY | デプロイ専用ウォレット秘密鍵（goshuin-dev） |
| RESEND_API_KEY | Resend APIキー |
| ADMIN_PASSWORD | 管理画面パスワード |
| ADMIN_TOKEN_SECRET | HMACトークン署名シークレット（32文字以上のランダム文字列） |

---

## 管理画面 / Admin Dashboard

アクセス: `https://goshuin-ar-hounou.vercel.app/admin.html`

| タブ | 機能 |
|---|---|
| 概要 | KPI・日別収益グラフ・金額分布・最新奉納一覧 |
| 奉納 | Stripe全件一覧・検索・フィルター・詳細モーダル |
| NFT | 発行済み/未発行一覧・メール再送信 |
| ヘッダー | goshuin-dev ETH残高アラート（3段階） |

### ETH残高アラート

| 残高 | 表示 |
|---|---|
| 0.1 ETH以上 | グレー — 正常 |
| 0.05〜0.1 ETH | 金色 — 注意 |
| 0.05 ETH未満 | 赤点滅 — 要補充 |

---

## コントラクト / Contract

| 項目 | 値 |
|---|---|
| コントラクト名 | GoshuinInvoiceNFT（GoshuinNFT.sol） |
| シンボル | GOIN |
| Sepoliaアドレス | 0x3A637bD5a5Ff49667Ff279BDa263c9118e7b2a03 |
| オーナー | 0x0a4a4F7F8D69Af17F8Dc69cadeBc5eD1B2e90716（goshuin-dev） |
| 本番予定チェーン | Polygon zkEVM |

---

## 重要な実装メモ / Key Notes

### vercel.jsonにoutputDirectoryが必須
```json
{
  "outputDirectory": ".",
  "routes": [...]
}
```

### Stripeのインスタンスは1つだけ
```javascript
var stripeInstance;
function initStripe() {
  stripeInstance = Stripe('pk_...');
}
if (!cardElement) initStripe();
```

### Privy API（2026年3月時点の正しい仕様）
```javascript
body: JSON.stringify({
  linked_accounts: [{ type: 'email', address: email }],
  create_ethereum_wallet: true,  // 正解
  // create_embedded_wallet: true  // 旧仕様（エラー）
})
```

### mint-nft.js はStripe metadataに書き戻す
管理画面でNFT発行状況・メールを正しく表示するため、
ミント後にPaymentIntent metadataを更新する：
```javascript
await stripe.paymentIntents.update(paymentId, {
  metadata: { txHash, walletAddress, tokenId, email }
});
```

---

## 開発URL / URLs

- **本番URL**: https://goshuin-ar-hounou.vercel.app
- **管理画面**: https://goshuin-ar-hounou.vercel.app/admin.html
- **特定商取引法**: https://goshuin-ar-hounou.vercel.app/legal.html
- **NFT確認ページ**: https://goshuin-ar-hounou.vercel.app/nft.html?tx=0x...
- **ベースAR**: https://github.com/Magatoki999/ar-goshuin-demo

---

## 応用可能な分野

- **寺院・神社** — 御朱印・巡礼証明（本プロジェクト）
- **美術館・博物館** — 鑑賞証明・企画展限定NFT
- **老舗・蔵元訪問** — 訪問証明・インボイスNFT
- **世界遺産・観光地** — 訪問パスポート・インバウンド向け
- **ライブ・コンサート** — 参加証明・アーティストへの投げ銭
- **伝統工芸・職人工房** — 作品購入証明・資格証明書
- **城郭・名所スタンプラリー** — 日本100名城デジタル版
- **自然・国立公園** — 入山証明・環境保全への寄付
- **大学・研究機関** — オープンキャンパス訪問証明
- **映画・アニメ聖地巡礼** — 聖地訪問証明・ファンコミュニティ
- **温泉・旅館** — 名湯制覇チャレンジ
- **競技場・スタジアム** — 試合観戦証明
- **茶道・武道の稽古場** — 段位取得証明書
- **空港・ランドマーク** — 訪日外国人向けデジタルパスポート

---

## 次のステップ / Next Steps

- [ ] Stripe本番審査申請
- [ ] Polygon zkEVMへの移行（ETH補充後）
- [ ] JPYC送金との統合
- [ ] 画像の動的生成（天気・時間帯・特定日に応じた自動生成）
- [ ] JPYC社への実証実験提案

---

*MAGATOKI Laboratory*
