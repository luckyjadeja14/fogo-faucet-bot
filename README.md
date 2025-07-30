# Fogo Testnet Discord Faucet Bot

A simple yet powerful Discord bot for dispensing Fogo testnet tokens to developers. This bot provides a reliable way for community members to get testnet funds every 24 hours, directly within Discord.

 <!-- Optional: Add a screenshot of the bot in action -->

## Features

-   **Slash Commands:** Modern and easy-to-use Discord commands (`/faucet`, `/balance`).
-   **24-Hour Cooldown:** Prevents abuse by limiting claims to one per Discord user every 24 hours.
-   **SVM/Solana Based:** Built using `@solana/web3.js` to interact with the Fogo SVM-based testnet.
-   **Balance Check:** Users can check the faucet's remaining balance at any time.
-   **Easy to Set Up:** Clone this repository and follow the simple setup steps below to get your own instance running.

---

## Prerequisites

Before you begin, ensure you have the following:

1.  **Node.js:** Version 16.9.0 or higher.
2.  **Discord Bot Token:** Create a bot application in the [Discord Developer Portal](https://discord.com/developers/applications).
3.  **Fogo Testnet Wallet:** A new Fogo/Solana wallet to act as the faucet's treasury. You will need its **private key**.
4.  **Fogo RPC URL:** The RPC endpoint for the Fogo testnet.
5.  **Initial Funding:** Your faucet wallet must be pre-funded with a large amount of Fogo testnet tokens.

---

## Setup Instructions

Follow these steps to set up and run your own instance of the faucet bot.

### 1. Clone the Repository

Clone this repository to your local machine or server.

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

2. Install Dependencies
Install the required npm packages.

```bash
npm install

3. Configure Environment Variables
Create a file named .env in the root of the project directory. This file will store your secret keys and configuration.

Do not share this file or commit it to source control.