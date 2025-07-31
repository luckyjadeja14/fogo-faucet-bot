# 🚰 Fogo Multi-Token Discord Faucet Bot

A powerful and user-friendly Discord bot that allows users to claim Fogo testnet tokens, including FOGO, FUSD, and other SPL tokens via modern slash commands.

---

## ✨ Features

- 🔁 **Multi-Token Support**: Dispenses native **FOGO**, **FUSD**, and other SPL tokens.
- 💬 **Slash Commands**: Clean, easy-to-use Discord interactions (`/faucet`, `/balance`).
- ⏱️ **24h Cooldown**: Limits token claims to once every 24 hours per user (via SQLite).
- ⚙️ **Solana SVM-Powered**: Built with `@solana/web3.js` and `@solana/spl-token`.
- 🚀 **Quick Setup**: Deploy from scratch in a few minutes.

---

## 🛠️ Setup Instructions

### 1. Prerequisites

Ensure the following:

- **Node.js** v16.9.0 or higher.
- **Discord Bot**: Create one via the [Discord Developer Portal](https://discord.com/developers/applications).
- **New Faucet Wallet**: Create a Solana/Fogo wallet.
- **Funding Required**:
  - 0.5+ FOGO (for fees)
  - Desired SPL tokens (e.g., FUSD, FOGOT)
- **Token Mint Addresses**: Know the mints for each SPL token.

---

### 2. Clone the Repository

```bash
git clone https://github.com/luckyjade14/fogo-faucet-bot.git
cd fogo-faucet-bot
```

---

### 3. Install Dependencies

```bash
npm install
```

---

### 4. Configure Secrets

Create a `.env` file in the root directory and add:

```env
DISCORD_TOKEN=your-discord-bot-token
BOT_PRIVATE_KEY=[your-faucet-private-key-in-json-array]
FOGO_RPC_URL=https://fogo-testnet.rpc.url
FUSD_MINT_ADDRESS=fusd-mint-address
FOGOT_MINT_ADDRESS=fogot-mint-address
```

> ⚠️ `BOT_PRIVATE_KEY` must be in **JSON Byte Array format**, like:
> ```json
> [25, 3, 87, ...]
> ```

---

### 5. Register Slash Commands

Edit `deploy-commands.js` and replace:

```js
Routes.applicationCommands('YOUR_BOT_CLIENT_ID_HERE')
```

With your bot's actual **Client ID**, then run:

```bash
node deploy-commands.js
```

---

### 6. Start the Bot

```bash
node index.js
```

🎉 Your bot is now live and operational!

---

## 📘 Bot Commands

| Command | Description |
|--------|-------------|
| `/faucet address:<your-fogo-wallet> token:<token_type>` | Claim test tokens (FOGO, FUSD, FOGOT). |
| `/balance` | Check remaining FOGO in the faucet wallet. |

---

## 🙌 Contributing & License

PRs are welcome. Open issues for suggestions or bugs.