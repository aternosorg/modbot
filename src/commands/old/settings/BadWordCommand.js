const ConfigCommand = require('../ConfigCommand.js');
const ListBadWordCommand = require('./badword/ListBadWordCommand.js');
const AddBadWordCommand = require('./badword/AddBadWordCommand.js');
const RemoveBadWordCommand = require('./badword/RemoveBadWordCommand.js');
const ShowBadWordCommand = require('./badword/ShowBadWordCommand.js');
const EditBadWordCommand = require('./badword/EditBadWordCommand.js');

class BadWordCommand extends ConfigCommand {

    static description = 'Manage bad-words';

    static names = ['badword'];

    static userPerms = ['MANAGE_GUILD'];

    static usage = 'list|add|remove|show|edit';

    static getSubCommands() {
        return [
            ListBadWordCommand,
            AddBadWordCommand,
            RemoveBadWordCommand,
            ShowBadWordCommand,
            EditBadWordCommand,
        ];
    }
}

module.exports = BadWordCommand;
