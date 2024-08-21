const fs = require('fs');

const { EmbedBuilder } = require('discord.js');

const rescan = require('./rescan.js');

const axios = require('axios');
const qs = require('qs');
const sendDiscordMessage = require('./sendDiscordMessage.js');

module.exports = (asset, client, vid) => {
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

    function checkTypeAndFormat(type) {
        if (af.hasOwnProperty(type)) {
            return { exists: true, format: af[type] };
        } else {
            return { exists: false, format: null };
        }
    }

    let scanningUsers = JSON.parse(fs.readFileSync(__dirname.replace("utils", "") + 'db/creators.json', 'utf-8'));
    let scannedAssets = JSON.parse(fs.readFileSync(__dirname.replace("utils", "") + 'db/assets.json', 'utf-8'));


    // if (asset.type === "Lua" || asset.type === "Decal" || asset.type === "MeshHiddenSurfaceRemoval" || asset.type === "SolidModel") {
    //     return;
    // }

    for (let creatorData of scanningUsers) {
        if (asset.creator.targetId.toString() === creatorData.creatorId) {
            if (scannedAssets.includes(asset.id)) {
                continue;
            } else {
                scannedAssets.push(asset.id);
            }

             const afd = checkTypeAndFormat(asset.type)

            const embed = new EmbedBuilder()
                .setTitle(`AssetId: ${asset.id}`)
                .setDescription("**Name: **" + (asset.name ?? "Not found") + "\n**Type: **" + (asset.type ?? "???") + "\n**Description: **" + (asset.description ?? "Not found") + `\n**Created: **<t:${(new Date(asset.created) / 1000).toFixed(0)}:R>`)
                .setThumbnail('https://rbxgleaks.pythonanywhere.com/asset/' + asset.id)
                .setColor('#01cbf9')
                .setFooter({ text: "W scanner" })
                .addFields({
                    name: 'Creator',
                    value: `**Name: **${creatorData.creatorName}\n**Type: **${creatorData.creatorType}\n**Id: **[${creatorData.creatorId}](https://www.roblox.com/${(creatorData.creatorType == "User" ? "users" : "groups")}/${creatorData.creatorId})`,
                    inline: true
                },
                    {
                        name: 'Links',
                        value: `[Asset link](https://roblox.com/library/${asset.id})\n[Asset preview link](https://rbxgleaks.pythonanywhere.com/asset/${asset.id})${(afd.exists == true) ? `\n [Download asset (${afd.format})](https://hyperium-download-api.vercel.app/download/${asset.id}?type=${afd.format})` : ``}`,
                        inline: true
                    });

            creatorData.channelIds.forEach(channelId => {
                try {
                    const channel = client.channels.cache.get(channelId);
                    if (channel) {
                        channel.send({ embeds: [embed] });
                    }
                } catch (e) {
                    console.log("[Channel Sending]");
                    console.log(e);
                }
            });
        }
    }

    fs.writeFileSync(__dirname + '/jsonData/cid.txt', vid.toString(), 'utf-8', (err) => {
        if (err) {
            console.log(err);
        }
    });
}