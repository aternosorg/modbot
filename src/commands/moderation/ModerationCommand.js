import ModerationShowCommand from './ModerationShowCommand.js';
import ParentCommand from '../ParentCommand.js';

export default class ModerationCommand extends ParentCommand {

    getChildren() {
        return [
            new ModerationShowCommand()
        ];
    }

    getDescription() {
        return 'View and manage moderations';
    }

    getName() {
        return 'moderation';
    }
}