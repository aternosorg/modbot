const SubCommand = require('../../SubCommand');
const AutoResponse = require('../../../database/AutoResponse.js');
const {Snowflake} = require('discord.js');

class ListAutoResponseCommand extends SubCommand {
    static names = ['list'];

    static description = 'List all auto-responses.';

    async execute() {
        const messages = await AutoResponse.getGuildOverview(/** @type {Snowflake} */ this.source.getGuild().id)
            ?? ['This server has no auto-responses!'];
        for (const message of messages) {
            await this.reply(message);
        }
    }
}

module.exports = ListAutoResponseCommand;
