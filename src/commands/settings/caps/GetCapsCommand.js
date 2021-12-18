const GetConfigCommand = require('../../GetConfigCommand');

class GetCapsCommand extends GetConfigCommand {

    async execute() {
        await this.reply(`Spam protection is currently ${this.getValue()}.`);
    }

    getValue() {
        return this.guildConfig.caps === false ? 'disabled' : 'enabled';
    }
}

module.exports = GetCapsCommand;
