const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js')
const fs = require('fs');

const axios = require('axios');

const { admin, freepasscategory } = require('../db/settings.json') 

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a developer to scan.')
        .addSubcommand(a =>
            a
                .setName('user')
                .setDescription('Add a user developer to scan.')
                .addStringOption(option =>
                    option.setName('id')
                        .setDescription('Roblox id of the user developer.')
                        .setRequired(true)
                )
        )

        .addSubcommand(a =>
            a
                .setName('group')
                .setDescription('Add a group developer to scan.')
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
        if (subcommand === 'user') {
            const id = interaction.options.getString('id');
            try {
                const user = await axios.get(`https://users.roblox.com/v1/users/${id}`);
                if (user.status === 200) {
                    const userData = user.data;
                    const userExists = creators.find(creator => creator.creatorId === id && creator.creatorType === "User" && creator.channelIds.includes(interaction.channelId));
                    if (userExists) {
                        return interaction.reply({ content: '**FAIL:** user **' + userData.name + '** is already being scanned in this channel' })
                    }
                    const userExistsInAnotherChannel = creators.find(creator => creator.creatorId === id && creator.creatorType === "User");
                    if (userExistsInAnotherChannel) {
                        creators.find(creator => creator.creatorId === id && creator.creatorType === "User").channelIds.push(interaction.channelId);
                    } else {
                        creators.push({
                            creatorId: id,
                            creatorType: "User",
                            creatorName: userData.name,
                            channelIds: [interaction.channelId],
                            addedBy: interaction.user.id
                        });
                    }

                    fs.writeFileSync(__dirname.replace("commands", "") + 'db/creators.json', JSON.stringify(creators), 'utf-8', (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                    return interaction.reply({ content: '**SUCCESS:** user **' + userData.name + '** added to scan in this channel' })
                } else {
                    return interaction.reply({ content: '**FAIL:** user with id **' + id + '** not found' })
                }
            } catch (err) {
                return interaction.reply({ content: '**FAIL:** user with id **' + id + '** not found' })
            }
        } else if (subcommand === 'group') {
            const id = interaction.options.getString('id');
            try {
                const group = await axios.get(`https://groups.roblox.com/v1/groups/${id}`);

                if (group.status === 200) {
                    const groupData = group.data;
                    const groupExists = creators.find(creator => creator.creatorId === id && creator.creatorType === "Group" && creator.channelIds.includes(interaction.channelId));
                    if (groupExists) {
                        return interaction.reply({ content: '**FAIL:** group **' + groupData.name + '** is already being scanned in this channel' })
                    }
                    const groupExistsInAnotherChannel = creators.find(creator => creator.creatorId === id && creator.creatorType === "Group");
                    if (groupExistsInAnotherChannel) {
                        creators.find(creator => creator.creatorId === id && creator.creatorType === "Group").channelIds.push(interaction.channelId);
                    } else {
                        creators.push({
                            creatorId: id,
                            creatorType: "Group",
                            creatorName: groupData.name,
                            channelIds: [interaction.channelId],
                            addedBy: interaction.user.id
                        });
                    }
                    fs.writeFileSync(__dirname.replace("commands", "") + 'db/creators.json', JSON.stringify(creators), 'utf-8', (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                    return interaction.reply({ content: '**SUCCESS:** group **' + groupData.name + '** added to scan in this channel' })
                } else {
                    return interaction.reply({ content: '**FAIL:** group with id **' + id + '** not found' })
                }
            } catch (err) {
                return interaction.reply({ content: '**FAIL:** group with id **' + id + '** not found' })
            }
        }
    }
}