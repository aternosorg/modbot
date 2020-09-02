const axios = require('axios');
const util = require('../lib/util.js');

const command = {};

command.description = 'Import tempmutes, tempbans and strikes from vortex ';

command.usage = '';

command.comment = 'Attach the .json file to your message';

command.names = ['import'];

command.execute = async (message, args, database, bot) => {
  //Permission check
  if (!message.member.hasPermission('MANAGE_GUILD')) {
    await message.channel.send('You need the "Manage Server" permission to use this command.');
    return;
  }

  if (!message.attachments.size) {
    await message.channel.send('Please attach a file to your message.');
    return;
  }

  let time = Date.now();

  let data = await axios.get(message.attachments.first().url);
  data = data.data;

  let response = await message.channel.send('Importing mutes...');
  let percent = 0;

  //mutes
  let mutes = {
    successful: 0,
    total: Object.keys(data.tempmutes).length
  };
  for (let key of Object.keys(data.tempmutes)) {
    if (mutes.successful / mutes.total * 100  > percent + 0.5) {
      percent = mutes.successful / mutes.total * 100;
      response.edit(`Importing mutes (${percent.toFixed(1)}%)...`).catch(console.error);
    }
    let endsAt = data.tempmutes[key];
    if (endsAt > Number.MAX_SAFE_INTEGER) {
      //ignore bugged timers
      continue ;
    }

    let now = Math.floor(Date.now()/1000);

    await util.moderationDBAdd(message.guild.id, key, "mute", `Imported from Vortex`, endsAt - now, bot.user.id);
    mutes.successful ++;
  }

  percent = 0;
  await response.edit('Importing strikes...');

  //strikes
  let strikes = {
    successful: 0,
    total: Object.keys(data.strikes).length
  };
  for (let key of Object.keys(data.strikes)) {
    let now = Math.floor(Date.now()/1000);
    if (strikes.successful / strikes.total * 100  > percent + 0.5) {
      percent = strikes.successful / strikes.total * 100;
      response.edit(`Importing strikes (${percent.toFixed(1)}%)...`).catch(console.error);
    }
    let count = data.strikes[key];

    await database.queryAll("INSERT INTO moderations (guildid, userid, action, value, created, reason, moderator) VALUES (?,?,?,?,?,?,?)",[message.guild.id, key, 'strike', count, now, `Imported from Vortex`, bot.user.id]);
    strikes.successful ++;
  }

  percent = 0;
  await response.edit('Importing bans...');

  //bans
  let bans = {
    successful: 0,
    total: Object.keys(data.tempbans).length
  };
  for (let key of Object.keys(data.tempbans)) {
    if (bans.successful / bans.total * 100  > percent + 0.5) {
      percent = bans.successful / bans.total * 100;
      response.edit(`Importing bans (${percent.toFixed(1)}%)...`).catch(console.error);
    }
    let endsAt = data.tempbans[key];
    if (endsAt > Number.MAX_SAFE_INTEGER) {
      //ignore bugged timers
      continue;
    }

    let now = Math.floor(Date.now()/1000);
    await util.moderationDBAdd(message.guild.id, key, "ban", `Imported from Vortex`, endsAt - now, bot.user.id);
    bans.successful ++;
  }

  time = Math.floor((Date.now() - time)/1000);
  time = util.secToTime(time);
  await response.edit(`Imported ${mutes.successful} of ${mutes.total} mutes, ${strikes.successful} of ${strikes.total} strikes and ${bans.successful} of ${bans.total} bans in ${time}!`);
};

module.exports = command;
