# 🔐 ZK-Cert

**Private Certificate Issuance & Verification on Aleo (Testnet)**

> Prove everything. Reveal nothing.

[![Aleo](https://img.shields.io/badge/Aleo-Testnet-green)](https://aleo.org)
[![Leo](https://img.shields.io/badge/Leo-3.4.0-blue)](https://leo-lang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)

---

```
Use Puzzle wallet for now only !!
```

## Deployed Contract

- **Network:** Aleo Testnet
- **Program ID:** `zk_cert_main_9842.aleo`
- **Explorer API:** `https://api.explorer.provable.com/v1`
 
 
---

## What ZK-Cert Does

ZK-Cert is a privacy-first certificate system where:

- **Issuers (institutions)** issue certificates on-chain (Aleo program execution).
- **Holders (students/employees)** receive a **private `Certificate` record** in their wallet.
- **Verifiers (HR/companies)** verify certificate validity by checking **on-chain state** (revocation status) using the provided certificate ID.

### Why this matters

- PDF certificates are easy to forge.
- Traditional verification requires sharing personal documents.
- ZK-Cert uses Aleo’s privacy model so holders keep certificates private while verifiers can still confirm authenticity.

---

## App Roles & User Flows

### Issuer
1. Connect Puzzle Wallet → choose **Issuer**.
2. (One-time) Register issuer on-chain.
3. Issue certificate → the holder receives a private `Certificate` record.
4. Revoke certificate (if needed) → on-chain revocation is reflected in verification.

### Holder
1. Connect Puzzle Wallet → choose **Holder**.
2. The dashboard loads **real on-chain Certificate records** from your wallet.
3. Generate a verification payload (QR) and share it with a verifier.

### Verifier
1. Open **/verify**.
2. Paste payload / cert_id.
3. The UI queries Aleo program mappings and shows **Active / Revoked**.

---

## Tech Stack

- **Aleo + Leo** smart contract
- **Puzzle Wallet SDK** for wallet connection, record reading, and program execution
- **Next.js 15 + TypeScript + Tailwind + shadcn/ui** frontend

---

## Local Setup

### Prerequisites
- Node.js 18+
- Leo 3.4.0
- Puzzle Wallet browser extension
- Testnet credits for transaction fees

### Install & Run

```bash
# Install dependencies (uses legacy-peer-deps automatically via .npmrc)
npm install

# Start development server
npm run dev
```

**Note**: The project uses React 19, but wallet adapters require React 18. The `.npmrc` file automatically handles this with `legacy-peer-deps=true`.

Create `.env.local` (copy from `.env.local.example`):

```env
NEXT_PUBLIC_ZK_CERT_PROGRAM_ID=zk_cert_main_9842.aleo
NEXT_PUBLIC_ALEO_NETWORK=testnet
NEXT_PUBLIC_ALEO_RPC_URL=https://api.explorer.provable.com/v1
```

---

## Contract Overview

### Key on-chain data
- `certificates` mapping (`u64 => CertificateInfo`) stores:
  - issuer, holder, cert_hash, issue_date, cert_type, is_revoked
- Holder gets a private `Certificate` record in their wallet.

 

---

## Deployment

### Deploy contract (WSL)

```bash
./deploy-wsl.sh
```

Or using env var:

```bash
export PRIVATE_KEY="your_private_key"
bash deploy-contract.sh
```

After deployment, update:

- `.env.local` → `NEXT_PUBLIC_ZK_CERT_PROGRAM_ID=<your_new_program_id>`

---

## Notes

- The frontend contains **no dummy certificate data**:
  - Issuer dashboard reads issued executions from the wallet event history.
  - Holder dashboard reads real `Certificate` records from the wallet.
  - Verification reads the program mapping from the Aleo explorer API.

 
