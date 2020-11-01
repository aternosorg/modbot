const BadWord = require('../../BadWord');
const util = require('../../util');
const strike = require('../../commands/strike');

exports.event = async (options, message) => {
  if (!message.guild || message.author.bot || await util.isMod(message.member) || message.member.hasPermission("MANAGE_MESSAGES")) return;

  const words = await BadWord.get(message.channel.id, message.guild.id);
  for (let [,word] of words) {
    if (word.matches(message)) {
      const reason = `bad word (ID:${word.id})`;
      await util.delete(message, { reason: reason } );
      const response = await message.reply(word.response);
      await util.logMessageDeletion(message, reason);
      await util.delete(response, { timeout: 5000 });
      if (word.punishment.action !== 'none') {
        await strike.executePunishment(word.punishment, message.guild, message.author, options.bot, options.database, reason);
      }
      return;
    }
  }
};