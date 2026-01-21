# 🚀 ZK-Cert Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

**Note**: The project uses `.npmrc` with `legacy-peer-deps=true` to handle React version conflicts between React 19 (project) and React 18 (wallet adapters).

### 2. Configure Environment Variables

Copy the example file and fill in your values:

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local with your actual values
```

**Required Variables:**
```env
NEXT_PUBLIC_ZK_CERT_PROGRAM_ID=zk_cert_main.aleo
NEXT_PUBLIC_ALEO_NETWORK=testnet
NEXT_PUBLIC_ALEO_RPC_URL=https://api.explorer.provable.com/v1
```

**Optional Variables (for Pinata IPFS):**
```env
PINATA_API_KEY=your_key_here
PINATA_API_SECRET=your_secret_here
PINATA_JWT=your_jwt_here
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

---

## 🔒 Security Notes

### API Keys

- ⚠️ **Never commit `.env.local` to git** (already in `.gitignore`)
- ✅ Use `.env.local.example` as a template
- ✅ Rotate keys if accidentally exposed
- 📖 See `SECURITY.md` for more details

### Current Status

- ✅ `.env.local` is in `.gitignore` (safe)
- ✅ `.npmrc` handles dependency conflicts automatically
- ✅ All sensitive files are excluded from version control

---

## 🛠️ Troubleshooting

### npm install fails with peer dependency errors

**Solution**: The `.npmrc` file automatically uses `legacy-peer-deps=true`. If you still see errors:

```bash
npm install --legacy-peer-deps
```

### Wallet connection issues

1. Make sure wallet extensions are installed and unlocked
2. Check browser console for errors
3. Try refreshing the page
4. See wallet-specific connection fixes in the main README

### Build errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📦 Dependencies

### Key Dependencies
- **Next.js 15.5.7** - React framework
- **React 19** - UI library (with legacy-peer-deps for wallet adapters)
- **TypeScript 5** - Type safety
- **TailwindCSS 3.4** - Styling
- **Aleo Wallet Adapters** - Wallet integration (React 18 compatible)

### Wallet Support
- ✅ Puzzle Wallet (`@puzzlehq/sdk-core`)
- ✅ Leo Wallet (`@demox-labs/aleo-wallet-adapter-leo`)
- ✅ Fox Wallet (`@foxwallet/aleo-wallet-adapter-fox`)

---

## ✅ Verification

After setup, verify everything works:

1. ✅ `npm install` completes without errors
2. ✅ `npm run build` succeeds
3. ✅ `npm run dev` starts the server
4. ✅ Website loads at http://localhost:3000
5. ✅ Wallet connections work (install extensions first)

---

**Ready to go!** 🎉
