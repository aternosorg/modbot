const TimedModerationCommand = require('../TimedModerationCommand');
const Member = require('../../Member');

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
        const member = new Member(target, this.message.guild);
        await member.ban(this.database, this.reason, this.message.author, this.duration);
        return true;
    }
}

module.exports = BanCommand;
