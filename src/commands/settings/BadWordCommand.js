const {ConfigCommand} = require('../ConfigCommand');
const SubCommand = require('../SubCommand');
const BadWord = require('../../BadWord');
const {Snowflake} = require('discord.js');
const util = require('../../util');
const {Punishment} = require('../../Typedefs');

class ListBadWordCommand extends SubCommand {

    static names = ['list'];

    static description = 'List all bad-words.';

    static getParentCommand() {
        return BadWordCommand;
    }

    async execute() {
        const messages = await BadWord.getGuildOverview(/** @type {Snowflake} */ this.source.getGuild().id)
            ?? ['This server has no bad-words!'];
        for (const message of messages) {
            await this.reply(message);
        }
    }
}

class AddBadWordCommand extends SubCommand {

    static names = ['add'];

    static description = 'Add a bad-word.';

    static usage = 'all|<channels> '+BadWord.triggerTypes.join('|')+' <trigger>';

    static getParentCommand() {
        return BadWordCommand;
    }

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

class RemoveBadWordCommand extends SubCommand {

    static names = ['remove'];

    static description = 'Remove a bad-word.';

    static usage = '<id>';

    async execute() {
        const id = this.options.getInteger('id');
        if (!id || id < 0) {
            return this.sendUsage();
        }
        /**
         * @type {BadWord}
         */
        const badWord = await BadWord.getByID(id);
        if (!badWord) {
            return this.sendUsage();
        }
        await badWord.remove();
        await this.reply(badWord.embed(`Removed bad-word ${badWord.id}`, util.color.red));
    }


    static getOptions() {
        return [{
            name: 'id',
            type: 'INTEGER',
            description: 'The ID of the bad-word that should be removed.',
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

class ShowBadWordCommand extends SubCommand {
    static names = ['show'];

    static description = 'Show a bad-word.';

    static usage = '<id>';

    async execute() {
        const id = this.options.getInteger('id');
        if (!id || id < 0) {
            return this.sendUsage();
        }
        /**
         * @type {BadWord}
         */
        const badWord = await BadWord.getByID(id);
        if (!badWord) {
            return this.sendUsage();
        }
        await this.reply(badWord.embed(`Bad-word ${badWord.id}`, util.color.green));    }

    static getOptions() {
        return [{
            name: 'id',
            type: 'INTEGER',
            description: 'The ID of the bad-word that you want to view.',
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

class EditBadWordCommand extends SubCommand {
    static description = 'Edit a bad-word';

    static names = ['edit'];

    static usage = '<id> trigger|response|channels|punishment|priority <value>';

    async execute() {
        const id = this.options.getInteger('id');
        if (!id || id < 0) {
            return this.sendUsage();
        }
        /**
         * @type {BadWord}
         */
        const badWord = await BadWord.getByID(id);

        const option = this.options.getString('option'),
            value = this.options.getString('value')?.split(' ');
        if (!['trigger', 'response', 'channels', 'punishment', 'priority'].includes(option) || !value || !badWord) {
            return this.sendUsage();
        }

        const res = await badWord.edit(option, value, this.source.getGuild());
        if (!res.success) {
            return this.sendError(res.message);
        }

        await this.reply(badWord.embed(res.message, util.color.green));
    }

    static getOptions() {
        return [{
            name: 'id',
            type: 'INTEGER',
            description: 'The ID of the bad-word that should be removed.',
            required: true,
            minValue: 0,
        }, {
            name: 'option',
            type: 'STRING',
            description: 'The option you want to edit',
            required: true,
            choices: [
                {name: 'trigger', value: 'trigger'},
                {name: 'response', value: 'response'},
                {name: 'channels', value: 'channels'},
                {name: 'punishment', value: 'punishment'},
                {name: 'priority', value: 'priority'},
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

class BadWordCommand extends ConfigCommand {

    static description = 'Manage bad-words';

    static names = ['badword'];

    static userPerms = ['MANAGE_GUILD'];

    static usage = 'list|add|remove|show|edit';

    static getSubCommands() {
        return [
            ListBadWordCommand,
            AddBadWordCommand,
            RemoveBadWordCommand,
            ShowBadWordCommand,
            EditBadWordCommand,
        ];
    }
}

module.exports = BadWordCommand;
