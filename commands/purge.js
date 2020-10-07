const util = require('../lib/util.js');
const Discord = require('discord.js');

const command = {};

command.description = 'Purge messages';

command.usage = '</regex/flags> <@users> <userIds> <text> <count>';

command.comment = 'Count specifes the amount of messages that will be tested for your filters (not the amount that will be deleted) and defaults to 100';

command.names = ['purge','clean'];

command.execute = async (message, args, database, bot) => {

  if(!await util.isMod(message.member) && !message.member.hasPermission('MANAGE_MESSAGES')) {
    await message.react(util.icons.error);
    return;
  }

  let filter = {
    users: [],
    regex: null,
    string: null,
    count: null
  };

  for (let [index, arg] of args.entries()) {
    //purge @user
    //purge userid
    if (await util.isUserMention(arg)) {
      filter.users.push(util.userMentionToId(arg));
      continue;
    }
    //purge /regex/
    if (String(arg).match(/^\/.*\/[gimsuy]*$/)) {
      let match = String(arg).match(/^\/(.*)\/([gimsuy]*)$/);
      try {
        filter.regex = new RegExp(match[1],match[2]);
      }
      catch (e) {
        message.channel.send(`Invalid regex as filter number ${index+1}`);
        return;
      }
      continue;
    }
    //purge "word"
    if (!/\d+/.test(arg)) {
      filter.string = arg;
      continue;
    }
    //purge 10
    if (parseInt(arg)) {
      if (parseInt(arg) > 1000) {
        await message.channel.send(`You cant purge more than 1000 messages`);
        return ;
      }
      else {
        filter.count = parseInt(arg);
      }
      continue;
    }
  }

  if (!filter.users.length && !filter.regex && !filter.string && !filter.count) {
    await message.channel.send(await util.usage(message, command.names[0]));
    return ;
  }

  let messages = await util.getMessages(message.channel,{
    before: message.id,
    limit: filter.count || 100
  });

  messages = messages.filter(msg => {

    //messages too old to bulk delete
    if (message.createdAt - msg.createdAt > 14*24*60*60*1000) {
      return false;
    }

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
        if (msg.embeds.some(e => {
          return e.description && e.description.includes(filter.string) || e.fields.some(e => {
            return e.name.includes(filter.string) || e.value.includes(filter.string)
          });
        })) {
          incl = true;
        }
      }
      if (!incl) {
        return false;
      }
    }
    return true;
  });

  try {
    await util.delete(message);
  } catch (e) {}

  try {
    await util.bulkDelete(message.channel,messages);
  } catch (e) {
    console.log('bulkDelete failed ', e);
  }

  let response = await message.channel.send(new Discord.MessageEmbed({
    color: util.color.green,
    description: `Deleted **${messages.size}** ${messages.size === 1 ? 'message' : 'messages'}.`
  }));

  try {
    await util.delete(response,{timeout: 3000});
  } catch (e) {}

  let guildConfig = await util.getGuildConfig(message);
  const logembed = new Discord.MessageEmbed()
  .setColor(util.color.orange)
  .setAuthor(`${message.author.username}#${message.author.discriminator} purged ${messages.size} ${messages.size === 1 ? 'message' : 'messages'}.`)
  .setTimestamp()
  .addFields(
    { name: "Moderator", value: `<@${message.author.id}>`, inline: true},
    { name: "Channel", value: `<#${message.channel.id}>`, inline: true}
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
  if (filter.count) {
    logembed.addField(`Tested ${messages.size === 1 ? 'message' : 'messages'}`, filter.count, true);
  }
  return await message.guild.channels.resolve(guildConfig.logChannel).send(logembed);

};

module.exports = command;
