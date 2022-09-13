const SubCommand = require('../../SubCommand.js');

class DisableLinkCooldownCommand extends SubCommand {
    static names = ['disable', 'off'];

    static description = 'Disable the link cooldown.';

    async execute() {
        this.guildConfig.linkCooldown = null;
        await this.guildConfig.save();
        await this.reply('Disabled link cooldown!');
    }
}

module.exports = DisableLinkCooldownCommand;
