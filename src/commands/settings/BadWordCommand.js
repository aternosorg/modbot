const ConfigCommand = require('../ConfigCommand');
const ListBadWordCommand = require('./badword/ListBadWordCommand');
const AddBadWordCommand = require('./badword/AddBadWordCommand');
const RemoveBadWordCommand = require('./badword/RemoveBadWordCommand');
const ShowBadWordCommand = require('./badword/ShowBadWordCommand');
const EditBadWordCommand = require('./badword/EditBadWordCommand');

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
