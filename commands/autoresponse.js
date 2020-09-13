const Discord = require("discord.js");
const util = require('../lib/util.js');
const AutoResponse = require('../util/AutoResponse');

const command = {};

command.description = 'Adds and lists auto-responses';

command.usage = '<list|add|edit|remove>';

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

    let guildconfig = await util.getGuildConfig(message);
    let responses = guildconfig.responses;

    switch (args[0].toLowerCase()) {
        case 'list':
            console.log(responses);
            if (!responses.length) {
                return await message.channel.send("No auto-responses!");
            }

            let text = '';
            for (const response of responses) {
                text += response.triggers[0];
            }
            await message.reply(text.substring(0, 2000))
            break;

        case 'add':

            await message.channel.send("Please enter your trigger type (regex, include or match)!");
            let trigger = {};
            try {
                trigger.type = (await message.channel.awaitMessages(response => {
                    return response.author.id === message.author.id && AutoResponse.triggerTypes.includes(response.content.toLowerCase())
                }, { max: 1, time: 15000, errors: ['time'] })).first();
            }
            catch {
                return await message.channel.send("You took to long to respond.");
            }

            await message.channel.send("Please enter your trigger (/regex/flags or String)!");
            try {
                trigger.content = (await message.channel.awaitMessages(response => {
                    return response.author.id === message.author.id
                }, { max: 1, time: 15000, errors: ['time'] })).first();
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

            await message.channel.send("Please select the channels this auto-response should work in (#mention, channelid or global)!");
            let channels;
            try {
                channels = (await message.channel.awaitMessages(async response => {
                    return response.author.id === message.author.id && (await util.channelMentions(message.guild,response.content.split(" "))).length || response.content.toLowerCase() === 'global'
                }, { max: 1, time: 15000, errors: ['time'] })).first().content.split(" ");
            }
            catch {
                return await message.channel.send("You took to long to respond.");
            }
            if (channels === 'global') {
                options.global = true;
            }
            else {
                options.global = false;
                options.channels = await util.channelMentions(message.guild,channels);
            }

            await message.channel.send("Please enter your response!");
            try {
                options.response = (await message.channel.awaitMessages(response => {
                    return response.author.id === message.author.id
                }, { max: 1, time: 15000, errors: ['time'] })).first().content;
            }
            catch {
                return await message.channel.send("You took to long to respond.");
            }

            guildconfig.responses.push(new AutoResponse(message.guild.id, options));

            await util.saveGuildConfig(guildconfig);

            let embed = new Discord.MessageEmbed()
                .setTitle("Added new auto-response")
                .setColor(util.color.green)
                .addFields([
                    {name: "Trigger", value: `${options.trigger.type}: ${options.trigger.content}`},
                    {name: "Response", value: options.response.substring(0,1000)},
                    {name: "Channels", value: options.channels.length ? '<#' + options.channels.join('>, <#') + '>' : "global"}
                ]);

            await message.channel.send(embed);
            break;

        case 'edit':

            break;

        case 'remove':

            break;

        default:
            return await message.channel.send(await util.usage(message,command.names[0]));
    }
};

module.exports = command;
