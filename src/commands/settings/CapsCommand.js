const ConfigCommand = require('../ConfigCommand');
const GetCapsCommand = require('./caps/GetCapsCommand');
const SetCapsCommand = require('./caps/SetCapsCommand');

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
