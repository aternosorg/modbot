const SubCommand = require('../../SubCommand');
const AutoResponse = require('../../../AutoResponse');
const util = require('../../../util');

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

module.exports = EditAutoResponseCommand;
