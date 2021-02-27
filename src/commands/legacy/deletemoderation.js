const util = require('../../util.js');
const Discord = require('discord.js');
const moderations = require('./moderations');
const GuildConfig = require('../../GuildConfig');
const icons = require('../../icons');
const command = {};

command.description = 'Delete a specific moderation';

command.usage = '<#moderationid>';

command.names = ['deletemoderation','delmod'];

command.execute = async (message, args, database, bot) => {
    const guildConfig = await GuildConfig.get(message.guild.id);
    if(!guildConfig.isMod(message.member) && !message.member.hasPermission('VIEW_AUDIT_LOG')) {
        await message.react(icons.error);
        return;
    }

    const regex = args[0]?.match(/#?(\d+)/);
    if (regex === null || regex === undefined) {
        await message.channel.send(await util.usage(message, command.names[0]));
        return;
    }
    const id = parseInt(regex[1]);

    /** @type {ModerationData|null} */
    const moderation = await database.query("SELECT id, action, created, value, expireTime - created AS duration, reason, moderator FROM moderations WHERE id = ? AND guildid = ?",[id, message.guild.id]);

    if (moderation === null) {
        await message.channel.send('Moderation not found!');
        return;
    }

    /** @type {module:"discord.js".Message} */
    const response = await message.channel.send(`Are you sure you want to delete the moderation #${id}?`, new Discord.MessageEmbed({
        title: `Moderation #${moderation.id}`,
        description: moderations.moderationText(moderation)
    }));
    await response.react(icons.yes);
    await response.react(icons.no);
    let confirmed;
    try {
        confirmed = (await response.awaitReactions((reaction, user) => {
            return user.id === message.author.id && (reaction.emoji.name === icons.yes || reaction.emoji.name === icons.no);
        }, { max: 1, time: 15000, errors: ['time'] })).first().emoji.name === icons.yes;
    }
    catch {
        await message.channel.send("You took to long to react!");
        return;
    }
    if (!confirmed) {
        await message.channel.send("Canceled!");
        return;
    }

    await database.queryAll('DELETE FROM moderations WHERE id = ? AND guildid = ?',[id, message.guild.id]);
    await message.channel.send(`Deleted the moderation #${id}!`)

};

module.exports = command;
