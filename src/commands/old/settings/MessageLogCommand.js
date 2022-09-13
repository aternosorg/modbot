const ConfigCommand = require('../ConfigCommand.js');
const DisableMessageLogCommand = require('./messagelog/DisableMessageLogCommand.js');
const GetMessageLogCommand = require('./messagelog/GetMessageLogCommand.js');
const SetMessageLogCommand = require('./messagelog/SetMessageLogCommand.js');

class MessageLogCommand extends ConfigCommand {

    static description = 'Configure the channel that deleted and edited messages will be logged in';

    static usage = 'set|get|disable';

    static names = ['messagelog'];

    static userPerms = ['MANAGE_GUILD'];

    static getSubCommands() {
        return [
            DisableMessageLogCommand,
            GetMessageLogCommand,
            SetMessageLogCommand,
        ];
    }
}

module.exports = MessageLogCommand;
