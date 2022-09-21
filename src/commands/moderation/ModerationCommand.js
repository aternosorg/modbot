import ModerationShowCommand from './ModerationShowCommand.js';
import ParentCommand from '../ParentCommand.js';
import ModerationClearCommand from './ModerationClearCommand.js';
import ModerationDeleteCommand from './ModerationDeleteCommand.js';

export default class ModerationCommand extends ParentCommand {

    getChildren() {
        return [
            new ModerationShowCommand(),
            new ModerationDeleteCommand(),
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