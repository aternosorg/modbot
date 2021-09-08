const StrikeCommand = require('./StrikeCommand');
const util = require('../../util');
const {Message} = require('discord.js');

class StrikePurgeCommand extends StrikeCommand {

    static description = 'Strike a user and purge their messages';

    static names = ['strikepurge', 'sp'];

    static userPerms = ['BAN_MEMBERS'];

    async postPunishment(successes) {
        let messages = await util.getMessages(this.source.getChannel(), {
            before: this.response.id,
            limit: 100
        });
        messages = messages.filter(/** @type {Message} */msg => successes.some( u => msg.author.id === u.id));
        await util.bulkDelete(this.source.getChannel(), messages);
    }
}

module.exports = StrikePurgeCommand;
