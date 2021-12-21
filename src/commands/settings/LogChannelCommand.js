const ConfigCommand = require('../ConfigCommand');
const DisableLogChannelCommand = require('./logchannel/DisableLogChannelCommand');
const GetLogChannelCommand = require('./logchannel/GetLogChannelCommand');
const SetLogChannelCommand = require('./logchannel/SetLogChannelCommand');

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
