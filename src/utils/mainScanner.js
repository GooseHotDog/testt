const fs = require('fs');
const axios = require('axios');
const assetManager = require('./assetManager.js');
const FormData = require('form-data');
const { readFileSync, createReadStream } = require('fs');
const getRandomS = require('./getRandomS.js');
const reader = require("rbx-reader");
const { set } = require('mongoose');

const createAsset = async () => {
    return parseInt(fs.readFileSync(__dirname + '/jsonData/cid.txt', 'utf-8'));
};

const doSomething = async (id, client) => {
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
                    if (response.data.assetTypeId == 13) {
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
                                    assetManager(assetInfoResponse.data.data[0], client, id);
                                } else {
                                    console.log('ID not found a');
                                }
                            } else {
                                console.log('Failed to retrieve asset info.');
                            }


                        }
                    } else if (response.data.assetTypeId == 40) {
                        const idPattern = /rbxassetid:\/\/(\d+)/g;
                        const matches = [...assetDataResponse.data.matchAll(idPattern)];
                        const ids = matches.map(match => match[1]);

                        if (ids.length > 0) {
                            let { proxy, cookie } = await getRandomS();
                            const assetInfoResponse = await axios.get('https://develop.roblox.com/v1/assets?assetIds=' + ids.join(","), {
                                proxy: proxy,
                                headers: {
                                    Cookie: cookie
                                }
                            });

                            if (assetInfoResponse.status === 200) {
                                if (assetInfoResponse.data.data.length === ids.length) {
                                    assetInfoResponse.data.data.forEach(asset => {
                                        assetManager(asset, client, id);
                                    });
                                } else {
                                    console.log('ID not found f');
                                }
                            }
                        }
                    } else {
                        console.log('ID not found b');
                    }
                } else {
                    console.log('Failed to retrieve asset data.');
                }

            }
        } else {
            console.log('Request failed.');
            retry = false;
        }
    }
};

const handleError = async (func, id, client, retries = 3) => {
    let attempt = 0;
    while (attempt < retries) {
        try {
            await func(id, client);
            break;
        } catch (error) {
            attempt++;
            console.error(`id ${id} [${attempt} / ${retries} ]`);
            // console.error(error)
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            } else {
                console.error(`${retries} retries... skip`);
            }
        }
    }
};

async function mainScanner(client) {
    let currentAssetId = await createAsset();

    const timeOut = ((newId) => {
        handleError(doSomething, newId ?? currentAssetId, client);
        currentAssetId++;

        setTimeout(timeOut, 3, currentAssetId);
    });

    timeOut();

}

mainScanner();

module.exports = mainScanner;
