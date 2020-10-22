const AutoResponse = require('../../util/AutoResponse');

exports.event = async (options, message) => {
  if (!message.guild || message.author.bot) {
    return;
  }

  const triggered = [];

  const responses = await AutoResponse.getAutoResponses(message.channel.id, message.guild.id);
  for (let [,response] of responses) {
    if (response.matches(message)) {
      triggered.push(response.response);
    }
  }

  if (triggered.length) {
    await message.channel.send(triggered[Math.floor(Math.random() * triggered.length)]);
  }
};
