const ModerationCommand = require('../ModerationCommand');
const Member = require('../../Member');

class SoftBanCommand extends ModerationCommand {

    static description = 'Softban a user';

    static comment = 'A softban kicks the user and deletes their recent messages.';

    static names = ['softban'];

    static userPerms = ['BAN_MEMBERS'];

    static botPerms = ['BAN_MEMBERS'];

    static type = {
        execute: 'softban',
        done: 'softbanned',
    };

    async executePunishment(target) {
        const member = new Member(target, this.message.guild);
        if (await member.fetchMember() === null) {
            await this.sendError(`**${target.tag}** is not in this guild!`);
            return false;
        }
        await member.softban(this.database, this.reason, this.message.author);
        return true;
    }
}

module.exports = SoftBanCommand;
