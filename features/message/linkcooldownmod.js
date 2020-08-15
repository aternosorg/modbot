const util = require('../../lib/util');
let users = {};

exports.event = async (database, message) => {
  if (!message.guild || await util.ignoresAutomod(message)) {
    return;
  }

  if (!String(message.content).match(/https?:\/\//)) {
    return ;
  }

  let guild = await util.getGuildConfig(message.guild.id);

  if (!guild.linkCooldown) {
    return ;
  }

  if (users[message.author.id]) {
    await message.delete();
    await util.logMessageDeletion(message, `link cooldown`);
  }
  else {
    users[message.author.id] = true;
    setTimeout(() => {
      if (users[message.author.id]) {
        delete users[message.author.id];
      }
    }, guild.linkCooldown * 1000);
  }
};
