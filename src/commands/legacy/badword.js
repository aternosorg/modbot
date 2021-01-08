const command = {};
const BadWord = require('../../BadWord');
const util = require('../../util');

const list = require('./badword/list');
const add = require('./badword/add');
const remove = require('./badword/remove');
const info = require('./badword/info');

command.description = 'Adds, removes and lists bad words';

command.usage = '<list|add|info|remove> <id>';

command.names = ['badword','badwords','blacklist'];

command.execute = async (message, args, database, bot) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        await message.channel.send('You need the "Manage Server" permission to use this command.');
        return;
    }
    if (!args.length) {
        return await message.channel.send(await util.usage(message,command.names[0]));
    }

    let responses = await BadWord.getAll(message.guild.id);

    switch (args.shift().toLowerCase()) {
        case 'list':
            await list(responses,message);
            break;

        case 'add':
            await add(message);
            break;

        case 'delete':
        case 'remove':
            await remove(responses, message, args);
            break;

        case 'info':
            await info(responses, message, args);
            break;

        default:
            return await message.channel.send(await util.usage(message,command.names[0]));
    }
}

module.exports = command;
