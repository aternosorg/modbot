import ParentCommand from '../ParentCommand.js';
import {PermissionFlagsBits, PermissionsBitField} from 'discord.js';
import SettingsOverviewCommand from './SettingsOverviewCommand.js';
import LogChannelCommand from './LogChannelCommand.js';

export default class SettingsCommand extends ParentCommand {

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ManageGuild);
    }

    getChildren() {
        return [
            new SettingsOverviewCommand(),
            new LogChannelCommand(),
        ];
    }

    getDescription() {
        return 'View and change guild settings.';
    }

    getName() {
        return 'settings';
    }
}