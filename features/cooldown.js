const util = require('../lib/util');

//cooldown automod
exports.message = async (message, channels, database) => {
    if (!message.guild || message.author.bot || message.member.hasPermission('MANAGE_MESSAGES'))
        return;

    if (channels.get(message.channel.id) && channels.get(message.channel.id).cooldown) {
        let cooldown = channels.get(message.channel.id).cooldown;
        if (message.content.toLowerCase().includes('.aternos.me')) {

            //get all IPs
            let words = message.content.replace(/[^\w.]/gi, ' ').split(' ');
            let ips = words.filter(word => word.toLowerCase().includes('.aternos.me'));

            let uniqueIps = [];
            for (let ip of ips){
              ip = ip.toLowerCase()
              if(!uniqueIps.includes(ip)){
                uniqueIps.push(ip);
              }
            }

            for (let ip of uniqueIps) {
                let server = ip.split(".")[0];
                let data = await database.query('SELECT * FROM servers WHERE channelid = ? AND ip = ? ORDER BY `timestamp` DESC;', [message.channel.id, server]);

                if (!data) {
                    await database.query('INSERT INTO servers (channelid, ip, `timestamp`) VALUES (?,?,?)', [message.channel.id, server, (Math.floor(Date.now() / 1000))]);
                    continue;
                }

                let difference = parseInt(data.timestamp, 10) + cooldown - Math.floor(Date.now() / 1000);
                if (difference <= 60) {
                    await database.query('UPDATE servers SET `timestamp` = ? WHERE channelid = ? AND ip = ?', [(Math.floor(Date.now() / 1000)), message.channel.id, server]);
                    continue;
                }

                let remaining = util.secToTime(difference);

                let response = await message.channel.send(`You can advertise again in ${remaining}!`);
                try {
                    await util.retry(message.delete, message);
                } catch (e) {
                    console.error('Failed to delete message', e);
                }
                try {
                    await util.retry(response.delete, response, [{timeout: 5000}]);
                } catch (e) {
                    console.error('Failed to delete message', e);
                }
                break;
            }
        }
    }
}

exports.init = async (database, channels, bot) => {
    await clean(database, channels, bot);
    setInterval(async () => {
        await clean(database, channels, bot);
    }, 60 * 1000)
}

async function clean(database, channels, bot) {
    for (let [key,channel] of channels) {
        let relevant = Math.floor(Date.now() / 1000) - (isNaN(channel.cooldown) ? 0 : channel.cooldown);
        await database.query("DELETE FROM servers WHERE channelid = ? AND timestamp <= ?", [channel.id, relevant]);
    }
    //stats on servers size
    let result = await database.query("SELECT COUNT(*) as c FROM servers");
    let date = new Date();
    console.log(`[${date.getUTCHours()}:${date.getUTCMinutes()}] There are currently ${result['c']} servers in the Database!`);
}
