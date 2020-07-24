const config = require('../config.json');
const {google} = require('googleapis');
const Fuse = require('fuse.js');
let videos;

exports.command = async (message, args, database, bot) => {

  let query = args.join(' ').toLowerCase();

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

  const fuse = new Fuse(videos, {
    keys: ['snippet.title']
  })

  let video = fuse.search(query)[0];

  if (video) {
    await message.channel.send('https://youtu.be/'+video.item.snippet.resourceId.videoId);
  }
  else {
    await message.channel.send('No video found!');
  }
}

exports.names = ['tutorial','video'];
