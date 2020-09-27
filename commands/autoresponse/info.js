const Discord = require("discord.js");
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
    let id = parseInt(args.shift());
    if (!responses[id]) {
        await message.channel.send("Invalid id!");
        return;
    }
    let response = responses[id];

    await message.channel.send(new Discord.MessageEmbed()
        .setTitle("Auto-response")
        .setColor(util.color.green)
        .addFields([
            {name: "Trigger", value: `${response.trigger.type}: ${response.trigger.content}`},
            {name: "Response", value: response.response.substring(0,1000)},
            {name: "Channels", value: response.global ? "global" : '<#' + response.channels.join('>, <#') + '>'}
        ]));
}