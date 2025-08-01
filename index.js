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


const FUSD_MINT_PUBKEY = new PublicKey(process.env.FUSD_MINT_ADDRESS);
const FOGOT_MINT_PUBKEY = new PublicKey(process.env.FOGOT_MINT_ADDRESS);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });


const connection = new Connection(process.env.FOGO_RPC_URL, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 15000, 
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

    if (interaction.commandName === 'faucet') {
        
    }

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
                console.log("Could not find FUSD token account, assuming balance is 0.");
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