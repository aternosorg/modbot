const util = require('../../util');
const RepeatedMessage = require('../../RepeatedMessage');
const GuildConfig = require('../../config/GuildConfig');

/**
 * @param options
 * @param {module:"discord.js".Message} message
 * @return {Promise<void>}
 */
exports.event = async (options, message) => {
    if (!message.guild || message.content.length === 0 || await util.ignoresAutomod(message)) return;

    /** @type {GuildConfig} */
    const guildConfig = await GuildConfig.get(message.guild.id);
    RepeatedMessage.add(message);
    if (guildConfig.antiSpam !== -1)
        await RepeatedMessage.checkSpam(message, guildConfig.antiSpam);
    if (guildConfig.similarMessages !== -1)
        await RepeatedMessage.checkSimilar(message, guildConfig.similarMessages);
};

