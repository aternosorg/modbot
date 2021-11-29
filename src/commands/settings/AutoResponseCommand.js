const {ConfigCommand} = require('../ConfigCommand');
const SubCommand = require('../SubCommand');
const AutoResponse = require('../../AutoResponse');
const {Snowflake, Collection} = require('discord.js');

class ListAutoResponseCommand extends SubCommand {

    static names = ['list'];

    static description = 'List all auto-responses.';

    static getParentCommand() {
        return AutoResponseCommand;
    }

    async execute() {
        /** @type {Collection<Number,AutoResponse>} */
        const responses = await AutoResponse.getAll(/** @type {Snowflake} */ this.message.guild.id);
        if (!responses.size) return this.reply('No auto-responses!');

        let text = '';
        for (const [id, response] of responses) {
            const info = `[${id}] ${response.global ? 'global' : response.channels.map(c => `<#${c}>`).join(', ')} ` +
                '`' + response.trigger.asString() + '`\n';

            if (text.length + info.length < 2000) {
                text += info;
            } else {
                await this.reply(text);
                text = info;
            }
        }
        if (text.length) await this.reply(text);
    }
}

class AutoResponseCommand extends ConfigCommand {

    static description = 'Manage auto-responses';

    static names = ['autoresponse','response'];

    static userPerms = ['MANAGE_GUILD'];


    static getSubCommands() {
        return [ListAutoResponseCommand];
    }
}

module.exports = AutoResponseCommand;
