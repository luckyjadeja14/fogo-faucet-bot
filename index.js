// index.js
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { Connection, Keypair, SystemProgram, PublicKey, LAMPORTS_PER_SOL, sendAndConfirmTransaction, Transaction } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, createTransferInstruction } = require('@solana/spl-token');
const { canUserClaim, updateUserClaim, COOLDOWN_HOURS } = require('./db.js');
require('dotenv').config();

// --- CONFIGURATION ---
const FAUCET_FOGO_AMOUNT = 1;     // Amount of native FOGO to send
const FAUCET_FUSD_AMOUNT = 10;    // Amount of FUSD to send
const FAUCET_FOGOT_AMOUNT = 1;  // NEW: Amount of "Fogo Token" to send

const FUSD_DECIMALS = 6;          // IMPORTANT: Verify the number of decimals FUSD has
const FOGOT_DECIMALS = 9;         // NEW & IMPORTANT: Verify the number of decimals the new token has

const FOGO_EXPLORER_URL = "https://explorer.fogo.io/tx/";

// --- MINT ADDRESSES ---
const FUSD_MINT_PUBKEY = new PublicKey(process.env.FUSD_MINT_ADDRESS);
const FOGOT_MINT_PUBKEY = new PublicKey(process.env.FOGOT_MINT_ADDRESS); // NEW

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const connection = new Connection(process.env.FOGO_RPC_URL, 'confirmed');

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

    if (interaction.commandName === 'faucet') {
        console.log(`Received /faucet command from ${interaction.user.tag}`);

        const discordId = interaction.user.id;
        const userWalletAddress = interaction.options.getString('address');
        const tokenChoice = interaction.options.getString('token');

        await interaction.deferReply({ ephemeral: true });

        let userPublicKey;
        try { userPublicKey = new PublicKey(userWalletAddress); }
        catch (error) { await interaction.editReply('❌ That does not look like a valid Fogo wallet address.'); return; }

        const claimCheck = canUserClaim(discordId);
        if (!claimCheck.canClaim) {
            const timeLeft = Math.ceil((claimCheck.nextClaimTime - Date.now()) / (1000 * 60 * 60));
            await interaction.editReply(`❌ You have already claimed tokens recently. Please wait approximately ${timeLeft} more hour(s).`);
            return;
        }

        try {
            const transaction = new Transaction();
            let amountToSend, tokenName;

            // NATIVE FOGO LOGIC
            if (tokenChoice === 'fogo') {
                amountToSend = FAUCET_FOGO_AMOUNT;
                tokenName = 'FOGO (Native)';
                console.log(`Attempting to send ${amountToSend} ${tokenName} to ${userWalletAddress}`);
                transaction.add(SystemProgram.transfer({ fromPubkey: faucetWallet.publicKey, toPubkey: userPublicKey, lamports: amountToSend * LAMPORTS_PER_SOL }));
            }
            // FUSD LOGIC
            else if (tokenChoice === 'fusd') {
                amountToSend = FAUCET_FUSD_AMOUNT;
                tokenName = 'FUSD';
                console.log(`Attempting to send ${amountToSend} ${tokenName} to ${userWalletAddress}`);
                const fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, faucetWallet, FUSD_MINT_PUBKEY, faucetWallet.publicKey);
                const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, faucetWallet, FUSD_MINT_PUBKEY, userPublicKey);
                transaction.add(createTransferInstruction(fromTokenAccount.address, toTokenAccount.address, faucetWallet.publicKey, amountToSend * (10 ** FUSD_DECIMALS)));
            }
            // NEW LOGIC FOR THE THIRD TOKEN ("FOGO TOKEN")
            else if (tokenChoice === 'fogot') {
                amountToSend = FAUCET_FOGOT_AMOUNT;
                tokenName = 'FOGO (Utility Token)';
                console.log(`Attempting to send ${amountToSend} ${tokenName} to ${userWalletAddress}`);
                const fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, faucetWallet, FOGOT_MINT_PUBKEY, faucetWallet.publicKey);
                const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, faucetWallet, FOGOT_MINT_PUBKEY, userPublicKey);
                transaction.add(createTransferInstruction(fromTokenAccount.address, toTokenAccount.address, faucetWallet.publicKey, amountToSend * (10 ** FOGOT_DECIMALS)));
            }

            // This part works for all token types
            const signature = await sendAndConfirmTransaction(connection, transaction, [faucetWallet]);

            updateUserClaim(discordId);
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Faucet Claim Successful')
                .setDescription(`Successfully sent **${amountToSend} ${tokenName}** to your wallet.`)
                .addFields({ name: 'Transaction', value: `[View on Explorer](${FOGO_EXPLORER_URL}${signature})` })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [successEmbed] });
            console.log(`Success! Sent ${amountToSend} ${tokenName}. Tx: ${signature}`);

        } catch (error) {
            console.error("Transaction failed:", error);
            await interaction.editReply('⛔️ An error occurred. The Fogo network may be busy, the faucet may be out of funds for the selected token, or a token mint address is incorrect.');
        }
    }

    if (interaction.commandName === 'balance') {
        console.log(`Received /balance command from ${interaction.user.tag}`);
        await interaction.deferReply();
        try {
            const balanceLamports = await connection.getBalance(faucetWallet.publicKey);
            const balanceFogo = balanceLamports / LAMPORTS_PER_SOL;

            const balanceEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('💧 Faucet Balance')
                .setDescription(`The faucet wallet currently holds **${balanceFogo.toFixed(4)} FOGO**.`)
                .setTimestamp();
            await interaction.editReply({ embeds: [balanceEmbed] });
            console.log("Successfully replied with balance.");

        } catch (error) {
            console.error("Failed to get balance:", error);
            await interaction.editReply('⛔️ Could not retrieve the faucet balance. The Fogo RPC node may be down.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);