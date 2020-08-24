const util = require('../lib/util.js');

const command = {};

command.description = 'View or change the reason of a moderation';

command.usage = 'moderationId <reason>';

command.names = ['reason','edit'];

command.execute = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('VIEW_AUDIT_LOG')) {
    await message.react(util.icons.error);
    return;
  }

  if (!args.length || !parseInt(args[0])) {
    await message.channel.send(await util.usage(message, command.names[0]));
    return;
  }

  let id = parseInt(args.shift());
  if (args.length) {
    let reason = args.join(' ');

    let result = await database.queryAll("UPDATE moderations SET reason = ? WHERE id = ? AND guildid = ? ",[reason, id, message.guild.id]);

    if (result.affectedRows === 0) {
      await message.channel.send(`There is no moderation with the id \`${id}\` on this guild!`);
      return;
    }

    await message.channel.send(`Updated the reason of case \`${id}\` | ${reason}`.substring(0,2000));
  }
  else {
    let result = await database.query("SELECT reason FROM moderations WHERE id = ? AND guildid = ? ",[id, message.guild.id]);
    if (result) {
      await message.channel.send(`Reason for case \`${id}\` | ${result.reason}`.substring(0,2000));
    }
    else {
      await message.channel.send(`There is no moderation with the id \`${id}\` on this guild!`);
    }
  }
};

module.exports = command;
