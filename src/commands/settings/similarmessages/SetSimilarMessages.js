const SetConfigCommand = require('../../SetConfigCommand');

class SetSimilarMessages extends SetConfigCommand {
    static usage = '<limit>';

    static description = 'Amount of similar messages users are allowed to send per minute.';

    async execute() {
        const count = this.options.getInteger('count');
        if (!Number.isNaN(count) && count > 0 && count <= 60) {
            this.guildConfig.similarMessages = count;
            await this.guildConfig.save();
            await this.reply(`Enabled repeated message protection! Users can now only send ${count} similar messages per minute.`);
        } else {
            await this.sendUsage();
        }
    }

    static getOptions() {
        return [{
            name: 'count',
            type: 'INTEGER',
            description: 'Similar messages limit.',
            required: true,
            minValue: 1,
            maxValue: 60,
        }];
    }

    parseOptions(args) {
        return [{
            type: 'INTEGER',
            name: 'count',
            value: parseInt(args.shift())
        }];
    }
}

module.exports = SetSimilarMessages;
