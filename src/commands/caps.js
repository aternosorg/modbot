const util = require('../util.js');
const GuildConfig = require('../GuildConfig');

const command = {};

command.description = 'Turn caps moderation on or off';

command.usage = 'enabled|disabled';

command.names = ['caps','capsmod'];

command.execute = async (message, args, database, bot) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        await message.channel.send('You need the "Manage Server" permission to use this command.');
        return;
    }

    if (!args[0]) {
        await message.channel.send(await util.usage(message, command.names[0]));
        return;
    }

    const guildConfig = await GuildConfig.get(message.guild.id);
    if (args[0].toLowerCase() === 'enabled') {
        guildConfig.caps = true;
        await guildConfig.save();
        await message.channel.send('Caps moderation was enabled!')
    }
    else if (args[0].toLowerCase() === 'disabled') {
        guildConfig.caps = false;
        await guildConfig.save();
        await message.channel.send('Caps moderation was disabled!')
    }
    else {
        await message.channel.send(await util.usage(message, command.names[0]));
    }
};

module.exports = command;
