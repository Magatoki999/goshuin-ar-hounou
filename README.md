# goshuin-ar-hounou

**御朱印AR × 奉納決済システム — 実証実験版**

> 参拝者がブロックチェーンを意識せずに奉納できる、次世代御朱印ARアプリのプロトタイプ。  
> ユーザーは円建てで決済するだけ。神社側の受取はJPYC（日本円ステーブルコイン）で記録される。

---

## 概要

[goshuin-ar](https://github.com/magatoki/goshuin-ar)（公開中の御朱印ARアプリ）をベースに、奉納決済機能を追加した実験的ブランチ。

| 項目 | 内容 |
|---|---|
| ベース | MindAR + A-Frame による画像認識AR |
| 追加機能 | 奉納UI（金額選択・決済方法選択・完了画面） |
| 決済（予定） | Stripe（クレカ / Apple Pay / Google Pay / PayPay） |
| 受取（予定） | JPYC on Polygon |
| 現在の状態 | **モック実装**（実決済なし） |

---

## ユーザー体験の設計方針

参拝者は「ブロックチェーン」「JPYC」「ウォレット」を一切意識しない。

```
ARで参拝証をキャプチャ
    ↓
「ご縁を結ぶ」— 金額を選ぶ（¥100〜¥10,000）
    ↓
カード / Apple Pay / Google Pay / PayPay で決済
    ↓
奉納完了 + 証明ID発行
         ↓（ユーザーには見えない）
神社ウォレットへ JPYC 着金（Polygon上に記録）
```

---

## ファイル構成

```
goshuin-ar-hounou/
├── index_hounou.html     # メインアプリ（奉納UI組み込み済み）
├── targets.mind          # MindAR 画像認識ターゲット
├── ume_petal.png         # 梅花びらテクスチャ
├── kamon.png             # 家紋テクスチャ
├── ink_aura.png          # 墨アウラテクスチャ
├── oritsuru_merrygoround.glb  # 折り鶴3Dモデル
├── tenmangu_ambient.mp3  # 環境音
├── sw.js                 # Service Worker
└── README.md
```

---

## 現在の実装状態（モック）

`doHounou()` 関数内が `setTimeout` によるモック実装。  
実決済・実送金は発生しない。

```javascript
// index_hounou.html: 907行目付近
function doHounou() {
  // ★ ここをStripe Payment Intent APIの呼び出しに差し替える
  setTimeout(() => {
    // モック: 2秒後に完了演出
  }, 2000);
}
```

---

## 本番化ロードマップ

### Step 1 — Stripe 連携（フロントエンド）
- [ ] Stripe publishable key を設定
- [ ] `doHounou()` を Stripe Payment Intent API 呼び出しに変更
- [ ] カード入力UIは Stripe Elements で実装

### Step 2 — バックエンド実装
- [ ] Stripe Webhook エンドポイント（`/webhook/stripe`）を構築
- [ ] 決済完了 → JPYC送金キューへ登録

### Step 3 — JPYC 送金
- [ ] 神社ウォレットアドレスを設定
- [ ] JPYC コントラクト（Polygon）への送金処理
  - `0x431D5dfF03120AFA4bDf332c61A6e1766eF37BF6`（JPYC on Polygon）
- [ ] TX IDをDBに保存・フロントへ返却

### Step 4 — 管理ダッシュボード
- [ ] JPYC残高・取引履歴の表示（現在はモックデータ）
- [ ] Polygonscan へのリンク（誰でも確認できる透明性）

### Step 5 — JPYC Pay 加盟店登録（オプション）
- [ ] JPYC社への加盟店申請
- [ ] 円→JPYC 自動変換APIの連携

---

## 関連リポジトリ

- [ar-goshuin-demo](https://github.com/magatoki/ar-goshuin-demo) — ベースとなる御朱印ARアプリ（公開中）

---

## 技術スタック

- [MindAR](https://hiukim.github.io/mind-ar-js-doc/) 1.2.2
- [A-Frame](https://aframe.io/) 1.4.2
- [Stripe](https://stripe.com/jp)（予定）
- [JPYC](https://jpyc.jp/) on Polygon（予定）
- [ethers.js](https://docs.ethers.org/)（予定）

---

## License

MIT

---

*MAGATOKI Laboratory*
