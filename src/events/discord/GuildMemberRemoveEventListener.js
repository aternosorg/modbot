import EventListener from '../EventListener.js';
import {bold, EmbedBuilder, time, TimestampStyles} from 'discord.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import colors from '../../util/colors.js';

export default class GuildMemberRemoveEventListener extends EventListener {
    get name() {
        return 'guildMemberRemove';
    }

    /**
     * @param {import('discord.js').GuildMember} member
     * @return {Promise<unknown>}
     */
    async execute(member) {
        let description = `${bold('ID:')} ${member.id}\n` +
            `${bold('Created Account:')} ${time(member.user.createdAt, TimestampStyles.RelativeTime)}\n`;

        if (member.joinedTimestamp) {
            description += `${bold('Joined:')} ${time(member.joinedAt, TimestampStyles.RelativeTime)}`;
        }
        const embed = new EmbedBuilder()
            .setTitle(`${member.user.tag} left this server`)
            .setColor(colors.RED)
            .setThumbnail(member.user.avatarURL())
            .setDescription(description)
            .setTimestamp()
            .setFooter({text: `Members: ${member.guild.memberCount}`});
        const guild = await GuildWrapper.fetch(member.guild.id);
        await guild.logJoin({embeds: [embed]});
    }

}