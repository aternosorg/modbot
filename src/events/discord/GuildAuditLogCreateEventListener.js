import EventListener from '../EventListener.js';
import KeyValueEmbed from '../../embeds/KeyValueEmbed.js';
import {AuditLogEvent, userMention} from 'discord.js';
import colors from '../../util/colors.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import UserWrapper from '../../discord/UserWrapper.js';

export default class GuildAuditLogCreateEventListener extends EventListener {

    /**
     * @param {import('discord.js').GuildAuditLogsEntry} entry
     * @param {import('discord.js').Guild} guild
     * @returns {Promise<void>}
     */
    async execute(entry, guild) {
        if (!entry.executorId) {
            return;
        }

        entry.executor ??= await (new UserWrapper(entry.executorId)).fetchUser();
        if (!entry.executor || entry.executor.bot) {
            return;
        }

        const embed = new KeyValueEmbed().setTimestamp(entry.createdTimestamp);
        switch (entry.action) {
            case AuditLogEvent.MemberRoleUpdate: {
                /** @type {?string} */
                let action = null;
                const mutedRole = (await new GuildWrapper(guild).getSettings()).getMutedRole();
                for (const change of entry.changes) {
                    // ignore role changes that were reverted in the same event
                    if (change.key === '$add' && change.new?.some(role => role.id === mutedRole)) {
                        action = action === 'unmute' ? null : 'mute';
                    }

                    // you might think that removing a role would place the removed role in the "old" property.
                    // you would be wrong.
                    if (change.key === '$remove' && change.new?.some(role => role.id === mutedRole)) {
                        action = action === 'mute' ? null : 'unmute';
                    }
                }

                if (action !== null) {
                    await this.createModeration(action, entry, guild);
                }
                return;
            }
            case AuditLogEvent.MemberUpdate: {
                /** @type {?string} */
                let action = null;
                /** @type {?number} */
                let duration = null;
                let wasMuted = null;
                for (const change of entry.changes) {
                    if (change.key === 'communication_disabled_until') {
                        wasMuted ??= change.old !== null;
                        if (!change.new) {
                            // ignore mutes that were instantly reverted
                            action = wasMuted ? 'unmute' : null;
                        } else {
                            action = 'mute';
                            duration = Math.ceil((new Date(/** @type {string}*/ change.new) - entry.createdAt) / 1000);
                        }
                    }
                }

                if (action !== null) {
                    await this.createModeration(action, entry, guild, duration);
                }
                return;
            }
            case AuditLogEvent.MemberBanAdd:
                return await this.createModeration('ban', entry, guild);
            case AuditLogEvent.MemberBanRemove:
                return await this.createModeration('unban', entry, guild);
            case AuditLogEvent.MemberKick:
                return await this.createModeration('kick', entry, guild);

            case AuditLogEvent.MemberPrune:
                embed.setColor(colors.RED)
                    .setTitle('Pruned members')
                    .addPair('Removed', entry.extra.removed)
                    .addPair('Days', entry.extra.days)
                    .addPair('New member count', guild.memberCount);
                break;

            default:
                return;
        }

        embed.addPair('Moderator', userMention(entry.executor.id))
            .addPair('Reason', entry.reason);

        let guildWrapper = new GuildWrapper(guild);
        await guildWrapper.log({
            embeds: [embed],
        });
    }

    get name() {
        return 'guildAuditLogEntryCreate';
    }

    /**
     * @param {string} action
     * @param {import('discord.js').GuildAuditLogsEntry} entry
     * @param {import('discord.js').Guild} guild
     * @param {?number} [duration]
     * @returns {Promise<void>}
     */
    async createModeration(action, entry, guild, duration = null) {
        const member = new MemberWrapper(entry.target, guild);
        await (await member.createModeration(action, entry.reason, 'Executed through Discord', duration, entry.executor.id)).log();
    }
}