const SubCommand = require('../../SubCommand.js');
const BadWord = require('../../../../database/BadWord.js');
const util = require('../../../../util.js');

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
        await badWord.delete();
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

module.exports = RemoveBadWordCommand;
