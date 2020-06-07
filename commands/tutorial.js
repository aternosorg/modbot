const config = require('../config.json');
const {google} = require('googleapis');
let videos;

exports.command = async (message, args, channels, database) => {

  let query = args.join(' ').toLowerCase().replace(/[^\w]/g,"");

  if(!query){
    await message.channel.send('Please provide a search query');
    return ;
  }

  if(!videos){
    console.log('Refreshing video cache...');
    let service = google.youtube('v3');
    let response = await service.playlistItems.list({
      auth: config.googleapikey,
      part: 'snippet,contentDetails,id',
      playlistId: "PLHn1eAE9tVwzD2pnhzfvCj9h-e06MfH2N",
      maxResults: 100
    });
    videos = response.data.items;
    setTimeout(() => {
      videos = null;
      console.log('Cleared video cache');
    }, 10*60*1000);
  }

  for(video of videos){
    if(video.snippet.title.replace(/[^\w]/g,"").toLowerCase().includes(query)){
      await message.channel.send('https://youtu.be/'+video.snippet.resourceId.videoId);
      return;
    }
  }
  await message.channel.send('No video found!');
}

exports.name = 'tutorial';
