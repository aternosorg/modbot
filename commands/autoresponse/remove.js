const Discord = require("discord.js");
const util = require('../../lib/util.js');

/**
 * remove an auto-response
 * @param {Object} responses
 * @param {Discord.Message} message
 * @param {String[]} args
 * @param {Database} database
 * @returns {Promise<void>}
 */
module.exports = async (responses, message, args, database) => {
    if (!args.length) {
        await message.channel.send("Provide the id of the response you want to remove");
        return;
    }
    let response = responses.get(parseInt(args.shift()));
    if (!response) {
        await message.channel.send("Invalid id!");
        return;
    }

    let confirmation = await message.channel.send("Do you really want to delete this response?",new Discord.MessageEmbed()
        .setTitle("Remove auto-response")
        .setColor(util.color.red)
        .addFields([
            {name: "Trigger", value: `${response.trigger.type}: ${response.trigger.content}`},
            {name: "Response", value: response.response.substring(0,1000)},
            {name: "Channels", value: response.global ? "global" : '<#' + response.channels.join('>, <#') + '>'}
        ]));
    {
        let yes = confirmation.react(util.icons.yes);
        let no = confirmation.react(util.icons.no);
        await Promise.all([yes,no]);
    }

    let confirmed;
    try {
        confirmed = (await confirmation.awaitReactions((reaction, user) => {
            return user.id === message.author.id && (reaction.emoji.name === util.icons.yes || reaction.emoji.name === util.icons.no)
        }, { max: 1, time: 15000, errors: ['time'] })).first().emoji.name === util.icons.yes;
    }
    catch {
        return await message.channel.send("You took to long to react!");
    }
    if (!confirmed) {
        return await message.channel.send("Cancelled!");
    }

    await database.query("DELETE FROM responses WHERE id = ?",[id]);
    await util.refreshResponses(message.guild.id);

    await message.channel.send("Removed!");
}