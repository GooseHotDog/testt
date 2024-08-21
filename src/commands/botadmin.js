const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js')
const fs = require('fs');

const axios = require('axios');
const { exec } = require('child_process');


const { admin, freepasscategory } = require('../db/settings.json') 


module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('botadmin')
        .setDescription('Admin commands for the bot.')
        .addSubcommand(a =>
            a
                .setName('giveperms')
                .setDescription('Give permissions to add/remove creators on servers.')
                .addStringOption(option =>
                    option.setName('guildid')
                        .setDescription('guildid of the server to give permissions to.')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('userid')
                        .setDescription('userid of the user to give permissions to.')
                        .setRequired(true)
                )
        )

        .addSubcommand(a =>
            a
                .setName('removeperms')
                .setDescription('Remove permissions to add/remove creators on servers.')
                .addStringOption(option =>
                    option.setName('guildid')
                        .setDescription('guildid of the server to give permissions to.')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('userid')
                        .setDescription('userid of the user to give permissions to.')
                        .setRequired(true)
                )
        )

        .addSubcommand(a =>
            a
                .setName('listperms')
                .setDescription('Check permissions to add/remove creators on servers.')
                .addStringOption(option =>
                    option.setName('guildid')
                        .setDescription('guildid of the server to give permissions to.')
                        .setRequired(true)
                )
        )

        .addSubcommand(a =>
            a
                .setName('debug')
                .setDescription('Debug 1')
        )
        .addSubcommand(a =>
            a
                .setName('restart')
                .setDescription('Restart the bot')
                ),
    async execute(client, interaction) {
        if (!admin.includes(interaction.user.id)) {
            return interaction.reply({ content: '**FAIL:** you are not allowed to use this commands.\nRequired permission: `Bot Admin`', ephemeral: true})
        }

        let accessList = JSON.parse(fs.readFileSync(__dirname.replace("commands", "") + 'db/accesslist.json', 'utf-8'));
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'listperms') {
            const guildid = interaction.options.getString('guildid');
            
            if (!accessList[guildid]) {
                return interaction.reply({content: 'No permissions found for this server', ephemeral: true})
            } 
            const users = accessList[guildid].map(userid => `- <@${userid}>`)
            return interaction.reply({content: `## Permissions for this server:\n${users.join('\n')}`, ephemeral: true})
        } else if (subcommand === 'giveperms') {
            const guildid = interaction.options.getString('guildid');
            const userid = interaction.options.getString('userid');
            if (!accessList[guildid]) {
                accessList[guildid] = [];
            }
            if (accessList[guildid].includes(userid)) {
                return interaction.reply({content: 'User already has permissions to add/remove creators on this server', ephemeral: true})
            }
            accessList[guildid].push(userid);
            fs.writeFileSync(__dirname.replace("commands", "") + 'db/accesslist.json', JSON.stringify(accessList), 'utf-8', (err) => {
                if (err) {
                    console.log(err);
                }
            });
            return interaction.reply({content: 'Permissions given to user <@'+userid+'>!', ephemeral: true})
        } else if (subcommand === 'removeperms') {
            const guildid = interaction.options.getString('guildid');
            const userid = interaction.options.getString('userid');
            if (!accessList[guildid]) {
                return interaction.reply({content: 'No permissions found for this server', ephemeral: true})
            }
            if (!accessList[guildid].includes(userid)) {
                return interaction.reply({content: 'User does not have permissions to add/remove creators on this server'})
            }
            const newAccessList = accessList[guildid].filter(id => id !== userid);
            accessList[guildid] = newAccessList;
            fs.writeFileSync(__dirname.replace("commands", "") + 'db/accesslist.json', JSON.stringify(accessList), 'utf-8', (err) => {
                if (err) {
                    console.log(err);
                }
            });
            return interaction.reply({content: 'Permissions removed from user', ephemeral: true})
        } else if (subcommand === 'debug') {
            let debug = JSON.parse(fs.readFileSync(__dirname.replace("commands", "") + 'utils/jsonData/debug.txt', 'utf-8'));

            return interaction.reply({content: `Debug: ${debug} requests in queue`, ephemeral: true})

        } else if (subcommand === 'restart') { 
            interaction.reply({content: 'Restarting bot...', ephemeral: true})
            exec('pm2 restart 0', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Ошибка: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
            });
        }
    }
}