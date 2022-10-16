import GuildMemberAddEventListener from './GuildMemberAddEventListener.js';
import GuildSettings from '../../../settings/GuildSettings.js';
import GuildWrapper from '../../../discord/GuildWrapper.js';
import {EmbedBuilder, escapeMarkdown, RESTJSONErrorCodes} from 'discord.js';
import database from '../../../bot/Database.js';

export default class RestoreMutedRoleEventListener extends GuildMemberAddEventListener {

    async execute(member) {
        if (member.communicationDisabledUntilTimestamp) {
            return;
        }

        const mute = await database.query(
            'SELECT * FROM moderations WHERE action = \'mute\' AND active = TRUE AND userid = ? AND guildid = ?',
            member.id,member.guild.id);

        if (mute) {
            const guildConfig = await GuildSettings.get(member.guild.id);
            try {
                await member.roles.add(guildConfig.mutedRole);
            }
            catch (e) {
                if ([RESTJSONErrorCodes.UnknownMember, RESTJSONErrorCodes.UnknownRole].includes(e.code)) {
                    return;
                }
                throw e;
            }

            const guild = await GuildWrapper.fetch(member.guild.id);
            const embed = new EmbedBuilder()
                .setTitle(`Restored mute | ${escapeMarkdown(member.user.tag)}`)
                .setDescription(`Mute ID: ${mute.id}`)
                .setFooter({text: member.id});
            await guild.log({embeds: [embed]});
        }
    }
}