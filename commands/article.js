const util = require('../lib/util.js');
const axios = require('axios');

const command = {};

command.description = 'Search articles in the help center';

command.usage = 'query';

command.names = ['article'];

command.execute = async (message, args, database, bot) => {

  let guildConfig = await util.getGuildConfig(message);
  if (!guildConfig.helpcenter) {
    await message.channel.send('No help center configured!');
    return ;
  }

  let query = args.join(' ').toLowerCase();
  if(!query){
    await message.channel.send(await util.usage(message, command.names[0]));
    return ;
  }


  let response = await axios.get(`https://${guildConfig.helpcenter}.zendesk.com/api/v2/help_center/articles/search.json?query=`+encodeURIComponent(query));

  if(response.data.results[0]){
    await message.channel.send(response.data.results[0].html_url);
  }
  else {
    await message.channel.send('No article found!');
  }
};

module.exports = command;
