const SubCommand = require('../../SubCommand');
const BadWord = require('../../../BadWord');
const util = require('../../../util');
const {Punishment} = require('../../../Typedefs');

class AddBadWordCommand extends SubCommand {
    static names = ['add'];

    static description = 'Add a bad-word.';

    static usage = 'all|<channels> '+BadWord.triggerTypes.join('|')+' <trigger>';

    async execute() {
        let trigger = this.options.getString('trigger');
        const type = this.options.getString('type') ?? 'include',
            channels = util.channelMentions(this.source.getGuild(), this.options.getString('channels')?.split(' ')),
            priority = this.options.getInteger('priority') ?? 0,
            all = !channels.length;

        if (!trigger) {
            await this.sendUsage();
            return;
        }
        if (!BadWord.triggerTypes.includes(type)) {
            await this.sendError(`Unknown trigger type! Use one of ${BadWord.triggerTypes.join(', ')}`);
            return;
        }

        const response = this.options.getString('response');

        trigger = BadWord.getTrigger(type, trigger);
        if (!trigger.success) {
            return this.sendError(trigger.message);
        }

        /** @type {Punishment}*/
        const punishment = {
            action: this.options.getString('punishment')?.toLowerCase() ?? 'none',
            duration: this.options.getString('duration') ?? ''
        };

        if (!BadWord.punishmentTypes.includes(punishment.action)) {
            await this.sendError('Invalid punishment type: ' + punishment.action);
            return;
        }

        if (punishment.duration) {
            if (punishment.action === 'none' ) {
                await this.sendError('You need to specify a punishment to set a duration');
                return;
            }
            else if (!punishment.duration.split(' ').every(x => util.isTime(x))) {
                await this.sendError('Invalid duration: ' + punishment.duration);
                return;
            }
        }

        const badWord = new BadWord(this.source.getGuild().id, {
            trigger: trigger.trigger,
            punishment,
            global: all,
            channels,
            response: response ?? 'disabled',
            priority
        });
        await badWord.save();
        await this.reply(badWord.embed('Added new bad-word', util.color.green));
    }

    static getOptions() {
        return [{
            name: 'trigger',
            type: 'STRING',
            description: 'Required keyword/regex',
            required: true,
        }, {
            name: 'response',
            type: 'STRING',
            description: 'Automatic reply',
            required: false,
        }, {
            name: 'channels',
            type: 'STRING',
            description: 'List of channels to moderate in. Leave blank to moderate in all channels.',
            required: false,
        },{
            name: 'type',
            type: 'STRING',
            description: 'Trigger type (default: include)',
            choices: BadWord.triggerTypes.map(t => {return { name: t, value: t };}),
            required: false,
        }, {
            name: 'punishment',
            type: 'STRING',
            description: 'Punishment type',
            choices: BadWord.punishmentTypes.map(t => {return { name: t, value: t };}),
            required: false,
        }, {
            name: 'duration',
            type: 'STRING',
            description: 'Punishment duration',
            required: false,
        }, {
            name: 'priority',
            type: 'INTEGER',
            description: 'If a message matches multiple bad-words the punishment with the highest priority is used.',
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

module.exports = AddBadWordCommand;
