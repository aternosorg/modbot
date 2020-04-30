//cooldown automod
exports.message = (message, channels, database) => {
  if(!message.guild || message.author.bot || message.member.hasPermission('MANAGE_MESSAGES'))
    return;

  if(channels.get(message.channel.id)&&channels.get(message.channel.id).cooldown){
    let cooldown = channels.get(message.channel.id).cooldown;
    if(message.content.includes('.aternos.me')) {

      //get all IPs
      let words = message.content.replace(/[^0-9a-z .]/gi, ' ').split(' ');
      let ips = words.filter(word => word.includes('.aternos.me'));

      ips.forEach( ip => {
        let server = ip.replace('.aternos.me', '');
        database.query('SELECT * FROM servers WHERE channelid = ? AND ip = ?', [message.channel.id, server], function(err, result) {
          if(result[0]){
            let data = result[0];

            //seconds until ip is allowed to be advertised again
            let difference = parseInt(data.timestamp,10) + cooldown - Math.floor(Date.now()/1000);
            if (difference>59){
              //remaing timer
              let remaining = '';
              if (Math.floor(difference/(60*60*24))!=0) {
                remaining += Math.floor(difference/(60*60*24)) + 'd ';
              }
              if (Math.floor(difference/(60*60))!=0) {
                remaining += Math.floor(difference%(60*60*24)/(60*60)) + 'h ';
              }
              if (Math.floor(difference/60)!=0) {
                remaining += Math.floor(difference%(60*60)/60) + 'm ';
              }

              message.channel.send(`You can advertise again in ${remaining}!`)
              .then(response =>
                response.delete({timeout: 5000}).catch(error => console.error("Failed to delete a Message! ",error))
              );
              message.delete().catch(error => console.error("Failed to delete a Message! ",error));
              return;
            }
            else {
              //Update time in database
              database.query('UPDATE servers SET timestamp = ? WHERE channelid = ? AND ip = ?',[(Math.floor(Date.now()/1000)), message.channel.id, server]);
            }
          }
          else {
            //add ip and time to database
            database.query('INSERT INTO servers (channelid, ip, timestamp) VALUES (?,?,?)', [message.channel.id, server, (Math.floor(Date.now()/1000))])
          }
        });
      });
    }
  }
}

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
}
