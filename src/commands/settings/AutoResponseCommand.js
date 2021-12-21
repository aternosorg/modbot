const ConfigCommand = require('../ConfigCommand');
const AddAutoResponseCommand = require('./autoresponses/AddAutoResponseCommand');
const EditAutoResponseCommand = require('./autoresponses/EditAutoResponseCommand');
const ListAutoResponseCommand = require('./autoresponses/ListAutoResponseCommand');
const RemoveAutoResponseCommand = require('./autoresponses/RemoveAutoResponseCommand');
const ShowAutoResponseCommand = require('./autoresponses/ShowAutoResponseCommand');

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
