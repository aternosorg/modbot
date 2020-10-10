const util = require('../../lib/util');
const AutoResponse = require('../../util/AutoResponse')

exports.event = async (database, message) => {
  if (!message.guild || message.author.bot) {
    return;
  }

  let responses = await util.getAutoResponses(message.channel.id, message.guild.id);
  for (let [,response] of responses) {
    if (response.matches(message)) {
      await message.channel.send(response.response);
      return;
    }
  }
};
