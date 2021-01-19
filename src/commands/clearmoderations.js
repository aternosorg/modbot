const util = require('../util.js');
const GuildConfig = require('../GuildConfig');

const command = {};

command.description = 'Delete all moderations for a user';

command.usage = '<@user|userId>';

command.names = ['clearmoderations','clearlogs'];

command.execute = async (message, args, database, bot) => {
    const guildconfig = GuildConfig.get(message.guild.id);
    if(!guildconfig.isMod(message.member) && !message.member.hasPermission('VIEW_AUDIT_LOG')) {
        await message.react(util.icons.error);
        return;
    }

    const userId = util.userMentionToId(args.shift());
    if (!userId) {
        await message.channel.send(await util.usage(message, command.names[0]));
        return;
    }

    let user;
    try {
        user = await bot.users.fetch(userId);
    } catch {
        await message.react(util.icons.error);
        await message.channel.send("User not found!");
        return;
    }

    /** @type {ModerationData[]} */
    const moderations = await database.queryAll("SELECT COUNT(id) FROM moderations WHERE userid = ? AND guildid = ?",[userId,message.guild.id]);

    if (moderations[0]["COUNT(id)"] === 0) {
        await message.channel.send('This user doesn\'t have any moderations!');
        return;
    }

    /** @type {module:"discord.js".Message} */
    const response = await message.channel.send(`Are you sure you want to delete all moderations for <@${user.id}>?`)
    await response.react(util.icons.yes);
    await response.react(util.icons.no);
    let confirmed;
    try {
        confirmed = (await response.awaitReactions((reaction, user) => {
            return user.id === message.author.id && (reaction.emoji.name === util.icons.yes || reaction.emoji.name === util.icons.no);
        }, { max: 1, time: 15000, errors: ['time'] })).first().emoji.name === util.icons.yes;
    }
    catch {
        await message.channel.send("You took to long to react!");
        return;
    }
    if (!confirmed) {
        await message.channel.send("Canceled!");
        return;
    }

    /** @property {Number} affectedRows */
    const deletion = await database.queryAll('DELETE FROM moderations WHERE guildid = ? AND userid = ?',[message.guild.id, user.id]);
    await message.channel.send(`Deleted ${deletion.affectedRows} ${deletion.affectedRows === 1 ? 'moderation' : 'moderations'}!`)

};

module.exports = command;
