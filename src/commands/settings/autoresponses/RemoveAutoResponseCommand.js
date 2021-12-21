const SubCommand = require('../../SubCommand');
const AutoResponse = require('../../../AutoResponse');
const util = require('../../../util');

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

module.exports = RemoveAutoResponseCommand;
