const util = require('../util');
const Discord = require('discord.js');

const command = {};

command.description = 'Show someones avatar';

command.usage = '<@user|id>';

command.names = ['avatar','av'];

command.execute = async (message, args, database, bot) => {
    /** @type {module:"discord.js".User} */
    let user = args.length ? util.userMentionToId(args[0]) : message.author;
    if (!(user instanceof Discord.User)) {
        try {
            user = await bot.users.fetch(user);
        }
        catch (e) {
            if (e.httpStatus === 404) {
                await message.channel.send(await util.usage(message, command.names[0]));
                return;
            }
        }
    }
    const avatarEmbed = new Discord.MessageEmbed()
        .setTitle(`Avatar of ${user.username}`)
        .setImage(user.displayAvatarURL({dynamic: true, size: 512}))
        .setFooter(`Command executed by ${message.author.username}`)
        .setTimestamp();

    await message.channel.send(avatarEmbed);
};

module.exports = command;
