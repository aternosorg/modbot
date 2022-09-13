const ConfigCommand = require('../ConfigCommand.js');

class PunishCommand extends ConfigCommand {

    static description = 'Configure punishments for strikes';

    static usage = 'show|set';

    static comment = 'If no punishment is set for a specific strike count the previous punishment will be used';

    static names = ['punish','punishment','punishments'];

    static userPerms = [];

    static getSubCommands() {
        return [
            require('./punish/ShowPunishmentsCommand.js'),
            require('./punish/SetPunishmentsCommand.js'),
        ];
    }
}

module.exports = PunishCommand;
