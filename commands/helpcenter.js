const guildConfig = require('../util/guildConfig.js');
const util = require('../lib/util.js');
const axios = require('axios');

exports.command = async (message, args, database, bot) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        await message.channel.send('You need the "Manage Server" permission to use this command.');
        return;
    }

    let subdomain = /zendesk.com/.test(args[0]) ? args[0].split(/.zendesk.com/)[0] : args[0];

    if (!subdomain) {
      await message.react(util.icons.error);
      await message.channel.send("Please provide a zendesk.com adress or your zendesk subdomain!");
      return;
    }

    try {
      await axios.get(`https://${subdomain}.zendesk.com/api/v2/help_center/articles/search.json?query=a`);
    } catch (e) {
      await message.channel.send('This is not a valid helpcenter subdomain!');
      return;
    }

    let config = await util.getGuildConfig(message);
    config.helpcenter = subdomain;
    await util.saveGuildConfig(config);

    await message.channel.send(`Set helpcenter to https://${subdomain}.zendesk.com`);
};

exports.names = ['helpcenter'];
