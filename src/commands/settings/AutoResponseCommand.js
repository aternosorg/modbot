const {ConfigCommand} = require('../ConfigCommand');
const SubCommand = require('../SubCommand');
const AutoResponse = require('../../AutoResponse');
const {Snowflake} = require('discord.js');
const util = require('../../util');
const BadWord = require('../../BadWord');

class ListAutoResponseCommand extends SubCommand {

    static names = ['list'];

    static description = 'List all auto-responses.';

    static getParentCommand() {
        return AutoResponseCommand;
    }

    async execute() {
        const messages = await BadWord.getGuildOverview(/** @type {Snowflake} */ this.source.getGuild().id)
            ?? ['This server has no auto-responses!'];
        for (const message of messages) {
            await this.reply(message);
        }
    }
}

class AddAutoResponseCommand extends SubCommand {

    static names = ['add'];

    static description = 'Add an auto-response.';

    static usage = 'all|<channels> '+AutoResponse.triggerTypes.join('|')+' <trigger>';

    static getParentCommand() {
        return AutoResponseCommand;
    }

    async execute() {
        const trigger = this.options.getString('trigger'),
            type = this.options.getString('type') ?? 'include',
            channels = util.channelMentions(this.source.getGuild(), this.options.getString('channels')?.split(' ')),
            all = !channels.length;

        if (!trigger) {
            await this.sendUsage();
            return;
        }
        if (!all && !channels.length) {
            await this.reply('Either specify a list of channels to reply in or use \'all\' for all channels.');
            return;
        }
        if (!AutoResponse.triggerTypes.includes(type)) {
            await this.sendError(`Unknown trigger type! Use one of ${AutoResponse.triggerTypes.join(', ')}`);
            return;
        }

        let message = this.options.getString('message');
        if (!this.source.isInteraction) {
            await this.reply('Please enter your response:');
            message = await util.getResponse(this.source.getChannel(), this.source.getUser().id);
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
        }, {
            name: 'channels',
            type: 'STRING',
            description: 'List of channels to respond in. Leave blank to respond in all channels.',
            required: false,
        },{
            name: 'type',
            type: 'STRING',
            description: 'Trigger type (default: include)',
            choices: AutoResponse.triggerTypes.map(t => {return { name: t, value: t };}),
            required: false,
        }];
    }

    parseOptions(args) {
        let all, channels = [], trigger, type;

        if (['all', 'global'].includes(args[0]?.toLowerCase())) {
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

class RemoveAutoResponseCommand extends SubCommand {

    static names = ['remove'];

    static description = 'Remove an auto-response.';

    static usage = '<id>';

    async execute() {
        const id = this.options.getInteger('id');
        if (!id || id < 0) {
            return this.sendUsage();
        }
        /**
         * @type {AutoResponse}
         */
        const response = await AutoResponse.getByID(id);
        if (!response) {
            return this.sendUsage();
        }
        await response.remove();
        await this.reply(response.embed(`Removed auto-response ${response.id}`, util.color.red));
    }


    static getOptions() {
        return [{
            name: 'id',
            type: 'INTEGER',
            description: 'The ID of the auto-response that should be removed.',
            required: true,
            minValue: 0,
        }];
    }

    parseOptions(args) {
        return [{
            name: 'id',
            type: 'INTEGER',
            value: parseInt(args.shift()),
        }];
    }
}

class ShowAutoResponseCommand extends SubCommand {
    static names = ['show'];

    static description = 'Show an auto-response.';

    static usage = '<id>';

    async execute() {
        const id = this.options.getInteger('id');
        if (!id || id < 0) {
            return this.sendUsage();
        }
        /**
         * @type {AutoResponse}
         */
        const response = await AutoResponse.getByID(id);
        if (!response) {
            return this.sendUsage();
        }
        await this.reply(response.embed(`Auto-response ${response.id}`, util.color.green));    }

    static getOptions() {
        return [{
            name: 'id',
            type: 'INTEGER',
            description: 'The ID of the auto-response that you want to view.',
            required: true,
            minValue: 0,
        }];
    }

    parseOptions(args) {
        return [{
            name: 'id',
            type: 'INTEGER',
            value: parseInt(args.shift()),
        }];
    }
}

class EditAutoResponseCommand extends SubCommand {
    static description = 'Edit an auto-response';

    static names = ['edit'];

    static usage = '<id> trigger|response|channels <value>';

    async execute() {
        const id = this.options.getInteger('id');
        if (!id || id < 0) {
            return this.sendUsage();
        }
        /**
         * @type {AutoResponse}
         */
        const autoResponse = await AutoResponse.getByID(id);

        const option = this.options.getString('option'),
            value = this.options.getString('value')?.split(' ');
        if (!['trigger', 'message', 'channels'].includes(option) || !value || !autoResponse) {
            return this.sendUsage();
        }

        const res = await autoResponse.edit(option, value, this.source.getGuild());
        if (!res.success) {
            return this.sendError(res.message);
        }

        await this.reply(autoResponse.embed(res.message, util.color.green));
    }

    static getOptions() {
        return [{
            name: 'id',
            type: 'INTEGER',
            description: 'The ID of the auto-response that should be removed.',
            required: true,
            minValue: 0,
        }, {
            name: 'option',
            type: 'STRING',
            description: 'The option you want to edit',
            required: true,
            choices: [
                {name: 'trigger', value: 'trigger'},
                {name: 'message', value: 'response'},
                {name: 'channels', value: 'channels'},
            ]
        },{
            name: 'value',
            type: 'STRING',
            description: 'The new value of the selected option',
            required: true,
        }];
    }

    parseOptions(args) {
        return [{
            name: 'id',
            type: 'INTEGER',
            value: parseInt(args.shift()),
        },{
            name: 'type',
            type: 'STRING',
            value: args.shift(),
        },{
            name: 'trigger',
            type: 'STRING',
            value: args.join(' '),
        }];
    }
}

class AutoResponseCommand extends ConfigCommand {

    static description = 'Manage auto-responses';

    static names = ['autoresponse','response'];

    static userPerms = ['MANAGE_GUILD'];

    static usage = 'list|add|remove|show|edit';

    static getSubCommands() {
        return [
            ListAutoResponseCommand,
            AddAutoResponseCommand,
            RemoveAutoResponseCommand,
            ShowAutoResponseCommand,
            EditAutoResponseCommand,
        ];
    }
}

module.exports = AutoResponseCommand;
