import Command from '../Command.js';
import {Collection, escapeMarkdown, PermissionFlagsBits, PermissionsBitField} from 'discord.js';
import LineEmbed from '../../embeds/LineEmbed.js';
import colors from '../../util/colors.js';
import {FETCH_BAN_PAGE_SIZE} from '../../util/apiLimits.js';
import ErrorEmbed from '../../embeds/ErrorEmbed.js';

/**
 * @import {User} from 'discord.js';
 * @import EmbedWrapper from '../../embeds/EmbedWrapper.js';
 */

export default class IDCommand extends Command {

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ViewAuditLog);
    }

    buildOptions(builder) {
        builder.addStringOption(option => option
            .setName('query')
            .setDescription('Username to search for (you can also provide a discrim for legacy users using #)')
            .setRequired(true)
            .setMinLength(2)
            .setMaxLength(37));
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const query = interaction.options.getString('query', true);

        await interaction.deferReply({ephemeral: true});

        /** @type {Collection<import('discord.js').Snowflake, (import('discord.js').GuildMember|import('discord.js').GuildBan)>} */
        const users = await interaction.guild.members.fetch({query});

        if (users.size) {
            await interaction.editReply(this.#generateResultEmbed(
                query,
                Array.from(users.values()),
                true
            ));
        }

        const bans = await this.#fetchAndFilterBans(interaction, query.toLowerCase());
        if (!bans.size && !users.size) {
            return void await interaction.editReply(ErrorEmbed.message('No users found'));
        }

        await interaction.editReply(this.#generateResultEmbed(query, Array.from(users.concat(bans).values())));
    }

    /**
     * generate an embed of results
     * @param {string} query
     * @param {(import('discord.js').GuildMember|import('discord.js').GuildBan)[]} results
     * @param {boolean} [stillSearching]
     * @returns {{embeds: EmbedWrapper[]}}
     */
    #generateResultEmbed(query, results, stillSearching = false) {
        const embed = new LineEmbed()
            .setColor(colors.GREEN);

        if (stillSearching) {
            embed.setFooter({text: 'I\'m still searching in the ban list, on guilds with a lot of bans this can take a while...'});
        }

        for (const result of results) {
            embed.addLine(`${escapeMarkdown(result.user.displayName)}: ${result.user.id}`);
        }

        const count = embed.getLineCount(), complete = count === results.length;
        return embed
            .setTitle(`${complete ? count : `First ${count}`} results for '${query}'`)
            .toMessage();
    }

    /**
     * @param {import('discord.js').Interaction} interaction
     * @param {string} user
     * @returns {Promise<Collection<import('discord.js').Snowflake, import('discord.js').GuildBan>>}
     */
    async #fetchAndFilterBans(interaction, user) {
        return (await this.#fetchAllBans(interaction))
            .filter(banInfo => this.#matches(banInfo.user, user));
    }

    /**
     * fetch all bans
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<Collection<import('discord.js').Snowflake, import('discord.js').GuildBan>>}
     */
    async #fetchAllBans(interaction) {
        let bans = new Collection();
        let done = false, previous = null;
        while (!done) {
            const options = {
                limit: FETCH_BAN_PAGE_SIZE
            };
            if (previous !== null) {
                options.after = previous;
            }

            const newBans = await interaction.guild.bans.fetch(options);
            bans = bans.concat(newBans);
            previous = newBans.lastKey();

            if (newBans.size < FETCH_BAN_PAGE_SIZE) {
                done = true;
            }
        }
        return bans;
    }

    /**
     *
     * @param {User} user
     * @param {string} query
     * @returns {boolean}
     * @private
     */
    #matches(user, query) {
        let names = [
            user.tag,
            user.globalName,
        ].filter(name => name).map(name => name.toLowerCase());

        return names.some(name => name.includes(query));
    }

    getDescription() {
        return 'Search for users in the member and ban list';
    }

    getName() {
        return 'id';
    }
}