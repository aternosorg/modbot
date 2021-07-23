const util = require('../../util');
const Log = require('../../Log');
const GuildConfig = require('../../config/GuildConfig');
const Member = require('../../Member');

exports.event = async (options, message) => {
    if (!message.guild || await util.ignoresAutomod(message)) return;

    /** @type {GuildConfig} */
    const guildConfig = await GuildConfig.get(message.guild.id);
    if (guildConfig.maxMentions === -1 || message.mentions.users.size <= guildConfig.maxMentions) return;

    if (message.deletable) {
        const reason = `Mentioning ${message.mentions.users.size} users`;
        await util.delete(message);
        await Log.logMessageDeletion(message, reason);
        const response = await message.channel.send(`<@!${message.author.id}> You're not allowed to mention more than ${guildConfig.maxMentions} users!`);
        await util.delete(response, { timeout: 3000 });
        await (new Member(message.author, message.guild))
            .executePunishment({ action: 'strike' }, options.database, reason);
    }
};
