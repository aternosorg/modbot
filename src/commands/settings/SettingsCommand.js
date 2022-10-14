import ParentCommand from '../ParentCommand.js';
import {PermissionFlagsBits, PermissionsBitField} from 'discord.js';
import SettingsOverviewCommand from './SettingsOverviewCommand.js';
import LogChannelCommand from './LogChannelCommand.js';
import MessageLogCommand from './MessageLogCommand.js';
import JoinLogCommand from './JoinLogCommand.js';
import SpamCommand from './SpamCommand.js';
import AutoResponseCommand from './AutoResponseCommand.js';
import CapsCommand from './CapsCommand.js';
import HelpCenterCommand from './HelpCenterCommand.js';
import PlaylistCommand from './PlaylistCommand.js';
import SimilarMessagesCommand from './SimilarMessagesCommand.js';
import PunishmentsCommandGroup from './PunishmentsCommandGroup.js';
import ProtectedRolesCommandGroup from './ProtectedRolesCommandGroup.js';
import MutedRoleCommandGroup from './MutedRoleCommandGroup.js';
import LinkCoolDownCommand from './LinkCoolDownCommand.js';
import InvitesCommandGroup from './InvitesCommandGroup.js';
import BadWordCommand from './BadWordCommand.js';
import AttachmentCoolDownCommand from './AttachmentCoolDownCommand.js';

export default class SettingsCommand extends ParentCommand {

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ManageGuild);
    }

    getChildren() {
        return [
            new SettingsOverviewCommand(),

            // Logging
            new LogChannelCommand(),
            new MessageLogCommand(),
            new JoinLogCommand(),

            new PunishmentsCommandGroup(),
            new ProtectedRolesCommandGroup(),
            new MutedRoleCommandGroup(),
            new AutoResponseCommand(),
            new BadWordCommand(),

            // Auto Moderation
            new SpamCommand(),
            new CapsCommand(),
            new SimilarMessagesCommand(),
            new LinkCoolDownCommand(),
            new AttachmentCoolDownCommand(),
            new InvitesCommandGroup(),

            // External
            new HelpCenterCommand(),
            new PlaylistCommand(),
        ];
    }

    getDescription() {
        return 'View and change guild settings.';
    }

    getName() {
        return 'settings';
    }
}