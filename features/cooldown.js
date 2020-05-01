const util = require('../lib/util');

//cooldown automod
exports.message = async (message, channels, database) => {
    if (!message.guild || message.author.bot || message.member.hasPermission('MANAGE_MESSAGES'))
        return;

    if (channels.get(message.channel.id) && channels.get(message.channel.id).cooldown) {
        let cooldown = channels.get(message.channel.id).cooldown;
        if (message.content.includes('.aternos.me')) {

            //get all IPs
            let words = message.content.replace(/[^0-9a-z .]/gi, ' ').split(' ');
            let ips = words.filter(word => word.includes('.aternos.me'));

            for (let ip of ips) {
                let server = ip.replace('.aternos.me', '');
                let data = await database.query('SELECT * FROM servers WHERE channelid = ? AND ip = ? ORDER BY `timestamp` DESC;', [message.channel.id, server]);

                if (!data) {
                    await database.query('INSERT INTO servers (channelid, ip, `timestamp`) VALUES (?,?,?)', [message.channel.id, server, (Math.floor(Date.now() / 1000))]);
                    continue;
                }

<<<<<<< HEAD
              message.channel.send(`You can advertise again in ${remaining}!`)
              .then(response =>
                for(let i = 0;i < 10; i++){
                  try{
                    await response.delete({timeout: 5000});
                  } catch (e) {
                    continue;
                  }
                  break;
                }
              );
              for(let i = 0;i < 10; i++){
                try{
                  await message.delete();
                }catch (e) {
                  continue;
                }
                break;
              }
              return;
            }
            else {
              //Update time in database
              database.query('UPDATE servers SET timestamp = ? WHERE channelid = ? AND ip = ?',[(Math.floor(Date.now()/1000)), message.channel.id, server]);
=======
                let difference = parseInt(data.timestamp, 10) + cooldown - Math.floor(Date.now() / 1000);
                if (difference <= 60) {
                    await database.query('UPDATE servers SET `timestamp` = ? WHERE channelid = ? AND ip = ?', [(Math.floor(Date.now() / 1000)), message.channel.id, server]);
                    continue;
                }

                let remaining = '';
                if (Math.floor(difference / (60 * 60 * 24)) !== 0) {
                    remaining += Math.floor(difference / (60 * 60 * 24)) + 'd ';
                }
                if (Math.floor(difference / (60 * 60)) !== 0) {
                    remaining += Math.floor(difference % (60 * 60 * 24) / (60 * 60)) + 'h ';
                }
                if (Math.floor(difference / 60) !== 0) {
                    remaining += Math.floor(difference % (60 * 60) / 60) + 'm ';
                }

                let response = await message.channel.send(`You can advertise again in ${remaining}!`);
                try {
                    await util.retry(message.delete, message);
                    await util.retry(response.delete, response, [{timeout: 5000}]);
                } catch (e) {
                    console.error('Failed to delete message', e);
                }
                break;
>>>>>>> b6af85d8c96e936c15943271321cbaabdc7e1364
            }
        }
    }
}

<<<<<<< HEAD
//delete unneccessary servers
exports.clean = (database, channels, bot) => {
  channels.forEach(channel => {
    //IPs with a smaller timestamp can already be advertised again
    let relevant = Math.floor(Date.now()/1000) - channel.cooldown;
    database.query('DELETE FROM servers WHERE channelid = ? AND timestamp <= ?', [channel.id, relevant])
  });
  //stats on servers size
  database.query('SELECT * FROM servers', function(err,result) {
    date = new Date();
    console.log(`[${date.getUTCHours()}:${date.getUTCMinutes()}] There are currently ${result.length} servers in the Database!`);
  })
=======
exports.init = async (database, channels, bot) => {
    await clean(database, channels, bot);
    setInterval(async () => {
        await clean(database, channels, bot);
    }, 60 * 60 * 1000)
}

async function clean(database, channels, bot) {
    for (let channel of channels) {
        let relevant = Math.floor(Date.now() / 1000) - (isNaN(channel.cooldown) ? 0 : channel.cooldown);
        await database.query("DELETE FROM servers WHERE channelid = ? AND timestamp <= ?", [channel.id, relevant]);
    }
    //stats on servers size
    let result = await database.query("SELECT COUNT(*) as c FROM servers");
    let date = new Date();
    console.log(`[${date.getUTCHours()}:${date.getUTCMinutes()}] There are currently ${result['c']} servers in the Database!`);
>>>>>>> b6af85d8c96e936c15943271321cbaabdc7e1364
}
