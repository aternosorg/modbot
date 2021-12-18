const SubCommand = require('../../SubCommand');
const AutoResponse = require('../../../AutoResponse');
const util = require('../../../util');
const {Snowflake} = require('discord.js');

class AddAutoResponseCommand extends SubCommand {
    static names = ['add'];

    static description = 'Add an auto-response.';

    static usage = 'all|<channels> '+AutoResponse.triggerTypes.join('|')+' <trigger>';

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
        },{
            name: 'message',
            type: 'STRING',
            description: 'Automatic reply',
            required: true,
        },{
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

module.exports = AddAutoResponseCommand;
