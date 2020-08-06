const guildConfig = require('../util/guildConfig.js');
const util = require('../lib/util.js');
const tutorial = require('./tutorial.js');

exports.command = async (message, args, database, bot) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        message.channel.send('You need the "Manage Server" permission to use this command.');
        return;
    }

    let playlist = /youtube.com/.test(args[0]) ? args[0].split(/list=/)[1].replace(/&[\w=]+/,'') : args[0];

    if (!playlist) {
      await message.react(util.icons.error);
      await message.channel.send("Please provide a youtube playlist link or id");
      return;
    }

    if (["off","disabled","none"].includes(playlist)) {
      playlist = null;
    }
    let config = await util.getGuildConfig(message);
    config.playlist = playlist
    await util.saveGuildConfig(config);

     tutorial.clearCache(message.guild);

    if (playlist) {
      await message.channel.send(`Set playlist to https://www.youtube.com/playlist?list=${playlist}`);
    }
    else {
      await message.channel.send(`Disabled playlist`);
    }
};

exports.names = ['playlist'];
