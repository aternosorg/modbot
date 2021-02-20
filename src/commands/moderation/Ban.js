const TimedModerationCommand = require('../TimedModerationCommand');
const util = require('../../util')
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
        const reason = `${this.message.author.username}#${this.message.author.discriminator} ${this.duration ? `(${util.secToTime(this.duration)}) ` : ''}| ${this.reason}`;
        await this.message.guild.members.ban(target.id, {days: 1, reason});
    }
}

module.exports = BanCommand;
