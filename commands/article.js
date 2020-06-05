const config = require('../config.json');

exports.command = async (message, args, channels, database) => {

  let query = args.join(' ').toLowerCase();

  if(!query){
    await message.channel.send('Please provide a search query');
    return ;
  }
  const axios = require('axios');

  let response = await axios.get('https://aternos.zendesk.com/api/v2/help_center/articles/search.json?query='+query)

  if(response.data.results[0]){
    await message.channel.send(response.data.results[0].html_url);
  }
  else {
    await message.channel.send('No article found!');
  }
}

exports.name = 'article';
