const config = require('../config.json');
const Discord = require('discord.js');
const util = require('../lib/util.js');
const {google} = require('googleapis');
const Fuse = require('fuse.js');
let videos = new Discord.Collection();

exports.command = async (message, args, database, bot) => {

  let guildConfig = await util.getGuildConfig(message);
  if (!guildConfig.playlist) {
    await message.channel.send('No playlist configured!');
    return ;
  }

  let query = args.join(' ').toLowerCase();
  if(!query){
    await message.channel.send('Please provide a search query');
    return ;
  }

  if(!videos.has(message.guild.id)){
    console.log(`Refreshing video cache in ${message.guild.name}...`);
    let service = google.youtube('v3');
    let response = await service.playlistItems.list({
      auth: config.googleapikey,
      part: 'snippet,contentDetails,id',
      playlistId: guildConfig.playlist,
      maxResults: 100
    });
    videos.set(message.guild.id, response.data.items);
    setTimeout(() => {clearCache(message.guild)}, 10*60*1000);
  }

  const fuse = new Fuse(videos.get(message.guild.id), {
    keys: ['snippet.title']
  });

  let video = fuse.search(query)[0];

  if (video) {
    await message.channel.send('https://youtu.be/'+video.item.snippet.resourceId.videoId);
  }
  else {
    await message.channel.send('No video found!');
  }
};

exports.names = ['tutorial','video'];

function clearCache(guild) {
    videos.delete(guild.id);
    console.log(`Cleared video cache in ${guild.name}`);
}

exports.clearCache = clearCache;
