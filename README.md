# goshuin-ar-hounou

**Next-generation Goshuin AR × Offering Payment × Invoice NFT System**

> A next-generation digital offering platform where visitors can make offerings and receive NFTs without any blockchain knowledge.
> Users pay in yen and enter only their email address. The shrine receives JPYC, and visit records are permanently stored on the blockchain.

---

## Project Overview

Based on [ar-goshuin-demo](https://github.com/Magatoki999/ar-goshuin-demo), this platform adds offering payments, invoice NFT issuance, admin dashboard, and email notification features.

### User Flow

```
Visitor points smartphone at bookmark (hasami-gami)
    ↓
AR display: Tobiume plum and origami cranes appear
    ↓
Capture proof of visit (weather / time of day / omikuji auto-reflected)
    ↓
"Bind the bond" — select offering amount in yen
    ↓
Pay by card / Apple Pay / Google Pay
    ↓
Offering complete + proof ID issued
    ↓
Enter email address only (no wallet required)
    ↓
Privy automatically generates a wallet
    ↓
Invoice NFT is issued
    ↓
Email notification from noreply@magatokilab.com
    ↓
View NFT image and visit record on dedicated page
```

---

## Design Philosophy

### Users are not aware of the blockchain

| What the user sees | What happens behind the scenes |
|---|---|
| Offering in yen | Payment processed by Stripe |
| Enter email address | Privy automatically creates a wallet |
| NFT arrived | NFT minted on Sepolia (→ Polygon zkEVM planned) |
| View commemorative item | Fetch metadata from IPFS |

### Road to zero fees

```
Current (Phase 1)
Visitor → Stripe (3.6% fee) → Shrine

Goal (Phase 3)
Visitor → JPYC direct transfer (near-zero fee) → Shrine
Only the shrine needs a JPYC wallet
```

---

## Tech Stack

| Category | Technology |
|---|---|
| AR | MindAR 1.2.2 + A-Frame 1.4.2 |
| Hosting | Vercel (Hobby Plan) |
| Payment | Stripe (Card / Apple Pay / Google Pay) |
| Webhook | Stripe Webhooks |
| Wallet | Privy (Embedded Wallet) |
| NFT | ERC-721 (GoshuinInvoiceNFT) |
| Blockchain | Sepolia Testnet → Polygon zkEVM (planned) |
| Metadata | IPFS (Pinata) + dynamic generation API |
| Email | Resend |
| Sender domain | noreply@magatokilab.com |
| Admin | Password auth + HMAC token |

---

## File Structure

```
goshuin-ar-hounou/
├── index.html              # Main AR app (offering UI + NFT receive UI)
├── admin.html              # Admin dashboard
├── legal.html              # Specified Commercial Transactions Act
├── nft.html                # NFT confirmation page (linked from email)
├── sw.js                   # Service Worker
├── vercel.json             # Vercel config (outputDirectory: "." required)
├── targets.mind            # MindAR image recognition target
├── ume_petal.png           # Plum petal texture
├── kamon.png               # Family crest texture
├── ink_aura.png            # Ink aura texture
├── oritsuru_merrygoround.glb # Origami crane 3D model
├── tenmangu_ambient.mp3    # Ambient sound
├── package.json
└── api/
    ├── create-payment.js   # Stripe Payment Intent creation
    ├── webhook.js          # Stripe Webhook receiver
    ├── mint-nft.js         # Privy + NFT mint + Resend email + Stripe metadata update
    ├── nft-info.js         # TX hash → NFT info
    ├── metadata.js         # NFT metadata dynamic generation
    ├── check-wallet.js     # Wallet balance check (dev)
    ├── admin-auth.js       # Admin password auth + HMAC token
    ├── admin-stats.js      # Stripe aggregation + listing
    ├── admin-chain.js      # ETH balance + NFT detail (ethers.js)
    ├── admin-resend.js     # Email resend via Resend
    └── _verify.js          # Token verification (shared module)
```

---

## Environment Variables (Vercel)

| KEY | Description |
|---|---|
| STRIPE_SECRET_KEY | Stripe secret key |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe publishable key |
| STRIPE_WEBHOOK_SECRET | Stripe Webhook signing secret |
| PRIVY_APP_ID | Privy app ID |
| PRIVY_SECRET_KEY | Privy secret key |
| SEPOLIA_RPC_URL | Alchemy Sepolia RPC URL |
| PRIVATE_KEY | Deploy-only wallet private key (goshuin-dev) |
| RESEND_API_KEY | Resend API key |
| ADMIN_PASSWORD | Admin dashboard password |
| ADMIN_TOKEN_SECRET | HMAC signing secret (random 32+ chars) |

---

## Admin Dashboard

Access: `https://goshuin-ar-hounou.vercel.app/admin.html`

| Tab | Features |
|---|---|
| Overview | KPI cards / daily revenue chart / amount distribution / recent offerings |
| Offerings | Full Stripe list / search / filter / detail modal |
| NFT | Minted / unminted list / email resend |
| Header | goshuin-dev ETH balance alert (3 levels) |

### ETH Balance Alert Levels

| Balance | Display |
|---|---|
| 0.1 ETH or more | Gray — normal |
| 0.05–0.1 ETH | Gold — warning |
| Below 0.05 ETH | Red blinking — critical |

---

## Key Implementation Notes

### vercel.json outputDirectory is required
```json
{
  "outputDirectory": ".",
  "routes": [...]
}
```

### Single Stripe instance
```javascript
var stripeInstance;
function initStripe() {
  stripeInstance = Stripe('pk_...');
}
if (!cardElement) initStripe();
```

### Privy API (correct spec as of March 2026)
```javascript
body: JSON.stringify({
  linked_accounts: [{ type: 'email', address: email }],
  create_ethereum_wallet: true,  // correct
  // create_embedded_wallet: true  // old spec (error)
})
```

### mint-nft.js writes back to Stripe metadata
After minting, the following are saved to PaymentIntent metadata
so the admin dashboard can display them correctly:
```javascript
await stripe.paymentIntents.update(paymentId, {
  metadata: { txHash, walletAddress, tokenId, email }
});
```

---

## URLs

- **Production**: https://goshuin-ar-hounou.vercel.app
- **Admin**: https://goshuin-ar-hounou.vercel.app/admin.html
- **Legal**: https://goshuin-ar-hounou.vercel.app/legal.html
- **NFT page**: https://goshuin-ar-hounou.vercel.app/nft.html?tx=0x...
- **Base AR**: https://github.com/Magatoki999/ar-goshuin-demo

---

## Contract

| Item | Value |
|---|---|
| Contract name | GoshuinInvoiceNFT (GoshuinNFT.sol) |
| Symbol | GOIN |
| Sepolia address | 0x3A637bD5a5Ff49667Ff279BDa263c9118e7b2a03 |
| Owner | 0x0a4a4F7F8D69Af17F8Dc69cadeBc5eD1B2e90716 (goshuin-dev) |
| Target chain | Polygon zkEVM (planned) |

---

## Next Steps

- [ ] Stripe production review application
- [ ] Migration to Polygon zkEVM (after ETH top-up)
- [ ] JPYC transfer integration
- [ ] Dynamic image generation (weather / time / special dates)
- [ ] Proof of concept proposal to JPYC

---

*MAGATOKI Laboratory*
