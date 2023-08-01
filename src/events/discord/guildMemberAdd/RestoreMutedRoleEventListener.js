import GuildMemberAddEventListener from './GuildMemberAddEventListener.js';
import GuildSettings from '../../../settings/GuildSettings.js';
import GuildWrapper from '../../../discord/GuildWrapper.js';
import {escapeMarkdown, RESTJSONErrorCodes} from 'discord.js';
import database from '../../../bot/Database.js';
import KeyValueEmbed from '../../../embeds/KeyValueEmbed.js';

export default class RestoreMutedRoleEventListener extends GuildMemberAddEventListener {

    async execute(member) {
        if (member.communicationDisabledUntilTimestamp) {
            return;
        }

        const mute = await database.query(
            'SELECT * FROM moderations WHERE action = \'mute\' AND active = TRUE AND userid = ? AND guildid = ?',
            member.id,member.guild.id);

        if (mute) {
            const guildSettings = await GuildSettings.get(member.guild.id);

            if (!guildSettings.mutedRole) {
                return;
            }

            try {
                await member.roles.add(guildSettings.mutedRole);
            }
            catch (e) {
                if ([RESTJSONErrorCodes.UnknownMember, RESTJSONErrorCodes.UnknownRole].includes(e.code)) {
                    return;
                }
                throw e;
            }

            const guild = await GuildWrapper.fetch(member.guild.id);
            const embed = new KeyValueEmbed()
                .setTitle(`Restored mute | ${escapeMarkdown(member.displayName)}`)
                .addPair('User ID', member.id)
                .setDescription(`Mute ID: ${mute.id}`)
                .setFooter({text: member.id});
            await guild.log({embeds: [embed]});
        }
    }
}