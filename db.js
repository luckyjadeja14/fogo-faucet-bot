const Database = require('better-sqlite3');
const db = new Database('faucet.db');


db.exec(`
    CREATE TABLE IF NOT EXISTS claims (
        discord_id TEXT NOT NULL,
        token_type TEXT NOT NULL,
        last_claim INTEGER,
        PRIMARY KEY (discord_id, token_type)
    )
`);

const COOLDOWN_HOURS = 24;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;


function canUserClaim(discordId, tokenType) {
    const row = db.prepare('SELECT last_claim FROM claims WHERE discord_id = ? AND token_type = ?').get(discordId, tokenType);

    if (!row) {
        
        return { canClaim: true };
    }

    const lastClaimTime = row.last_claim;
    const nextClaimTime = lastClaimTime + COOLDOWN_MS;
    const currentTime = Date.now();

    if (currentTime >= nextClaimTime) {
        return { canClaim: true };
    } else {
        return { canClaim: false, nextClaimTime: nextClaimTime };
    }
}


function updateUserClaim(discordId, tokenType) {
    const now = Date.now();
    db.prepare('REPLACE INTO claims (discord_id, token_type, last_claim) VALUES (?, ?, ?)').run(discordId, tokenType, now);
}

module.exports = { canUserClaim, updateUserClaim, COOLDOWN_HOURS };