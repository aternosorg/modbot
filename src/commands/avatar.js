const util = require('../util');
const Discord = require('discord.js');

const command = {};

command.description = 'Show someones avatar';

command.usage = '<@user|id>';

command.names = ['avatar','av'];

command.execute = async (message, args, database, bot) => {
    /** @type {module:"discord.js".User} */
    const user = args.length ? await bot.users.fetch(util.userMentionToId(args[0])) : message.author;
    const avatarEmbed = new Discord.MessageEmbed()
        .setTitle(`Avatar of ${user.username}`)
        .setImage(user.displayAvatarURL({dynamic: true, size: 512}))
        .setFooter(`Command executed by ${message.author.username}`)
        .setTimestamp();

    await message.channel.send(avatarEmbed);
};

module.exports = command;
