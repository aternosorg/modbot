const util = require('../util.js');

const command = {};

command.description = 'Delete a specific moderation';

command.usage = '<#moderationid>';

command.names = ['deletemoderation','delmod'];

command.execute = async (message, args, database, bot) => {
    if(!await util.isMod(message.member) && !message.member.hasPermission('VIEW_AUDIT_LOG')) {
        await message.react(util.icons.error);
        return;
    }

    const regex = args[0].match(/#?(\d+)/);
    if (regex === null) {
        await message.channel.send(await util.usage(message, command.names[0]));
        return;
    }
    const id = parseInt(regex[1]);

    /** @type {ModerationData|null} */
    const moderation = await database.query("SELECT id FROM moderations WHERE id = ?",[id]);

    if (moderation === null) {
        await message.channel.send('Moderation not found!');
        return;
    }

    /** @type {module:"discord.js".Message} */
    const response = await message.channel.send(`Are you sure you want to delete the moderation #${id}?`);
    await response.react(util.icons.yes);
    await response.react(util.icons.no);
    let confirmed;
    try {
        confirmed = (await response.awaitReactions((reaction, user) => {
            return user.id === message.author.id && (reaction.emoji.name === util.icons.yes || reaction.emoji.name === util.icons.no);
        }, { max: 1, time: 15000, errors: ['time'] })).first().emoji.name === util.icons.yes;
    }
    catch {
        await message.channel.send("You took to long to react!");
        return;
    }
    if (!confirmed) {
        await message.channel.send("Canceled!");
        return;
    }

    await database.queryAll('DELETE FROM moderations WHERE id = ?',[id]);
    await message.channel.send(`Deleted the moderation #${id}!`)

};

module.exports = command;
