const GetConfigCommand = require('../../GetConfigCommand.js');
const util = require('../../../../util.js');

class GetLinkCooldownCommand extends GetConfigCommand {
    static names = ['get','show'];

    async execute() {
        if (!this.guildConfig.linkCooldown) {
            await this.reply('Link cooldown is currently disabled');
        }
        else {
            await this.reply(`Link cooldown is set to ${util.secToTime(this.guildConfig.linkCooldown)}.`);
        }
    }
}

module.exports = GetLinkCooldownCommand;
