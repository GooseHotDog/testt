const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js')
const fs = require('fs');
const axios = require('axios');
const getRandomS = require('../utils/getRandomS');
const reader = require("rbx-reader")

const getInfo = async (id) => {
    let retry = true;

    while (retry) {
        let { proxy, cookie } = await getRandomS();

        const response = await axios.get(
            `https://assetdelivery.roblox.com/v2/assetversionid/${id}`,
            {
                proxy: proxy,
                headers: {
                    Cookie: cookie
                }
            }
        );

        if (response.status === 200) {
            if (response.data.errors && response.data.errors.some(e => e.message === "Request asset was not found")) {
                //console.log('Asset not found, retrying...');
                await new Promise(resolve => setTimeout(resolve, 3000)); 
                continue; 
            }

            retry = false;
            const allowedIds = [13, 40]
            if (allowedIds.includes(response.data.assetTypeId) == true) {
                let { proxy, cookie } = await getRandomS();
                const assetDataResponse = await axios.get(response.data.locations[0].location,
                    {
                        proxy: proxy,
                        headers: {
                            Cookie: cookie
                        }
                    }
                );

                if (assetDataResponse.status === 200) {
                    const idPattern = /<url>http:\/\/www\.roblox\.com\/asset\/\?id=(\d+)<\/url>/;
                    const match = assetDataResponse.data.match(idPattern);

                    if (match && match[1]) {
                        let { proxy, cookie } = await getRandomS();

                        const assetInfoResponse = await axios.get('https://develop.roblox.com/v1/assets?assetIds=' + match[1], {
                            proxy: proxy,
                            headers: {
                                Cookie: cookie
                            }
                        });

                        if (assetInfoResponse.status === 200) {
                            if (assetInfoResponse.data.data.length === 1) {
                                return assetInfoResponse.data.data[0];
                            } else {
                                console.log('ID not found');
                            }
                        } else {
                            console.log('Failed to retrieve asset info.');
                        }
                    } else {
                        console.log('ID not found');
                    }
                } else {
                    console.log('Failed to retrieve asset data.');
                }
            } else if (response.data.assetTypeId == 40) {
                const idPattern = /rbxassetid:\/\/(\d+)/g;
                const matches = [...assetDataResponse.data.matchAll(idPattern)];
                const ids = matches.map(match => match[1]);

                if (ids.length > 0) {
                    let { proxy, cookie } = await getRandomS();
                    const assetInfoResponse = await axios.get('https://develop.roblox.com/v1/assets?assetIds=' + ids[0], {
                        proxy: proxy,
                        headers: {
                            Cookie: cookie
                        }
                    });

                    if (assetInfoResponse.status === 200) {
                        if (assetInfoResponse.data.data.length === 1) {
                            return assetInfoResponse.data.data[0];
                        } else {
                            console.log('ID not found');
                        }
                    }

                }
            }
        } else {
            console.log('Request failed.');
            retry = false;
        }
    }
};

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('cid')
        .setDescription('Current scanned asset id.'),
    async execute(client, interaction) {
        const cid = fs.readFileSync(__dirname.replace("commands", "") + 'utils/jsonData/cid.txt', 'utf-8');
        const data = await getInfo(cid);

        const af = {
            Decal: "rbxm",
            MeshPart: "rbxm",
            Image: "png",
            Audio: "txt",
            Mesh: "obj",
            Lua: "txt",
            Model: "rbxm",
            Animation: "rbxm",
            SolidModel: "rbxm",
            TexturePack: "rbxm"
        };

        console.log(data);
        const utcSeconds = (new Date(data["created"]) / 1000);

        const embed = new Discord.EmbedBuilder()
            .setTitle(`Current Id: ${data.id}`)
            .setDescription("**Name: **" + (data.name ?? "Not found") + "\n**Type: **" + (data.type ?? "???") + "\n**Description: **" + (data.description ?? "Not found") + `\n**Created: **<t:${(new Date(data.created) / 1000).toFixed(0)}:R>`)
            .setThumbnail('https://rbxgleaks.pythonanywhere.com/asset/' + data.id)
            .setColor('#01cbf9')
            .addFields({
                name: 'Creator',
                value: `**Type: **${data.creator.type}\n**Id: **[${data.creator.targetId}](https://www.roblox.com/${(data.creator.type == "User" ? "users" : "groups")}/${data.creator.targetId})`,
                inline: true
            },
                {
                    name: 'Links',
                    value: `[Asset link](https://roblox.com/library/${data.id})\n[Asset preview link](https://rbxgleaks.pythonanywhere.com/asset/${data.id})`,
                    inline: true
                });


        return interaction.reply({ embeds: [embed] })
    }
}