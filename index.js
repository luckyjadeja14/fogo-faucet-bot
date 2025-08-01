// index.js
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { Connection, Keypair, SystemProgram, PublicKey, LAMPORTS_PER_SOL, sendAndConfirmTransaction, Transaction } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, createTransferInstruction, getAssociatedTokenAddress, getAccount } = require('@solana/spl-token');
const { canUserClaim, updateUserClaim, COOLDOWN_HOURS } = require('./db.js');
require('dotenv').config();

// --- CONFIGURATION ---
const FAUCET_FOGO_AMOUNT = 1;
const FAUCET_FUSD_AMOUNT = 10;
const FAUCET_FOGOT_AMOUNT = 100;
const FUSD_DECIMALS = 6;
const FOGOT_DECIMALS = 9;
const FOGO_EXPLORER_URL = "https://explorer.fogo.io/tx/";

// --- MINT ADDRESSES ---
const FUSD_MINT_PUBKEY = new PublicKey(process.env.FUSD_MINT_ADDRESS);
const FOGOT_MINT_PUBKEY = new PublicKey(process.env.FOGOT_MINT_ADDRESS);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const connection = new Connection(process.env.FOGO_RPC_URL, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 15000, // 15 seconds
});

let faucetWallet;
try {
    const secretKey = Uint8Array.from(JSON.parse(process.env.BOT_PRIVATE_KEY));
    faucetWallet = Keypair.fromSecretKey(secretKey);
    console.log("Faucet wallet loaded successfully.");
} catch (error) {
    console.error("ERROR: Could not load faucet wallet.", error);
    process.exit(1);
}

client.once('ready', () => {
    console.log(`Bot is online! Logged in as ${client.user.tag}`);
    console.log(`Faucet address: ${faucetWallet.publicKey.toBase58()}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    // --- FAUCET COMMAND HANDLER ---
    if (interaction.commandName === 'faucet') {
        console.log(`Received /faucet command from ${interaction.user.tag}`);
        const discordId = interaction.user.id;
        const userWalletAddress = interaction.options.getString('address');
        const tokenChoice = interaction.options.getString('token');

        await interaction.deferReply({ ephemeral: true });

        let userPublicKey;
        try { userPublicKey = new PublicKey(userWalletAddress); }
        catch (error) { await interaction.editReply('❌ That does not look like a valid Fogo wallet address.'); return; }
        
        const claimCheck = canUserClaim(discordId, tokenChoice);
        if (!claimCheck.canClaim) {
            const timeLeft = Math.ceil((claimCheck.nextClaimTime - Date.now()) / (1000 * 60 * 60));
            await interaction.editReply(`❌ You have already claimed ${tokenChoice.toUpperCase()} recently. Please wait approximately ${timeLeft} more hour(s).`);
            return;
        }

        try {
            const transaction = new Transaction();
            let amountToSend, tokenName;

            if (tokenChoice === 'fogo') {
                amountToSend = FAUCET_FOGO_AMOUNT; tokenName = 'FOGO (Native)';
                transaction.add(SystemProgram.transfer({ fromPubkey: faucetWallet.publicKey, toPubkey: userPublicKey, lamports: amountToSend * LAMPORTS_PER_SOL }));
            } else if (tokenChoice === 'fusd') {
                amountToSend = FAUCET_FUSD_AMOUNT; tokenName = 'FUSD';
                const fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, faucetWallet, FUSD_MINT_PUBKEY, faucetWallet.publicKey);
                const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, faucetWallet, FUSD_MINT_PUBKEY, userPublicKey);
                transaction.add(createTransferInstruction(fromTokenAccount.address, toTokenAccount.address, faucetWallet.publicKey, amountToSend * (10 ** FUSD_DECIMALS)));
            } else if (tokenChoice === 'fogot') {
                amountToSend = FAUCET_FOGOT_AMOUNT; tokenName = 'FOGO (Utility Token)';
                const fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, faucetWallet, FOGOT_MINT_PUBKEY, faucetWallet.publicKey);
                const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, faucetWallet, FOGOT_MINT_PUBKEY, userPublicKey);
                transaction.add(createTransferInstruction(fromTokenAccount.address, toTokenAccount.address, faucetWallet.publicKey, amountToSend * (10 ** FOGOT_DECIMALS)));
            }

            const signature = await sendAndConfirmTransaction(connection, transaction, [faucetWallet]);
            updateUserClaim(discordId, tokenChoice);
            
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
            await interaction.editReply('⛔️ An error occurred. The Fogo network may be busy, the faucet may be out of funds, or a token mint address is incorrect.');
        }
    }

    // --- BALANCE COMMAND HANDLER ---
    if (interaction.commandName === 'balance') {
        console.log(`Received /balance command from ${interaction.user.tag}`);
        await interaction.deferReply();

        try {
            const balanceLamports = await connection.getBalance(faucetWallet.publicKey);
            const balanceFogo = balanceLamports / LAMPORTS_PER_SOL;

            let fusdBalance = 0;
            try {
                const fusdTokenAccountAddress = await getAssociatedTokenAddress(FUSD_MINT_PUBKEY, faucetWallet.publicKey);
                const fusdTokenAccountInfo = await getAccount(connection, fusdTokenAccountAddress);
                fusdBalance = Number(fusdTokenAccountInfo.amount) / (10 ** FUSD_DECIMALS);
            } catch (e) {
                console.log("Could not find FUSD token account,, assuming balance is 0.");
            }

            let fogotBalance = 0;
            try {
                const fogotTokenAccountAddress = await getAssociatedTokenAddress(FOGOT_MINT_PUBKEY, faucetWallet.publicKey);
                const fogotTokenAccountInfo = await getAccount(connection, fogotTokenAccountAddress);
                fogotBalance = Number(fogotTokenAccountInfo.amount) / (10 ** FOGOT_DECIMALS);
            } catch (e) {
                console.log("Could not find FOGO Utility Token account, assuming balance is 0.");
            }

            const balanceEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('💧 Faucet Balances')
                // THIS LINE IS NOW CORRECTED
                .setDescription(`Current token balances for the faucet wallet: \`${faucetWallet.publicKey.toBase58()}\``)
                .addFields(
                    { name: 'FOGO (Native)', value: `**${balanceFogo.toFixed(4)}**`, inline: true },
                    { name: 'FUSD', value: `**${fusdBalance.toFixed(2)}**`, inline: true },
                    { name: 'FOGO (Utility)', value: `**${fogotBalance.toFixed(2)}**`, inline: true }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [balanceEmbed] });
            console.log("Successfully replied with all balances.");

        } catch (error) {
            console.error("Failed to get balances:", error);
            if (error.message && error.message.toLowerCase().includes("timed out")) {
                await interaction.editReply('⏳ The Fogo network (RPC) is not responding. Please try again in a few moments.');
            } else {
                await interaction.editReply('⛔️ Could not retrieve faucet balances. The Fogo RPC node may be down or an unknown error occurred.');
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);