const util = require('../../util.js');
const Log = require('../../discord/GuildLog.js');
const Discord = require('discord.js');
const jsdiff = require('diff');

exports.event = async (options, old, newMsg) => {
    if (old.author.bot || !old.guild) {
        return;
    }
    if (old.content === newMsg.content) {
        return;
    }

    let diff = jsdiff.diffWords(old.content, newMsg.content);

    let formatted = '';
    let maxLength = 1985;
    for (let part of diff) {

        //escape formatting in message
        part.value = part.value.replace(/([_~])/g,'\\$1');

        let maxPartLength = maxLength - formatted.length;
        if (part.added) {
            formatted += `__${part.value.substr(0, maxPartLength - 4)}__`;
        }
        else if (part.removed) {
            formatted += `~~${part.value.substr(0, maxPartLength - 4)}~~ `;
        }
        else {
            formatted += part.value.substr(0, maxPartLength);
        }
        if(maxLength - formatted.length <= 0){
            break;
        }
    }

    let embed = new Discord.MessageEmbed()
        .setColor(util.color.orange)
        .setAuthor({
            name: `Message by ${util.escapeFormatting(old.author.tag)} in #${old.channel.name} was edited`,
            iconURL: old.author.avatarURL()
        })
        .setDescription(
            formatted
        )
        .setFooter({text: old.author.id});

    await Log.messageLogEmbed(old, embed);
};
