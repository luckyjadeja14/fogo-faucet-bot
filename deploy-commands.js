// deploy-commands.js
const { REST, Routes } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder()
        .setName('faucet')
        .setDescription('Requests Fogo testnet tokens from the faucet.')
        .addStringOption(option =>
            option.setName('address')
                .setDescription('Your Fogo (Solana) wallet address')
                .setRequired(true)
        ) // Corrected placement
        .addStringOption(option =>
            option.setName('token')
                .setDescription('The type of token you want to receive.')
                .setRequired(true)
                .addChoices(
                    { name: 'FOGO (Native Gas Token)', value: 'fogo' },
                    { name: 'FUSD (Stablecoin)', value: 'fusd' },
                )
        ),
        
    new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Checks the remaining balance of the faucet wallet.'),

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        // The first argument is your bot's Client ID, not the token
        await rest.put(
            Routes.applicationCommands('1365974532489347102'), // Remember to put your real Client ID here
            { body: commands },
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();