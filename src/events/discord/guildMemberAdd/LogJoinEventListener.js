import GuildMemberAddEventListener from './GuildMemberAddEventListener.js';
import {bold, EmbedBuilder, time, TimestampStyles} from 'discord.js';
import GuildWrapper from '../../../discord/GuildWrapper.js';
import colors from '../../../util/colors.js';

export default class LogJoinEventListener extends GuildMemberAddEventListener {
    async execute(member) {
        const guild = await (GuildWrapper.fetch(member.guild.id));
        const embed = new EmbedBuilder()
            .setTitle(`${member.user.tag} joined this server`)
            .setColor(colors.GREEN)
            .setThumbnail(member.user.avatarURL())
            .setDescription(
                `${bold('ID:')} ${member.id}\n` +
                `${bold('Created Account:')} ${time(member.user.createdAt, TimestampStyles.RelativeTime)}`
            )
            .setTimestamp()
            .setFooter({text: `Members: ${member.guild.memberCount}`});

        await guild.logJoin({
            embeds: [embed]
        });
    }
}