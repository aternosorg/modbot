import GuildMemberAddEventListener from './GuildMemberAddEventListener.js';
import {time, TimestampStyles} from 'discord.js';
import GuildWrapper from '../../../discord/GuildWrapper.js';
import colors from '../../../util/colors.js';
import KeyValueEmbed from '../../../embeds/KeyValueEmbed.js';

export default class LogJoinEventListener extends GuildMemberAddEventListener {
    async execute(member) {
        const guild = await (GuildWrapper.fetch(member.guild.id));
        const embed = new KeyValueEmbed()
            .setTitle(`${member.displayName} joined this server`)
            .setColor(colors.GREEN)
            .setThumbnail(member.displayAvatarURL())
            .addPair('User ID', member.user.id)
            .addPair('Created Account', time(member.user.createdAt, TimestampStyles.RelativeTime))
            .setTimestamp()
            .setFooter({text: `Members: ${member.guild.memberCount}`});

        await guild.logJoin({
            embeds: [embed]
        });
    }
}