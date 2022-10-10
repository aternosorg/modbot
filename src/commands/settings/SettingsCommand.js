import ParentCommand from '../ParentCommand.js';
import {PermissionFlagsBits, PermissionsBitField} from 'discord.js';
import SettingsOverviewCommand from './SettingsOverviewCommand.js';
import LogChannelCommand from './LogChannelCommand.js';
import MessageLogCommand from './MessageLogCommand.js';
import JoinLogCommand from './JoinLogCommand.js';
import SpamCommand from './SpamCommand.js';
import AutoResponseCommandGroup from './AutoResponseCommandGroup.js';

export default class SettingsCommand extends ParentCommand {

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ManageGuild);
    }

    getChildren() {
        return [
            new SettingsOverviewCommand(),
            new LogChannelCommand(),
            new MessageLogCommand(),
            new JoinLogCommand(),
            new SpamCommand(),
            new AutoResponseCommandGroup(),
        ];
    }

    getDescription() {
        return 'View and change guild settings.';
    }

    getName() {
        return 'settings';
    }
}