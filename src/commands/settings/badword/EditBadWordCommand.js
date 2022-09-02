const SubCommand = require('../../SubCommand');
const BadWord = require('../../../database/BadWord.js');
const util = require('../../../util');

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
            description: 'The ID of the bad-word that should be edited.',
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
            name: 'option',
            type: 'STRING',
            value: args.shift(),
        },{
            name: 'value',
            type: 'STRING',
            value: args.join(' '),
        }];
    }
}

module.exports = EditBadWordCommand;
