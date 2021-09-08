const StrikeCommand = require('./StrikeCommand');
const Member = require('../../Member');

class PardonCommand extends StrikeCommand {

    static description = 'Remove a strike from a user';

    static names = ['pardon'];

    static type = {
        execute: 'pardon',
        done: 'pardoned',
    };

    async executePunishment(target) {
        const member = new Member(target, this.source.getGuild());
        await member.pardon(this.database, this.reason, this.source.getUser(), this.count);
        return true;
    }
}

module.exports = PardonCommand;
