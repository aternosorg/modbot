const SubCommand = require('../../SubCommand');
const BadWord = require('../../../BadWord');
const {Snowflake} = require('discord.js');

class ListBadWordCommand extends SubCommand {
    static names = ['list'];

    static description = 'List all bad-words.';

    async execute() {
        const messages = await BadWord.getGuildOverview(/** @type {Snowflake} */ this.source.getGuild().id)
            ?? ['This server has no bad-words!'];
        for (const message of messages) {
            await this.reply(message);
        }
    }
}

module.exports = ListBadWordCommand;