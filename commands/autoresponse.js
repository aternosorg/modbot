const util = require('../lib/util.js');
const AutoResponse = require('../util/AutoResponse');

const list = require('./autoresponse/list');
const add = require('./autoresponse/add');
const remove = require('./autoresponse/remove');
const info = require('./autoresponse/info');

const command = {};

command.description = 'Adds and lists auto-responses';

command.usage = '<list|add|info|remove> <id>';

command.names = ['autoresponse','response','responses','autoresponses'];

command.execute = async (message, args, database, bot) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        await message.channel.send('You need the "Manage Server" permission to use this command.');
        return;
    }
    if (!args.length) {
        return await message.channel.send(await util.usage(message,command.names[0]));
    }

    let responses = await AutoResponse.getAllAutoResponses(message.guild.id);

    switch (args.shift().toLowerCase()) {
        case 'list':
            await list(responses,message);
            break;

        case 'add':
            await add(responses, message);
            break;

        case 'delete':
        case 'remove':
            await remove(responses, message, args, database);
            break;

        case 'info':
            await info(responses, message, args);
            break;

        default:
            return await message.channel.send(await util.usage(message,command.names[0]));
    }
};

module.exports = command;
