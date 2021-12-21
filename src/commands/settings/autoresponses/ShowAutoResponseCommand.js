const SubCommand = require('../../SubCommand');
const AutoResponse = require('../../../AutoResponse');
const util = require('../../../util');

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

module.exports = ShowAutoResponseCommand;
