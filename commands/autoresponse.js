const Discord = require("discord.js");
const util = require('../lib/util.js');
const AutoResponse = require('../util/AutoResponse');

const command = {};

command.description = 'Adds and lists auto-responses';

command.usage = '<list|add|info|remove> <id>';

command.names = ['autoresponse','response'];

command.execute = async (message, args, database, bot) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        await message.channel.send('You need the "Manage Server" permission to use this command.');
        return;
    }
    if (!args.length) {
        return await message.channel.send(await util.usage(message,command.names[0]));
    }

    let guildConfig = await util.getGuildConfig(message);
    let responses = guildConfig.responses;
    let id, response;

    switch (args.shift().toLowerCase()) {
        case 'list':
            if (!responses.length) {
                return await message.channel.send("No auto-responses!");
            }

            let text = '';
            for (const [key, response] of responses.entries()) {
                text += `[${key}] (${response.trigger.type}): \`${response.trigger.content.replace('`','\`')}\` \n`;
            }
            await message.channel.send(text.substring(0, 2000));
            break;

        case 'add':
            await message.channel.send("Please enter your trigger type (regex, include or match)!");
            let trigger = {};
            try {
                trigger.type = (await message.channel.awaitMessages(response => {
                    return response.author.id === message.author.id && AutoResponse.triggerTypes.includes(response.content.toLowerCase())
                }, { max: 1, time: 15000, errors: ['time'] })).first().content;
            }
            catch {
                return await message.channel.send("You took to long to respond.");
            }

            await message.channel.send("Please enter your trigger (/regex/flags or String)!");
            try {
                trigger.content = (await message.channel.awaitMessages(response => {
                    return response.author.id === message.author.id
                }, { max: 1, time: 15000, errors: ['time'] })).first().content;
            }
            catch {
                return await message.channel.send("You took to long to respond.");
            }

            if (trigger.type === 'regex') {
                let regex = trigger.content.split('/');
                try {
                    new RegExp(regex[0],regex[1]);
                }
                catch {
                    return await message.channel.send("Invalid regex");
                }
            }
            let options = {
                trigger: trigger
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

            guildConfig.responses.push(new AutoResponse(message.guild.id, options));

            await util.saveGuildConfig(guildConfig);

            let embed = new Discord.MessageEmbed()
                .setTitle("Added new auto-response")
                .setColor(util.color.green)
                .addFields([
                    {name: "Trigger", value: `${options.trigger.type}: ${options.trigger.content}`},
                    {name: "Response", value: options.response.substring(0,1000)},
                    {name: "Channels", value: options.channels ? '<#' + options.channels.join('>, <#') + '>' : "global"}
                ]);

            await message.channel.send(embed);
            break;

        case 'remove':
            if (!args.length) {
                await message.channel.send("Provide the id of the response you want to remove");
                return;
            }
            id = parseInt(args.shift());
            if (!responses[id]) {
                await message.channel.send("Invalid id!");
                return;
            }
            response = responses[id];

            let confirmation = await message.channel.send("Do you really want to delete this response?",new Discord.MessageEmbed()
                .setTitle("Added new auto-response")
                .setColor(util.color.green)
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
            guildConfig.responses = responses.slice(0, id).concat(responses.slice(id + 1, responses.length));
            await util.saveGuildConfig(guildConfig);
            await message.channel.send("Removed!");
            break;

        case "info":
            if (!args.length) {
                await message.channel.send("Provide the id of the response you want to view");
                return;
            }
            id = parseInt(args.shift());
            if (!responses[id]) {
                await message.channel.send("Invalid id!");
                return;
            }
            response = responses[id];

            await message.channel.send("Do you really want to delete this response?",new Discord.MessageEmbed()
                .setTitle("Added new auto-response")
                .setColor(util.color.green)
                .addFields([
                    {name: "Trigger", value: `${response.trigger.type}: ${response.trigger.content}`},
                    {name: "Response", value: response.response.substring(0,1000)},
                    {name: "Channels", value: response.global ? "global" : '<#' + response.channels.join('>, <#') + '>'}
                ]));
            break;

        default:
            return await message.channel.send(await util.usage(message,command.names[0]));
    }
};

module.exports = command;
