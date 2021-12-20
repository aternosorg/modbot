const ConfigCommand = require('../ConfigCommand');
const DisableMaxMentionsCommand = require('./maxmentions/DisableMaxMentionsCommand');
const GetMaxMentionsCommand = require('./maxmentions/GetMaxMentionsCommand');
const SetMaxMentionsCommand = require('./maxmentions/SetMaxMentionsCommand');

class MaxMentionsCommand extends ConfigCommand {
    static description = 'Configure how many users a user should be allowed to mention in one message';

    static usage = 'get|set|disable';

    static names = ['maxmentions','maximummentions'];

    static userPerms = ['MANAGE_GUILD'];

    static getSubCommands() {
        return [
            DisableMaxMentionsCommand,
            GetMaxMentionsCommand,
            SetMaxMentionsCommand,
        ];
    }
}

module.exports = MaxMentionsCommand;
