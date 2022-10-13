import SubCommandGroup from '../SubCommandGroup.js';
import AddBadWordCommand from './bad-word/AddBadWordCommand.js';
import EditBadWordCommand from './bad-word/EditBadWordCommand.js';
import ListBadWordCommand from './bad-word/ListBadWordCommand.js';
import ShowBadWordCommand from './bad-word/ShowBadWordCommand.js';
import DeleteBadWordCommand from './bad-word/DeleteBadWordCommand.js';

export default class BadWordCommandGroup extends SubCommandGroup {

    getChildren() {
        return [
            new ListBadWordCommand(),
            new AddBadWordCommand(),
            new ShowBadWordCommand(),
            new DeleteBadWordCommand(),
            new EditBadWordCommand(),
        ];
    }

    getDescription() {
        return 'Manage bad-words';
    }

    getName() {
        return 'bad-word';
    }
}