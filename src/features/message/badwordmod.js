const BadWord = require('../../BadWord');
const util = require('../../util');

exports.event = async (options, message) => {
  if (!message.guild || message.author.bot || await util.isMod(message.member) || message.member.hasPermission("MANAGE_MESSAGES")) return;

  const words = await BadWord.get(message.channel.id, message.guild.id);
  for (let [,word] of words) {
    if (word.matches(message)) {
      await util.delete(message, { reason: 'Bad words' } );
      const response = await message.reply(word.response);
      await util.logMessageDeletion(message, `bad word (ID:${word.id})`);
      await util.delete(response, { timeout: 5000 });
    }
  }
};
