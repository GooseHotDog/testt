const Discord = require('discord.js');
const log = require('../utils/logger.js');
const logger = new log('interactionCreate');
const interaction_handler = require('../handlers/interaction_handler');

module.exports = {
    event: Discord.Events.InteractionCreate,
    type: 'on',
    async call(client, interaction) {
        const getUnixTimestamp = () => Math.floor(Date.now() / 1000);

        if (interaction.isChatInputCommand()) {
            if (!Object.keys(client.commands).includes(interaction.commandName)) {
                logger.warn(`Command ${interaction.commandName} not found or loaded`);
                return interaction.reply({
                    ephemeral: true,
                    content: `Command not found, please report this!`,
                });
            }

            const command = client.commands[interaction.commandName];

            const getOptionTypeName = (type) => {
                switch (type) {
                    case 1: return 'SUB_COMMAND';
                    case 2: return 'SUB_COMMAND_GROUP';
                    case 3: return 'STRING';
                    case 4: return 'INTEGER';
                    case 5: return 'BOOLEAN';
                    case 6: return 'USER';
                    case 7: return 'CHANNEL';
                    case 8: return 'ROLE';
                    case 9: return 'MENTIONABLE';
                    case 10: return 'NUMBER';
                    default: return 'UNKNOWN';
                }
            };

            const args = [];
            const collectArguments = (options, prefix = '') => {
                for (const option of options) {
                    const typeName = getOptionTypeName(option.type);
                    if (option.type === 1) {
                        // SUB_COMMAND
                        args.push(`${prefix}${option.name}`);
                        collectArguments(option.options, `${prefix}${option.name} `);
                    } else if (option.type === 2) {
                        // SUB_COMMAND_GROUP
                        args.push(`${prefix}${option.name}`);
                        collectArguments(option.options, `${prefix}${option.name} `);
                    } else {
                        args.push(`${prefix}${option.name}:${option.value}`);
                    }
                }
            };

            collectArguments(interaction.options.data);

            const argsString = args.join(' ');

            const channelId = interaction.channelId;
            const user = interaction.user;
            const timestamp = getUnixTimestamp();

            try {
                await command.execute(client, interaction);
                const logMessage = `/${interaction.commandName}${argsString.length > 0 ? ' ' + argsString : ''} used by ${user.tag} [<t:${timestamp}:R>] in channel <#${channelId ?? 'null'}>`;
                logger.info(logMessage);
                const logChannel = client.channels.cache.get('1262111634437177515');
                if (logChannel) {
                    logChannel.send({ content: logMessage, flags: 4096 });
                }
            } catch (error) {
                logger.error(error);
                return interaction.reply({
                    ephemeral: true,
                    content: `Error executing command! Please try again, if error persists please report to a developer`,
                }).catch(() => '');
            }
        } else {
            try {
                await interaction_handler(client, interaction);
            } catch (err) {
                logger.error(`Interaction handler had issue handling interaction ${interaction.customId} ${err}`);
            }
        }
    },
};
