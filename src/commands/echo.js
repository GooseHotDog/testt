const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js')
const fs = require('fs');

const axios = require('axios');


const { admin, freepasscategory } = require('../db/settings.json')

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('echo')
        .setDescription('Echo your input.')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('The input to echo back.')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to echo in.')
                .setRequired(false)
        ),
    async execute(client, interaction) {
        if (!admin.includes(interaction.user.id)) {
            return interaction.reply({ content: '**FAIL:** you are not allowed to use this commands.\nRequired permission: `Bot Admin`', ephemeral: true})
        }
        const input = interaction.options.getString('input');
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        const logChannel = await client.channels.fetch('1258132949963116564');
        logChannel.send({ content: 'Echo command used by ' + interaction.user.username + ' in <#' + interaction.channelId + '>\n```'+input+'```' })

        channel.send({ content: input });

        return interaction.reply({ content: input, ephemeral: true})
    }
}