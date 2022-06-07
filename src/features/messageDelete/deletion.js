const util = require('../../util.js');
const Log = require('../../Log');
const Discord = require('discord.js');

let ignore = new Discord.Collection();
const cache = 30*1000;
exports.event = async (options, message) => {
    if (!message.guild || message.author.bot || ignore.has(message.id)) {
        return;
    }

    let content = message.content.substring(0,2048);
    for (const [,attachment] of message.attachments) {
        if (content.length + attachment.url.length > 2048) {break;}
        content += ` ${attachment.url}`;
    }
    let embed;
    if (message.system) {
        embed = new Discord.MessageEmbed()
            .setColor(util.color.red)
            .setAuthor({
                name: `A system message in #${message.channel.name} was deleted`
            });
    }
    else if(content.length === 0) {
        embed = new Discord.MessageEmbed()
            .setColor(util.color.red)
            .setAuthor({
                name: `Empty message by ${util.escapeFormatting(message.author.tag)} in #${message.channel.name} was deleted`,
                iconURL: message.author.avatarURL()
            })
            .setFooter({text: message.author.id});
    }
    else{
        embed = new Discord.MessageEmbed()
            .setColor(util.color.red)
            .setAuthor({
                name: `Message by ${util.escapeFormatting(message.author.tag)} in #${message.channel.name} was deleted`,
                iconURL: message.author.avatarURL()
            })
            .setDescription(content)
            .setFooter({text: message.author.id});
    }

    await Log.messageLogEmbed(message, embed);
};

exports.ignore = (id) => {
    ignore.set(id, Date.now());
};

exports.purgeCache = () => {
    ignore = ignore.filter(timestamp => timestamp > Date.now() + cache);
};
