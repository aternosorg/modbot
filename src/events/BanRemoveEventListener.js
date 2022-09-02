import EventListener from './EventListener.js';
import {EmbedBuilder, escapeMarkdown} from 'discord.js';
import Database from '../bot/Database.js';
import {formatTime} from '../util/timeutils';
import GuildWrapper from '../discord/GuildWrapper.js';

export default class BanRemoveEventListener extends EventListener {
    get name() {
        return 'guildBanRemove';
    }

    /**
     * @param {import('discord.js').GuildBan} ban
     * @return {Promise<void>}
     */
    async execute(ban) {
        const databaseBan = await Database.instance.query(
            'SELECT * FROM moderations WHERE action = \'ban\' AND active = TRUE AND userid = ? AND guildid = ?',
            ban.user.id, ban.guild.id);
        if (databaseBan) {
            await Database.instance.query(
                'UPDATE moderations SET active = FALSE WHERE action = \'ban\' AND active = TRUE AND userid = ? AND guildid = ?',
                ban.user.id, ban.guild.id);

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `Ban ${databaseBan.id} was deleted from guild | ${escapeMarkdown(ban.user.tag)}`,
                    iconURL: ban.user.avatarURL()
                })
                .setFooter({text: ban.user.id});

            if (databaseBan.expireTime) {
                const remaining = databaseBan.expireTime - Math.floor(Date.now()/1000);
                embed.addFields([{
                    name: 'Remaining timer',
                    value: formatTime(remaining)
                }]);
            }
            await (await GuildWrapper.fetch(ban.guild.id))
                .log({embeds: [embed]});
        }
    }
}