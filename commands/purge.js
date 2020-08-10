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
  };

  let i;
  for (let [index, arg] of args.entries()) {
    //purge @user
    //purge userid
    if (await util.isUserMention(arg)) {
      filter.users.push(util.userMentionToId(arg));
    }
    //purge /regex/
    else if (String(arg).match(/^\/.*\/[gimsuy]*$/)) {
      let match = String(arg).match(/^\/(.*)\/([gimsuy]*)$/);
      try {
        filter.regex = new RegExp(match[1],match[2]);
      }
      catch (e) {
        message.channel.send(`Invalid regex as filter number ${index+1}`);
        return;
      }
    }
    //purge "word"
    else if (!/\d+/.test(arg)) {
      filter.string = arg;
    }
    //purge 10
    else if (parseInt(arg) && parseInt(arg) < 100) {
      filter.count = parseInt(arg);
    }
  }

  if (!filter.users.length && !filter.regex && !filter.string && !filter.count) {
    let embed = new Discord.MessageEmbed({ description: ''});
    embed.setDescription(embed.description + 'Deletes messages that match the filter \n');
    embed.setDescription(embed.description + 'USAGE: \`purge filter1 filter2\` ... \n');
    embed.setDescription(embed.description + 'Available filters: string /regex/flags @byUser byUserId count \n');
    embed.setDescription(embed.description + 'any combination and order of filters is supported!');
    await message.channel.send(embed);
    return ;
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

  await message.channel.bulkDelete(messages);

  let response = await message.channel.send(`Deleted ${messages.size} messages`);
  try {
    await response.delete({timeout: 3000});
  } catch (e) {}

  let guildConfig = await util.getGuildConfig(message);
  const logembed = new Discord.MessageEmbed()
  .setColor(util.color.orange)
  .setAuthor(`${message.author.username}#${message.author.discriminator} purged  ${messages.size} messages`)
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
    logembed.addField("Tested messages", filter.count, true);
  }
  return await message.guild.channels.resolve(guildConfig.logChannel).send(logembed);

};

exports.names = ['purge','clean'];
