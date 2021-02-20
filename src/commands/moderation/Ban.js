const TimedModerationCommand = require('../TimedModerationCommand');
const GuildUserHandler = require('../../GuildUserHandler')

class BanCommand extends TimedModerationCommand {

    static description = 'Ban a user';

    static names = ['ban'];

    static userPerms = ['BAN_MEMBERS'];

    static botPerms = ['BAN_MEMBERS'];

    static type = {
        execute: 'ban',
        done: 'banned',
    };

    async executePunishment(target) {
        const guildUserHandler = new GuildUserHandler(target, this.message.guild);
        await guildUserHandler.ban(this.reason, this.message.author, this.duration);
    }
}

module.exports = BanCommand;
