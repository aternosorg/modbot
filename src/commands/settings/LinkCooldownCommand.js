const ConfigCommand = require('../ConfigCommand');
const DisableLinkCooldownCommand = require('./linkcooldown/DisableLinkCooldownCommand');
const GetLinkCooldownCommand = require('./linkcooldown/GetLinkCooldownCommand');
const SetLinkCooldownCommand = require('./linkcooldown/SetLinkCooldownCommand');

class LinkCooldownCommand extends ConfigCommand {

    static description = 'Configure link cooldown';

    static usage = 'set|off|status';

    static names = ['linkcooldown'];

    static userPerms = ['MANAGE_GUILD'];

    static getSubCommands() {
        return [
            DisableLinkCooldownCommand,
            GetLinkCooldownCommand,
            SetLinkCooldownCommand,
        ];
    }
}

module.exports = LinkCooldownCommand;
