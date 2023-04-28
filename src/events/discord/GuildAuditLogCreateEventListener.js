import EventListener from '../EventListener.js';
import KeyValueEmbed from '../../embeds/KeyValueEmbed.js';
import {AuditLogEvent, userMention} from 'discord.js';
import colors from '../../util/colors.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import MemberWrapper from '../../discord/MemberWrapper.js';

export default class GuildAuditLogCreateEventListener extends EventListener {

    /**
     * @param {import('discord.js').GuildAuditLogsEntry} entry
     * @param {import('discord.js').Guild} guild
     * @return {Promise<void>}
     */
    async execute(entry, guild) {
        if (entry.executor.bot) {
            return;
        }

        const embed = new KeyValueEmbed().setTimestamp(entry.createdTimestamp);
        const reason = entry.reason ?? 'No reason provided';
        let action = null;
        switch (entry.action) {
            case AuditLogEvent.MemberBanAdd:
                action ??= 'ban';
            // eslint-disable-next-line no-fallthrough
            case AuditLogEvent.MemberBanRemove:
                action ??= 'unban';
            // eslint-disable-next-line no-fallthrough
            case AuditLogEvent.MemberKick: {
                action ??= 'kick';
                const member = new MemberWrapper(entry.target, guild);
                await (await member.createModeration(action, reason, null, entry.executor.id)).log();
                return;
            }

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
}