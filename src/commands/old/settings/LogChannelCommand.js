const ConfigCommand = require('../ConfigCommand.js');
const DisableLogChannelCommand = require('./logchannel/DisableLogChannelCommand.js');
const GetLogChannelCommand = require('./logchannel/GetLogChannelCommand.js');
const SetLogChannelCommand = require('./logchannel/SetLogChannelCommand.js');

class LogChannelCommand extends ConfigCommand {

    static description = 'Configure the channel that moderations will be logged in';

    static usage = 'set|get|disable';

    static names = ['log','logchannel'];

    static userPerms = ['MANAGE_GUILD'];

    static getSubCommands() {
        return [
            DisableLogChannelCommand,
            GetLogChannelCommand,
            SetLogChannelCommand,
        ];
    }
}

module.exports = LogChannelCommand;
