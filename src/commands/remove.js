const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');

const { admin, freepasscategory } = require('../db/settings.json') 

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a developer from scan.')
        .addSubcommand(a =>
            a
                .setName('user')
                .setDescription('Remove a user developer from scan.')
                .addStringOption(option =>
                    option.setName('id')
                        .setDescription('Roblox id of the user developer.')
                        .setRequired(true)
                )
        )
        
        .addSubcommand(a =>
            a
                .setName('group')
                .setDescription('Remove a group developer from scan.')
                .addStringOption(option =>
                    option.setName('id')
                        .setDescription('Roblox id of the group developer.')
                        .setRequired(true)
                )
        ),
    async execute(client, interaction) {
        let accessList = JSON.parse(fs.readFileSync(__dirname.replace("commands", "") + 'db/accesslist.json', 'utf-8'));
        
        const category = interaction.guild.channels.cache.get(interaction.channelId).parent
        if (!admin.includes(interaction.user.id) && !freepasscategory.includes(category.id) && !accessList[interaction.guildId].includes(interaction.user.id)){
            return interaction.reply({ content: '**FAIL:** you do not have permission to use this command', ephemeral: true})
        }
        let creators = JSON.parse(fs.readFileSync(__dirname.replace("commands", "") + 'db/creators.json', 'utf-8'));
        const subcommand = interaction.options.getSubcommand();
        if(subcommand === 'user'){
            const id = interaction.options.getString('id');
            const channelId = interaction.channelId;
            const creator = creators.find(creator => creator.creatorId === id && creator.creatorType === "User" && creator.channelIds.includes(channelId));
            if (!creator) {
                return interaction.reply({content: '**FAIL:** user not found in this channel'})
            }
            const newcreators = creators.map(creator => {
                if (creator.creatorId === id && creator.creatorType === "User" && creator.channelIds.includes(channelId)) {
                    return {
                        ...creator,
                        channelIds: creator.channelIds.filter(channelId => channelId !== channelId)
                    }
                }
                return creator;
            });
            fs.writeFileSync(__dirname.replace("commands", "") + 'db/creators.json', JSON.stringify(newcreators), 'utf-8', (err) => {
                if (err) {
                    console.log(err);
                }
            });
            return interaction.reply({content: '**SUCCESS:** user removed from scan in this channel'})
        } else if(subcommand === 'group'){
            const id = interaction.options.getString('id');
            const channelId = interaction.channelId;
            const creator = creators.find(creator => creator.creatorId === id && creator.creatorType === "Group" && creator.channelIds.includes(channelId));
            if (!creator) {
                return interaction.reply({content: '**FAIL:** group not found in this channel'})
            }
            const newcreators = creators.map(creator => {
                if (creator.creatorId === id && creator.creatorType === "Group" && creator.channelIds.includes(channelId)) {
                    return {
                        ...creator,
                        channelIds: creator.channelIds.filter(channelId => channelId !== channelId)
                    }
                }
                return creator;
            });
            fs.writeFileSync(__dirname.replace("commands", "") + 'db/creators.json', JSON.stringify(newcreators), 'utf-8', (err) => {
                if (err) {
                    console.log(err);
                }
            });
            return interaction.reply({content: '**SUCCESS:** group removed from scan in this channel'})
        }
    }
}
