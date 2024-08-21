const { readFileSync } = require('fs');
const proxys = readFileSync(__dirname + '/jsonData/proxys.txt', 'utf-8').split('\n');
const tokens = readFileSync(__dirname + '/jsonData/accounts.txt', 'utf-8').split('\n');

module.exports = async () => {
        try {
            const proxyData = proxys[Math.floor(Math.random() * proxys.length)].replace(/\r/g, '').split(':');

            const proxy = {
                protocol: 'http',
                host: proxyData[0],
                port: proxyData[1],
                auth: {
                    username: proxyData[2],
                    password: proxyData[3]
                }
            }
            
            const cookie = tokens[Math.floor(Math.random() * tokens.length)].replace(/\r/g, '');
            return { proxy, cookie };
        } catch (err) {
            console.log(err);
        }
}