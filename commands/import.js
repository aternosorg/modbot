const axios = require('axios');
const util = require('../lib/util.js');

const ban = require('./ban.js');
const kick = require('./kick.js');
const mute = require('./mute.js');
const softban = require('./softban.js');
const strike = require('./strike.js');

exports.command = async (message, args, database, bot) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        await message.channel.send('You need the "Manage Server" permission to use this command.');
        return;
    }

    if (!message.attachments.size) {
      await message.channel.send('Please attach a file to your message.');
      return;
    }

    let data = await axios.get(message.attachments.first().url);
    data = data.data;

    let response = await message.channel.send('Importing mutes...');

    //mutes
    let mutes = {
      successful: 0,
      total: Object.keys(data.tempmutes).length
    }
    for (let key of Object.keys(data.tempmutes)) {
      let endsAt = data.tempmutes[key];
      let now = Math.floor(Date.now()/1000);
      let user;

      try {
        user = await bot.users.fetch(key);
      } catch (e) {
        mutes.failed ++;
        continue;
      }
      await mute.mute(message.guild, user, bot.user, `Imported from Vortex`, endsAt - now);
      mutes.successful ++;
    }

    await response.edit('Importing strikes...');

    //strikes
    let strikes = {
      successful: 0,
      total: Object.keys(data.strikes).length
    }
    for (let key of Object.keys(data.strikes)) {
      let count = data.strikes[key];
      let user;

      try {
        user = await bot.users.fetch(key);
      } catch (e) {
        continue;
      }
      await strike.add(message.guild, user, count, bot.user, `Imported from Vortex`, null, database, bot);
      strikes.successful ++;
    }

    await response.edit('Importing bans...');

    //bans
    let bans = {
      successful: 0,
      total: Object.keys(data.tempbans).length
    }
    for (let key of Object.keys(data.tempbans)) {
      let endsAt = data.tempbans[key];
      let now = Math.floor(Date.now()/1000);
      let user;

      try {
        user = await bot.users.fetch(key);
      } catch (e) {
        continue;
      }
      await ban.ban(message.guild, user, bot.user, `Imported from Vortex`, endsAt - now);
      bans.successful ++;
    }

    await response.edit(`Imported ${mutes.successful} of ${mutes.total} mutes, ${strikes.successful} of ${strikes.total} strikes and ${bans.successful} of ${bans.total} bans!`);
};

exports.names = ['import'];
