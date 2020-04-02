exports.message = (message, channels) => {
  if(!message.guild || message.author.bot) return;
  if(message.member.hasPermission('MANAGE_MESSAGES'))
    return;

  let mode = channels.get(message.channel.id);
  if(!mode){
    return;
  }

  if(mode === 1 && !message.content.includes('.aternos.me')){
    message.channel.send('Your message to this channel must include a valid Aternos IP.')
    .then(response =>
      response.delete({timeout: 5000})
    );
    message.delete();
    return;
  }
  if(mode === 2 && message.content.includes('.aternos.me')){
    message.channel.send('Dont advertise your server here!')
    .then(response =>
      response.delete({timeout: 5000})
    );
    message.delete();
    return;
  }
}
