const SubCommand = require('../../SubCommand');
const BadWord = require('../../../database/BadWord.js');
const util = require('../../../util');

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

module.exports = ShowBadWordCommand;
