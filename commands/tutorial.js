const config = require('../config.json');
const {google} = require('googleapis');

exports.command = async (message, args, channels, database) => {

  let query = args.join(' ').toLowerCase();

  if(!query){
    await message.channel.send('Please provide a search query');
    return ;
  }

  var service = google.youtube('v3');
  let response = await service.playlistItems.list({
    auth: config.googleapikey,
    part: 'snippet,contentDetails,id',
    playlistId: "PLHn1eAE9tVwzD2pnhzfvCj9h-e06MfH2N",
    maxResults: 100
  });

  var videos = response.data.items;
  for(video of videos){
    if(video.snippet.title.toLowerCase().includes(query)){
      await message.channel.send('https://youtu.be/'+video.snippet.resourceId.videoId);
      return;
    }
  }
  await message.channel.send('No video found!');
}

exports.name = 'tutorial';
