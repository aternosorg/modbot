import EventListener from '../EventListener.js';
import {escapeMarkdown} from 'discord.js';
import database from '../../bot/Database.js';
import {formatTime} from '../../util/timeutils.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import KeyValueEmbed from '../../embeds/KeyValueEmbed.js';

export default class BanRemoveEventListener extends EventListener {
    get name() {
        return 'guildBanRemove';
    }

    /**
     * @param {import('discord.js').GuildBan} ban
     * @returns {Promise<void>}
     */
    async execute(ban) {
        const databaseBan = await database.query(
            'SELECT * FROM moderations WHERE action = \'ban\' AND active = TRUE AND userid = ? AND guildid = ?',
            ban.user.id, ban.guild.id);
        if (databaseBan) {
            await database.query(
                'UPDATE moderations SET active = FALSE WHERE action = \'ban\' AND active = TRUE AND userid = ? AND guildid = ?',
                ban.user.id, ban.guild.id);

            const embed = new KeyValueEmbed()
                .setAuthor({
                    name: `Ban ${databaseBan.id} was deleted from guild | ${escapeMarkdown(ban.user.displayName)}`,
                    iconURL: ban.user.avatarURL()
                })
                .setFooter({text: ban.user.id})
                .addPair('User ID', ban.user.id);

            if (databaseBan.expireTime) {
                const remaining = databaseBan.expireTime - Math.floor(Date.now()/1000);
                embed.addPair('Remaining timer', formatTime(remaining));
            }
            await (await GuildWrapper.fetch(ban.guild.id)).log({embeds: [embed]});
        }
    }
}