import EventListener from '../EventListener.js';
import {time, TimestampStyles} from 'discord.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import colors from '../../util/colors.js';
import KeyValueEmbed from '../../embeds/KeyValueEmbed.js';

export default class GuildMemberRemoveEventListener extends EventListener {
    get name() {
        return 'guildMemberRemove';
    }

    /**
     * @param {import('discord.js').GuildMember} member
     * @returns {Promise<unknown>}
     */
    async execute(member) {
        const embed = new KeyValueEmbed()
            .setTitle(`${member.displayName} left this server`)
            .setColor(colors.RED)
            .setThumbnail(member.displayAvatarURL())
            .addPair('User ID', member.user.id)
            .addPair('Created Account', time(member.user.createdAt, TimestampStyles.RelativeTime))
            .setTimestamp()
            .setFooter({text: `Members: ${member.guild.memberCount}`});

        if (member.joinedTimestamp) {
            embed.addPair('Joined', time(member.joinedAt, TimestampStyles.RelativeTime));
        }

        const guild = await GuildWrapper.fetch(member.guild.id);
        await guild.logJoin({embeds: [embed]});
    }

}