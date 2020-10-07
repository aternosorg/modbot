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
    await message.channel.send("Please enter your trigger type (\`regex\`, \`include\` or \`match\`)!");
    let type = await getResponse(message.channel,message.author.id);

    if (type === null) {
        return;
    }

    if (!AutoResponse.triggerTypes.includes(type)) {
        return await message.channel.send("Not a valid trigger type!");
    }

    await message.channel.send("Please enter your trigger (\`example trigger\` or \`/regex/flags\`)!");
    let content = await getResponse(message.channel,message.author.id);

    if (content === null) {
        return;
    }

    let flags;
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
    options.response = await getResponse(message.channel, message.author.id, 60000);

    if (options.response === null) {
        return;
    }

    await message.channel.send("Please select the channels this auto-response should work in (\`#mention\`, \`channelid\` or \`global\`)!");
    let channels = await getResponse(message.channel, message.author.id);

    if (channels === null) {
        return;
    }

    if ((await util.channelMentions(message.guild,channels.split(" "))).length === 0 && channels.toLowerCase() !== 'global') {
        return await message.channel.send("Invalid channels. (#channel|channelId|global)")
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

async function getResponse(channel, author, timeout = 15000) {
    try {
        let result = await channel.awaitMessages(message => { return message.author.id === author; }, { max: 1, time: timeout, errors: ['time'] });
        return result.first().content;
    }
    catch {
        await channel.send("You took to long to respond.");
        return null;
    }
}
