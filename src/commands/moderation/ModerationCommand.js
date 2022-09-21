import ModerationShowCommand from './ModerationShowCommand.js';
import ParentCommand from '../ParentCommand.js';
import ModerationClearCommand from './ModerationClearCommand.js';

export default class ModerationCommand extends ParentCommand {

    getChildren() {
        return [
            new ModerationShowCommand(),
            new ModerationClearCommand(),
        ];
    }

    getDescription() {
        return 'View and manage moderations';
    }

    getName() {
        return 'moderation';
    }
}