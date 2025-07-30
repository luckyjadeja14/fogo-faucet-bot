## 🚀 Setup Instructions

Follow these steps to deploy your own instance of the **Fogo Faucet Discord Bot**.

---

### 1. Clone the Repository

Open your terminal or Shell and run:

```bash
git clone https://github.com/luckyjadeja14/fogo-faucet-bot.git
```

---

### 2. Enter the Project Directory

Navigate into the cloned folder:

```bash
cd fogo-faucet-bot
```

> ⚠️ This is a critical step. Make sure you’re inside the project directory before continuing.

---

### 3. Install Dependencies

Install the required Node.js packages:

```bash
npm install
```

---

### 4. Configure Environment Variables

Create a `.env` file in the root directory of the project and paste the following:

```env
# .env
DISCORD_TOKEN=YOUR_DISCORD_TOKEN
BOT_PRIVATE_KEY=[JSON Byte Array String]
FOGO_RPC_URL=https://testnet.fogo.io
```

Replace the placeholder values with your actual bot credentials and Fogo RPC URL.

---

### 5. Register Slash Commands with Discord

Before using the bot, you need to register its slash commands:

1. Open `deploy-commands.js`.
2. Locate this line:

```js
Routes.applicationCommands('YOUR_BOT_CLIENT_ID_HERE')
```

3. Replace `'YOUR_BOT_CLIENT_ID_HERE'` with your actual **Application (Client) ID** (found in the Discord Developer Portal → General Information).

Now run the script:

```bash
node deploy-commands.js
```

---

### 6. Start the Bot

Start the bot with:

```bash
node index.js
```

If everything is set up correctly, your terminal will display:

```
Bot is online!
```

Your bot is now live and ready to use in any server it has been invited to.

---
