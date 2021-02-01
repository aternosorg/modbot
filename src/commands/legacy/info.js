const Discord = require('discord.js');
const command = {};

command.description = 'Show information about this bot';

command.usage = '';

command.names = ['info','invite'];

command.execute = async (message, args, database, bot) => {
    const embed = new Discord.MessageEmbed();
    embed.setTitle('Modbot by Aternos')
    embed.addField(
        'Description',
        '[Modbot](https://github.com/aternosorg/modbot/) is a moderation bot developed by [Aternos](https://aternos.org/)\n',
        false
        );
    embed.addField(
        'Invite link',
        '[Click here](https://discordapp.com/oauth2/authorize?client_id=790967448111153153&scope=bot&permissions=268446806)',
        true
    )
    embed.addField(
        'Github',
        '[Click here](https://github.com/aternosorg/modbot/)',
        true
    )
    await message.channel.send(embed);
}

module.exports = command;