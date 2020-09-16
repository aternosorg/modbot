const util = require('../../lib/util');
const AutoResponse = require('../../util/AutoResponse')

exports.event = async (database, message) => {
  if (!message.guild || message.author.bot) {
    return;
  }

  let guildConfig = await util.getGuildConfig(message);
  let responses = guildConfig.responses;
  for (let response of responses) {
    if (AutoResponse.matches(message, response)) {
      await message.channel.send(response.response);
      return;
    }
  }
};
