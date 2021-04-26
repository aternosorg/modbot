const ModerationCommand = require('../ModerationCommand');
const Member = require('../../Member')

class KickCommand extends ModerationCommand {

    static description = 'Kick a user';

    static names = ['kick'];

    static userPerms = ['KICK_MEMBERS'];

    static botPerms = ['KICK_MEMBERS'];

    static type = {
        execute: 'kick',
        done: 'kicked',
    };

    async executePunishment(target) {
        const member = new Member(target, this.message.guild);
        if (await member.fetchMember() === null) {
            await this.sendError(`**${target.tag}** is not in this guild!`);
            return false;
        }
        await member.kick(this.database, this.reason, this.message.author);
        return true;
    }
}

module.exports = KickCommand;
