// index.js
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js'); // NOTE: EmbedBuilder is added here
const { Connection, Keypair, SystemProgram, PublicKey, LAMPORTS_PER_SOL, sendAndConfirmTransaction, Transaction } = require('@solana/web3.js');
const { canUserClaim, updateUserClaim, COOLDOWN_HOURS } = require('./db.js');
require('dotenv').config();

// --- CONFIGURATION ---
const FAUCET_AMOUNT = 1; // Amount of FOGO to send
const FOGO_EXPLORER_URL = "https://explorer.fogo.io/tx/"; 

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Establish connection to the Fogo Testnet
const connection = new Connection(process.env.FOGO_RPC_URL, 'confirmed');

// Load the bot's wallet
let faucetWallet;
try {
    const secretKey = Uint8Array.from(JSON.parse(process.env.BOT_PRIVATE_KEY));
    faucetWallet = Keypair.fromSecretKey(secretKey);
    console.log("Faucet wallet loaded successfully.");
} catch (error) {
    console.error("ERROR: Could not load faucet wallet. Is BOT_PRIVATE_KEY in .env a valid Uint8Array string?");
    process.exit(1);
}

client.once('ready', () => {
    console.log(`Bot is online! Logged in as ${client.user.tag}`);
    console.log(`Faucet address: ${faucetWallet.publicKey.toBase58()}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    // =================================================================
    //  SLASH COMMAND: /faucet
    // =================================================================
    if (interaction.commandName === 'faucet') {
        const discordId = interaction.user.id;
        const userWalletAddress = interaction.options.getString('address');

        // 1. Defer Reply to avoid timeout
        await interaction.deferReply({ ephemeral: true });

        // 2. Validate Solana address
        let userPublicKey;
        try {
            userPublicKey = new PublicKey(userWalletAddress);
        } catch (error) {
            await interaction.editReply('❌ That does not look like a valid Fogo wallet address. Please check and try again.');
            return;
        }

        // 3. Check Cooldown
        const claimCheck = canUserClaim(discordId);
        if (!claimCheck.canClaim) {
            const timeLeft = Math.ceil((claimCheck.nextClaimTime - Date.now()) / (1000 * 60 * 60));
            await interaction.editReply(`❌ You have already claimed tokens recently. Please wait approximately ${timeLeft} more hour(s).`);
            return;
        }

        // 4. Perform the transaction
        try {
            console.log(`Attempting to send ${FAUCET_AMOUNT} FOGO to ${userWalletAddress}`);

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: faucetWallet.publicKey,
                    toPubkey: userPublicKey,
                    lamports: FAUCET_AMOUNT * LAMPORTS_PER_SOL
                })
            );

            const signature = await sendAndConfirmTransaction(connection, transaction, [faucetWallet]);

            // 5. Success: Update database and reply with a professional Embed
            updateUserClaim(discordId);

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00') // Green
                .setTitle('✅ Faucet Claim Successful')
                .setDescription(`Successfully sent **${FAUCET_AMOUNT} FOGO** to your wallet.`)
                .addFields(
                    { name: 'Recipient', value: `\`${userWalletAddress}\``, inline: true },
                    { name: 'Amount', value: `${FAUCET_AMOUNT} FOGO`, inline: true },
                    { name: 'Transaction', value: `[View on Explorer](${FOGO_EXPLORER_URL}${signature})` }
                )
                .setTimestamp()
                .setFooter({ text: 'Fogo Testnet Faucet' });
            
            await interaction.editReply({ embeds: [successEmbed] });
            console.log(`Success! Tx: ${signature}`);

        } catch (error) {
            console.error("Transaction failed:", error);
            // NEW: Better error handling
            if (error.message.includes("insufficient lamports")) {
                await interaction.editReply('⛔️ Oh no! The faucet is currently out of funds. Please ping an admin to get it refilled.');
            } else {
                await interaction.editReply('⛔️ An error occurred. The Fogo network might be busy or a different issue occurred. Please try again in a few minutes.');
            }
        }
    }

    // =================================================================
    //  SLASH COMMAND: /balance
    // =================================================================
    if (interaction.commandName === 'balance') {
        await interaction.deferReply();
        try {
            const balanceLamports = await connection.getBalance(faucetWallet.publicKey);
            const balanceFogo = balanceLamports / LAMPORTS_PER_SOL;

            const balanceEmbed = new EmbedBuilder()
                .setColor('#0099ff') // Blue
                .setTitle('💧 Faucet Balance')
                .setDescription(`The faucet wallet currently holds **${balanceFogo.toFixed(4)} FOGO**.`)
                .setTimestamp();
            
            await interaction.editReply({ embeds: [balanceEmbed] });

        } catch (error) {
            console.error("Failed to get balance:", error);
            await interaction.editReply('⛔️ Could not retrieve the faucet balance at this time.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
