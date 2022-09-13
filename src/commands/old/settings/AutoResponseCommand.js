const ConfigCommand = require('../ConfigCommand.js');
const AddAutoResponseCommand = require('./autoresponses/AddAutoResponseCommand.js');
const EditAutoResponseCommand = require('./autoresponses/EditAutoResponseCommand.js');
const ListAutoResponseCommand = require('./autoresponses/ListAutoResponseCommand.js');
const RemoveAutoResponseCommand = require('./autoresponses/RemoveAutoResponseCommand.js');
const ShowAutoResponseCommand = require('./autoresponses/ShowAutoResponseCommand.js');

class AutoResponseCommand extends ConfigCommand {

    static description = 'Manage auto-responses';

    static names = ['autoresponse','response'];

    static userPerms = ['MANAGE_GUILD'];

    static usage = 'list|add|remove|show|edit';

    static getSubCommands() {
        return [
            AddAutoResponseCommand,
            EditAutoResponseCommand,
            ListAutoResponseCommand,
            RemoveAutoResponseCommand,
            ShowAutoResponseCommand,
        ];
    }
}

module.exports = AutoResponseCommand;
