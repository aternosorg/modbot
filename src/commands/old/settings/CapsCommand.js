const ConfigCommand = require('../ConfigCommand.js');
const GetCapsCommand = require('./caps/GetCapsCommand.js');
const SetCapsCommand = require('./caps/SetCapsCommand.js');

class CapsCommand extends ConfigCommand {
    static description = 'Configure caps moderation (deletes messages with 70%+ caps)';

    static usage = 'get|set';

    static names = ['caps','capsmod'];

    static userPerms = ['MANAGE_GUILD'];

    static getSubCommands() {
        return [
            GetCapsCommand,
            SetCapsCommand
        ];
    }
}

module.exports = CapsCommand;
