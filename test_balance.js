// test_balance.js
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
require('dotenv').config();

const RPC_URL = process.env.FOGO_RPC_URL;
const WALLET_TO_CHECK = 'CK1YcosC8YGFE2LZw2RXZjz1UpUiuz7HM2c3z1Rwbqh';

console.log(`--- Starting Balance Test ---`);
console.log(`Using RPC URL: ${RPC_URL}`);
console.log(`Checking balance for wallet: ${WALLET_TO_CHECK}`);

async function checkBalance() {
    try {
        const connection = new Connection(RPC_URL, 'confirmed');
        const publicKey = new PublicKey(WALLET_TO_CHECK);
        
        const balanceLamports = await connection.getBalance(publicKey);
        const balanceFogo = balanceLamports / LAMPORTS_PER_SOL;
        
        console.log(`--- TEST RESULT ---`);
        console.log(`The RPC at ${RPC_URL} reports a balance of: ${balanceFogo} FOGO`);

    } catch (error) {
        console.error('--- TEST FAILED ---');
        console.error('Could not connect to the RPC or get the balance.', error.message);
    }
}

checkBalance();