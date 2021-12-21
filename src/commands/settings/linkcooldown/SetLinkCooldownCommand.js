const SetConfigCommand = require('../../SetConfigCommand');
const util = require('../../../util');

class SetLinkCooldownCommand extends SetConfigCommand {
    static usage = '<cooldown>';

    async execute() {
        const cooldown = util.timeToSec(this.options.getString('duration'));
        if (cooldown > 0) {
            this.guildConfig.linkCooldown = cooldown;
            await this.guildConfig.save();
            await this.reply(`Set link cooldown to ${util.secToTime(cooldown)}!`);
        } else {
            await this.sendUsage();
        }
    }

    static getOptions() {
        return [{
            name: 'duration',
            type: 'STRING',
            description: 'New link cooldown.',
            required: true,
        }];
    }

    parseOptions(args) {
        return [{
            type: 'STRING',
            name: 'duration',
            value: args.join(' ')
        }];
    }
}

module.exports = SetLinkCooldownCommand;
