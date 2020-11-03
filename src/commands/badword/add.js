const BadWord = require('../../BadWord');
const util = require('../../util.js');

/**
 * add a bad word
 * @param {module:"discord.js".Message} message
 * @returns {Promise<void>}
 */
module.exports = async (message) => {
    await message.channel.send("Please enter your trigger type (\`regex\`, \`include\` or \`match\`)!");
    let type = await util.getResponse(message.channel,message.author.id);

    if (type === null) return;

    type = type.toLowerCase();

    if (!BadWord.triggerTypes.includes(type)) {
        return await message.channel.send("Not a valid trigger type!");
    }

    await message.channel.send(`Please enter your trigger (${ type === 'regex' ? '`/regex/flags`' :'`example trigger`'})!`);
    let content = await util.getResponse(message.channel,message.author.id);

    if (content === null) return;

    content = content.replace(/^`(.*)`$/,(a,b) => b);

    let flags;
    if (type === 'regex') {
        let regex = content.split(/(?<!\\)\//).slice(1,3);
        if (regex.length < 1) {
            return await message.channel.send("Invalid regex");
        }
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
        },
        punishment: {
            action: null,
            duration: null
        },
        global: null,
        channels: []
    };

    await message.channel.send(`Please enter your punishment type (\`${BadWord.punishmentTypes.join('\`, \`')}\`) and duration!`);
    let punishmentInfo = await util.getResponse(message.channel,message.author.id);

    if (punishmentInfo === null) return;

    punishmentInfo = util.split(punishmentInfo,' ');

    options.punishment = {
        action: punishmentInfo.shift().toLowerCase(),
        duration: punishmentInfo.join(' ')
    };

    if (!BadWord.punishmentTypes.includes(options.punishment.action)) {
        return await message.channel.send("Not a valid punishment type!");
    }

    await message.channel.send("Please select the channels this word should be forbidden in (\`#mention\`, \`channelid\` or \`global\`)!");
    let channels = await util.getResponse(message.channel, message.author.id);

    if (channels === null) return;

    if ((await util.channelMentions(message.guild,channels.split(" "))).length === 0 && channels.toLowerCase() !== 'global') {
        return await message.channel.send("Invalid channels. (#channel|channelId|global)");
    }

    if (channels === 'global') {
        options.global = true;
    }
    else {
        options.global = false;
        options.channels = await util.channelMentions(message.guild,channels.split(" "));
    }

    const badWord = new BadWord(/** @type {module:"discord.js".Snowflake} */message.guild.id, options);
    badWord.id = await badWord.save();

    await message.channel.send(badWord.embed("Added new bad word",util.color.green));
};
