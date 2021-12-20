const ConfigCommand = require('../ConfigCommand');
const DisableJoinLogCommand = require('./joinlog/DisableJoinLogCommand');
const GetJoinLogCommand = require('./joinlog/GetJoinLogCommand');
const SetJoinLogCommand = require('./joinlog/SetJoinLogCommand');

class JoinLogCommand extends ConfigCommand {

    static description = 'Configure the channel that joins will be logged in';

    static usage = 'set|get|disable';

    static names = ['joinlog','memberlog'];

    static userPerms = ['MANAGE_GUILD'];

    static getSubCommands() {
        return [
            DisableJoinLogCommand,
            GetJoinLogCommand,
            SetJoinLogCommand,
        ];
    }
}

module.exports = JoinLogCommand;
