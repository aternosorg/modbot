const util = require('../../lib/util');

//cooldown automod
exports.message = async (message, database) => {
    if (!message.guild || message.author.bot || message.member.hasPermission('MANAGE_MESSAGES'))
        return;

    let channel = await util.getChannelConfig(message.channel.id)
    if (channel && channel.cooldown) {
        let cooldown = channel.cooldown;
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
                server = server.substring(0,20);

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
                let response = await message.channel.send(`${util.icons.forbidden} You can advertise again in ${remaining}!`);
                try {
                  await util.retry(message.delete, message);
                  await util.logMessageDeletion(message, `${ip}'s cooldown has ${remaining} remaining.`);
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
};
