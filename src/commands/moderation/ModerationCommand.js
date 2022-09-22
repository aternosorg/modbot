import ModerationShowCommand from './ModerationShowCommand.js';
import ParentCommand from '../ParentCommand.js';
import ModerationClearCommand from './ModerationClearCommand.js';
import ModerationDeleteCommand from './ModerationDeleteCommand.js';
import ModerationListCommand from './ModerationListCommand.js';
import {PermissionFlagsBits, PermissionsBitField} from 'discord.js';

export default class ModerationCommand extends ParentCommand {

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ModerateMembers);
    }

    getChildren() {
        return [
            new ModerationShowCommand(),
            new ModerationDeleteCommand(),
            new ModerationListCommand(),
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