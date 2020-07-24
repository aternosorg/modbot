const guildConfig = require('../util/guildConfig.js');
const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        message.channel.send('You need the "Manage Server" Permission to use this command.');
        return;
    }

    let roleId;

    if (['create','new'].includes(args[0])) {
      let role = await message.guild.roles.create({
        data: {
          name: 'muted',
          hoist: false
        }
      })
      roleId = role.id;
    }
    else {
      //Get role
      roleId = util.roleMentionToId(args.shift());;
      if (roleId && !message.guild.roles.resolve(roleId)) {
        await message.channel.send("Please specify a role! (@mention or ID)");
        return;
      }
    }


    let guildId = message.guild.id;

    let result = await database.query("SELECT * FROM guilds WHERE id = ?",[guildId]);
    if(result){
      let config = JSON.parse(result.config);
      if (roleId) {
        config.mutedRole = roleId;
        await database.query("UPDATE guilds SET config = ? WHERE id = ?",[JSON.stringify(config),guildId]);
      } else {
        if (!config.logChannel)
          await database.query("DELETE FROM guilds WHERE id = ?",[guildId]);
        else{
          config.mutedRole = roleId;
          await database.query("UPDATE guilds SET config = ? WHERE id = ?",[JSON.stringify(config),guildId]);
        }

      }
    }
    else {
      if (roleId) {
        await database.query("INSERT INTO guilds (config,id) VALUES (?,?)",[JSON.stringify(new guildConfig(guildId, undefined, roleId)),guildId]);
      }
      else {
        await message.channel.send(`Muted Role already disabled!`);
        return;
      }
    }

    await util.refreshGuildConfig(guildId);

    for ([key, channel] of message.guild.channels.cache) {
      channel.overwritePermissions([{
        id: roleId,
        deny: ['SEND_MESSAGES','SPEAK']
      }]);
    }

    if (roleId) {
      await message.channel.send(`Set muted role to <@&${roleId}>!`);
    }
    else {
      await message.channel.send(`Disabled muted role!`);
    }
}

exports.names = ['mutedrole'];
