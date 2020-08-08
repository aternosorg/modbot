const util = require('../lib/util.js');
const Discord = require('discord.js');

exports.command = async (message, args, database, bot) => {

  if(!await util.isMod(message.member) && !message.member.hasPermission('MANAGE_MESSAGES')) {
    await message.react(util.icons.error);
    return;
  }

  let filter = {
    users: [],
    regex: null,
    string: null,
    count: null
  }

  let i;
  for (let [index, arg] of args.entries()) {

    if (i > index) {
      continue;
    }

    if (arg.startsWith('"') && index != args.length - 1) {
      i = index;
      while (args[i] && !args[i].endsWith('"')) {
        arg += ' ' + args[i];
        i ++;
      }
    }
    else if (arg.startsWith('/') && index != args.length - 1) {
      i = index;
      while (args[i] && !String(args[i]).match(/\/([gimsuy]*)$/)) {
        arg += ' ' + args[i];
        i ++;
      }
    }

    //purge @user
    //purge userid
    if (await util.isUserMention(arg)) {
      filter.users.push(util.userMentionToId(arg));
    }
    //purge /regex/
    else if (String(arg).match(/^\/((.* *))\/([gimsuy]*)$/)) {
      let match = String(arg).match(/^\/(.* *)\/([gimsuy]*)$/);
      filter.regex = new RegExp(match[1],match[2]);
    }
    //purge "word"
    else if (String(arg).match(/"(.* *)"/) && arg.length > 2) {
      let match = String(arg).match(/"(.* *)"/);
      filter.string = match[1];
    }
    //purge 10
    else if (parseInt(arg) && parseInt(arg) < 100) {
      filter.count = parseInt(arg);
    }
  }

  let messages = await message.channel.messages.fetch({
    before: message.id,
    limit: filter.count || 100
  });

  messages = messages.filter(msg => {

    //test users
    if (filter.users.length && !filter.users.includes(msg.author.id)) {
      return false;
    }

    //test regex
    if (filter.regex && !filter.regex.test(msg.content)) {
      let incl = false;
      if (filter.regex.test(msg.content)) {
        incl = true;
      }
      if (msg.embeds.length) {
        for (let embed of msg.embeds) {
          if (filter.regex.test(embed.description)) {
            incl = true;
          }
        }
      }
      if (!incl) {
        return false;
      }
    }

    //test string
    if (filter.string) {
      let incl = false;
      if (msg.content.includes(filter.string)) {
        incl = true;
      }
      if (msg.embeds.length) {
        for (let embed of msg.embeds) {
          if (embed.description.includes(filter.string)) {
            incl = true;
          }
        }
      }
      if (!incl) {
        return false;
      }
    }
    return true;
  });

  await message.delete();
  let response = await message.channel.send(`Deleting ${messages.size} messages...`)

  await message.channel.bulkDelete(messages);

  await response.delete();

  let guildConfig = await util.getGuildConfig(message);
  const logembed = new Discord.MessageEmbed()
  .setColor(util.color.orange)
  .setAuthor(`${message.author.username}#${message.author.discriminator} purged  ${messages.size} messages`)
  .setTimestamp()
  .addFields(
    { name: "Moderator", value: `<@${message.author.id}>`, inline: true}
  );
  if (filter.users.length) {
    let s = '';
    for (let user of filter.users) {
      s += `<@!${user}>`;
    }
    logembed.addField("User(s)", s, true);
  }
  if (filter.string) {
    logembed.addField("String", filter.string, true);
  }
  if (filter.regex) {
    logembed.addField("Regex", filter.regex, true);
  }
  return await message.guild.channels.resolve(guildConfig.logChannel).send(logembed);

};

exports.names = ['purge','clean'];
