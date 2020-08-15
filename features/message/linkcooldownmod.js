const util = require('../../lib/util');
let links = {};

exports.event = async (database, message) => {
  if (!message.guild || await util.ignoresAutomod(message)) {
    return;
  }

  let link = String(message.content).match(/https?:\/\/([\w\.\/]+)/);
  if (!link || link.length < 2) {
    return ;
  }
  link = link[1];

  let guild = await util.getGuildConfig(message.guild.id);

  console.log(guild);

  if (!guild.linkCooldown) {
    return ;
  }


  if (links[link]) {
    await message.delete();
    await util.logMessageDeletion(message, `https://${link} is on cooldown`);
  }
  else {
    links[link] = true;
    setTimeout(() => {
      if (links[link]) {
        delete links[link];
      }
    }, guild.linkCooldown * 1000);
  }


};
