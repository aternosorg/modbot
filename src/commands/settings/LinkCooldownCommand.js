const Command = require('../../Command');
const util = require('../../util');

class LinkCooldownCommand extends Command {

    static description = 'Configure link cooldown';

    static usage = '<cooldown>|off|status';

    static names = ['linkcooldown'];

    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        if (this.args.length < 1) {
            await this.sendUsage();
            return;
        }

        switch (this.args[0].toLowerCase()) {
            case 'off':
                this.guildConfig.linkCooldown = -1;
                await this.guildConfig.save();
                await this.reply('Disabled link cooldown!');
                break;
            case 'status':
                await this.reply(`Link cooldown is currently ${this.guildConfig.linkCooldown === -1 ? 'disabled' : `set to ${util.secToTime(this.guildConfig.linkCooldown)}`}.`);
                break;
            default: {
                const cooldown = util.timeToSec(this.args.join(' '));
                if (cooldown > 0) {
                    this.guildConfig.linkCooldown = cooldown;
                    await this.guildConfig.save();
                    await this.reply(`Set link cooldown to ${util.secToTime(cooldown)}!`);
                } else {
                    await this.sendUsage();
                }
            }
        }
    }
}

module.exports = LinkCooldownCommand;
