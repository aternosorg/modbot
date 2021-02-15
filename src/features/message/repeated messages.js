const util = require('../../util');
const RepeatedMessage = require('../../RepeatedMessage');
const GuildConfig = require('../../GuildConfig');

/**
 * @param options
 * @param {module:"discord.js".Message} message
 * @return {Promise<void>}
 */
exports.event = async (options, message) => {
    if (!message.guild || await util.ignoresAutomod(message) || !(await GuildConfig.get(message.guild.id)).antiSpam) return;

    await RepeatedMessage.checkSpam(message)
};

