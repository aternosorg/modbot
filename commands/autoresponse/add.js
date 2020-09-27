const AutoResponse = require('../../util/AutoResponse');
const Discord = require("discord.js");
const util = require('../../lib/util.js');

/**
 * add an autoresponse
 * @param {Object} responses
 * @param {Discord.Message} message
 * @returns {Promise<void>}
 */
module.exports = async (responses, message) => {
    await message.channel.send("Please enter your trigger type (regex, include or match)!");
    let type, content, flags;
    try {
        type = (await message.channel.awaitMessages(response => {
            return response.author.id === message.author.id && AutoResponse.triggerTypes.includes(response.content.toLowerCase())
        }, { max: 1, time: 15000, errors: ['time'] })).first().content;
    }
    catch {
        return await message.channel.send("You took to long to respond.");
    }

    await message.channel.send("Please enter your trigger (/regex/flags or String)!");
    try {
        content = (await message.channel.awaitMessages(response => {
            return response.author.id === message.author.id
        }, { max: 1, time: 15000, errors: ['time'] })).first().content;
    }
    catch {
        return await message.channel.send("You took to long to respond.");
    }

    if (type === 'regex') {
        let regex = content.split('/').slice(1,3);
        try {
            new RegExp(regex[0],regex[1]);
        }
        catch (e) {
            return await message.channel.send("Invalid regex");
        }
        content = regex[0];
        flags = regex[1];
    }
    let options = {
        trigger: {
            type: type,
            content: content,
            flags: flags
        }
    };

    await message.channel.send("Please enter your response!");
    try {
        options.response = (await message.channel.awaitMessages(response => {
            return response.author.id === message.author.id
        }, { max: 1, time: 60000, errors: ['time'] })).first().content;
    }
    catch {
        return await message.channel.send("You took to long to respond.");
    }

    await message.channel.send("Please select the channels this auto-response should work in (#mention, channelid or global)!");
    let channels;
    try {
        channels = (await message.channel.awaitMessages(async response => {
            return response.author.id === message.author.id && (await util.channelMentions(message.guild,response.content.split(" "))).length || response.content.toLowerCase() === 'global'
        }, { max: 1, time: 60000, errors: ['time'] })).first().content;
    }
    catch {
        return await message.channel.send("You took to long to respond.");
    }
    if (channels === 'global') {
        options.global = true;
    }
    else {
        options.global = false;
        options.channels = await util.channelMentions(message.guild,channels.split(" "));
    }

    await util.saveResponse(new AutoResponse(message.guild.id, options));

    let embed = new Discord.MessageEmbed()
        .setTitle("Added new auto-response")
        .setColor(util.color.green)
        .addFields([
            {name: "Trigger", value: `${options.trigger.type}: ${options.trigger.content}`},
            {name: "Response", value: options.response.substring(0,1000)},
            {name: "Channels", value: options.channels ? '<#' + options.channels.join('>, <#') + '>' : "global"}
        ]);

    await message.channel.send(embed);
}