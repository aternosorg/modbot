const util = require('../../util');
const RepeatedMessage = require('../../RepeatedMessage');

/**
 * @param options
 * @param {module:"discord.js".Message} message
 * @return {Promise<void>}
 */
exports.event = async (options, message) => {
    if (!message.guild || await util.ignoresAutomod(message)) return;

    if (RepeatedMessage.isSpam(message)) {
        const key = RepeatedMessage.getKey(message);
        await RepeatedMessage.get(key).delete();
    }
};

