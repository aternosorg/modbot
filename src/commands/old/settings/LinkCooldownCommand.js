const ConfigCommand = require('../ConfigCommand.js');
const DisableLinkCooldownCommand = require('./linkcooldown/DisableLinkCooldownCommand.js');
const GetLinkCooldownCommand = require('./linkcooldown/GetLinkCooldownCommand.js');
const SetLinkCooldownCommand = require('./linkcooldown/SetLinkCooldownCommand.js');

class LinkCooldownCommand extends ConfigCommand {

    static description = 'Configure link cooldown';

    static usage = 'set|get|disable';

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
