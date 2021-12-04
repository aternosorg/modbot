const {ConfigCommand} = require('../ConfigCommand');
const SubCommand = require('../SubCommand');
const AutoResponse = require('../../AutoResponse');
const {Snowflake, Collection} = require('discord.js');
const util = require('../../util');

class ListAutoResponseCommand extends SubCommand {

    static names = ['list'];

    static description = 'List all auto-responses.';

    static getParentCommand() {
        return AutoResponseCommand;
    }

    async execute() {
        /** @type {Collection<Number,AutoResponse>} */
        const responses = await AutoResponse.getAll(/** @type {Snowflake} */ this.source.getGuild().id);
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

class AddAutoResponseCommand extends SubCommand {

    static names = ['add'];

    static description = 'Add an auto-response.';

    static usage = 'all|<channels> regex|include|match <trigger>';

    static getParentCommand() {
        return AutoResponseCommand;
    }

    async execute() {
        const trigger = this.options.getString('trigger'),
            type = this.options.getString('type'),
            all = this.options.getBoolean('all'),
            channels = util.channelMentions(this.source.getGuild(), this.options.getString('channels')?.split(' '));

        if (!trigger || (!all && !channels.length)) {
            await this.sendUsage();
            return;
        }
        if (!AutoResponse.triggerTypes.includes(type)) {
            await this.sendError(`Unknown trigger type! Use one of ${AutoResponse.triggerTypes.join(', ')}`);
            return;
        }

        let message = this.options.getString('message');
        if (!this.source.isInteraction) {
            await this.reply('Please enter your response:');
            message = await util.getResponse(this.message.channel, this.message.author.id);
        }
        if (!message) {
            return;
        }

        const response = await AutoResponse.new(/** @type {Snowflake} */this.source.getGuild().id, all, channels, type, trigger, message);
        if (!response.success) return this.reply(response.message);

        await this.reply(response.response.embed('Added new auto-response', util.color.green));
    }

    static getOptions() {
        return [{
            name: 'trigger',
            type: 'STRING',
            description: 'Required keyword/regex',
            required: true,
        }, {
            name: 'message',
            type: 'STRING',
            description: 'Automatic reply',
            required: true,
        },{
            name: 'all',
            type: 'BOOLEAN',
            description: 'Respond in all channels',
            required: false,
        }, {
            name: 'channels',
            type: 'STRING',
            description: 'List of channels to respond in',
            required: false,
        },{
            name: 'type',
            type: 'STRING',
            description: 'Trigger type (default: include)',
            choices: [{name: 'regex', value: 'regex'}, {name:'include', value:'include'}, {name:'match', value: 'include'}],
            required: false,
        }];
    }

    parseOptions(args) {
        let all, channels, trigger, type;

        if (['all', 'global'].includes(args[0].toLowerCase())) {
            all = true;
            args.shift();
        }
        else {
            channels = util.channelMentions(this.source.getGuild(), args);
        }

        type = args.shift();
        trigger = args.join(' ');

        return [{
            name: 'all',
            type: 'BOOLEAN',
            value: all,
        },{
            name: 'channels',
            type: 'STRING',
            value: channels.join(' '),
        },{
            name: 'type',
            type: 'STRING',
            value: type,
        },{
            name: 'trigger',
            type: 'STRING',
            value: trigger,
        }];
    }
}

class AutoResponseCommand extends ConfigCommand {

    static description = 'Manage auto-responses';

    static names = ['autoresponse','response'];

    static userPerms = ['MANAGE_GUILD'];

    static usage = 'list|add';

    static getSubCommands() {
        return [ListAutoResponseCommand, AddAutoResponseCommand];
    }
}

module.exports = AutoResponseCommand;
