const SetConfigCommand = require('../../SetConfigCommand');

class SetMaxMentionsCommand extends SetConfigCommand {
    async execute() {
        const limit = this.options.getInteger('limit');
        if (typeof limit !== 'number' || isNaN(limit)) {
            await this.sendUsage();
            return;
        }
        if (limit < 1 || limit > 10) {
            await this.sendError('Limit must be in range 1-10.');
            return;
        }

        this.guildConfig.maxMentions = limit;
        await this.guildConfig.save();
        await this.reply(`Users mentioning more than ${limit} users in one message will now receive a strike.`);
    }

    static getOptions() {
        return [{
            name: 'limit',
            type: 'INTEGER',
            description: 'Maximum amount of users a member can mention.',
            required: true,
            minValue: 1,
            maxValue: 10,
        }];
    }

    parseOptions(args) {
        return [{
            type: 'INTEGER',
            name: 'limit',
            value: parseInt(args.shift())
        }];
    }
}

module.exports = SetMaxMentionsCommand;
