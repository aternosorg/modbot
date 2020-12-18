const BadWord = require('../../BadWord');
const util = require('../../util');
const strike = require('../../commands/strike');

exports.event = async (options, message) => {
  if (!message.guild || await util.ignoresAutomod(message)) return;

  const words = await BadWord.get(message.channel.id, message.guild.id);
  for (let [,word] of words) {
    if (word.matches(message)) {
      const reason = 'Using forbidden words or phrases';
      await util.delete(message, { reason: reason } );
      if (word.response !== 'disabled') {
        const response = await message.reply(word.response === 'default' ? BadWord.defaultResponse : word.response);
        await util.delete(response, { timeout: 3000 });
      }
      await util.logMessageDeletion(message, reason);
      if (word.punishment.action !== 'none') {
        await strike.executePunishment(word.punishment, message.guild, message.author, options.bot, options.database, reason);
      }
      return;
    }
  }
};
