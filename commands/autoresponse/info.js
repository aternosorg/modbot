const Discord = require("discord.js");
const util = require('../../lib/util.js');

/**
 * get info about an autoresponse
 * @param {Object} responses
 * @param {Discord.Message} message
 * @param {String[]} args
 * @returns {Promise<void>}
 */
module.exports = async (responses, message, args) => {
    if (!args.length) {
        await message.channel.send("Provide the id of the response you want to view");
        return;
    }
    let response = responses.get(parseInt(args.shift()));
    if (!response) {
        await message.channel.send("Invalid id!");
        return;
    }

    console.log(response.channels)

    await message.channel.send(new Discord.MessageEmbed()
        .setTitle("Auto-response")
        .setColor(util.color.green)
        .addFields([
            {name: "Trigger", value: `${response.trigger.type}: ${response.trigger.content}`},
            {name: "Response", value: response.response.substring(0,1000)},
            {name: "Channels", value: response.global ? "global" : '<#' + response.channels.join('>, <#') + '>'}
        ]));
}