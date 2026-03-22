# goshuin-ar-hounou

**次世代御朱印AR × 奉納決済 × インボイスNFT システム**

> 参拝者がブロックチェーンを一切意識せずに奉納・NFT受け取りができる、次世代型デジタル奉納プラットフォーム。
> ユーザーは円で払い、メールアドレスを入力するだけ。神社側はJPYCで受け取り、参拝記録はブロックチェーンに永久保存される。

---

## プロジェクト概要

[ar-goshuin-demo](https://github.com/Magatoki999/ar-goshuin-demo)（公開中の御朱印ARアプリ）をベースに、奉納決済・インボイスNFT発行・メール通知機能を追加した実証実験プラットフォーム。

### 実現した体験フロー

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

## 設計思想

### ユーザーはブロックチェーンを意識しない

| ユーザーが見るもの | 裏側で起きていること |
|---|---|
| 円で奉納 | Stripeで決済処理 |
| メールアドレスを入力 | Privyが自動でウォレット生成 |
| NFTが届いた | Polygon上にNFTがミント |
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

## 技術スタック

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

---

## ファイル構成

```
goshuin-ar-hounou/
├── index.html              # メインARアプリ（奉納UI・NFT受取UI組み込み済み）
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
    ├── mint-nft.js         # Privy + NFTミント + Resendメール送信
    ├── nft-info.js         # TXハッシュ → NFT情報取得
    ├── metadata.js         # NFTメタデータ動的生成
    └── check-wallet.js     # ウォレット残高確認（開発用）
```

---

## 環境変数（Vercel）

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

---

## 応用可能な分野

このプラットフォームの仕組みは「その場でしか体験できないことの証明」として以下に展開可能：

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

## 重要な実装メモ

### vercel.jsonにoutputDirectoryが必須
```json
{
  "outputDirectory": ".",
  "routes": [...]
}
```
指定しないとindex.htmlがVercelに公開されない。

### Stripeのインスタンスは1つだけ
```javascript
var stripeInstance;
function initStripe() {
  stripeInstance = Stripe('pk_...');
  // elementsもここで作成
}
// result-modal表示時に呼ぶ（DOM存在確認後）
if (!cardElement) initStripe();
```

### Privy API（2026年3月時点の正しい仕様）
```javascript
body: JSON.stringify({
  linked_accounts: [{ type: 'email', address: email }],
  create_ethereum_wallet: true,  // ← これが正解
  // create_embedded_wallet: true  ← 旧仕様（エラー）
})
```

---

## 開発URL

- **本番URL**: https://goshuin-ar-hounou.vercel.app
- **特定商取引法**: https://goshuin-ar-hounou.vercel.app/legal.html
- **NFT確認ページ**: https://goshuin-ar-hounou.vercel.app/nft.html?tx=0x...
- **ベースAR**: https://github.com/Magatoki999/ar-goshuin-demo

---

## 次のステップ

- [ ] Stripe本番審査申請
- [ ] Polygon zkEVMへの移行（ETH補充後）
- [ ] JPYC送金との統合
- [ ] 画像の動的生成（天気・時間帯・特定日に応じた自動生成）
- [ ] JPYC社への実証実験提案

---

*MAGATOKI Laboratory*
