const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js')
const fs = require('fs');

const axios = require('axios');



module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('scanning-list')
        .setDescription('List all developers being scanned in this channel.'),
    async execute(client, interaction) {
        let creators = JSON.parse(fs.readFileSync(__dirname.replace("commands", "") + 'db/creators.json', 'utf-8'));
        const creatorsList = creators.filter(creator => creator.channelIds.includes(interaction.channelId));
        if(creatorsList.length === 0){
            return interaction.reply({content: 'No developers are being scanned in this channel'})
        }
        let response = 'Scanner in <#'+ interaction.channelId +'>\n';
        creatorsList.forEach(creator => {
            response += '**' + creator.creatorName + '** (' + creator.creatorId + ') - ' + creator.creatorType + '\n'
        });
        return interaction.reply({content: response})
    }
}