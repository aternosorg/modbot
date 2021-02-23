const util = require('../../util');
const Log = require('../../Log');
const GuildConfig = require('../../GuildConfig');
const strike = require('../../commands/legacy/strike');

exports.event = async (options, message) => {
    if (!message.guild || await util.ignoresAutomod(message)) return;

    /** @type {GuildConfig} */
    const guildConfig = await GuildConfig.get(message.guild.id);
    if (guildConfig.maxMentions === -1 || message.mentions.users.size <= guildConfig.maxMentions) return;

    if (message.deletable) {
        const reason = `Mentioning ${message.mentions.users.size} users`;
        await util.delete(message, { reason });
        await Log.logMessageDeletion(message, reason);
        /** @type {module:"discord.js".Message} */
        const response = await message.channel.send(`<@!${message.author.id}> You're not allowed to mention more than ${guildConfig.maxMentions} users!`);
        await response.delete({ timeout: 3000 });
        await strike.executePunishment({ action: 'strike' }, message.guild, message.author, options.bot, options.database, reason)
    }
};
