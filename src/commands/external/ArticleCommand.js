import Command from '../Command.js';
import GuildSettings from '../../settings/GuildSettings.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    StringSelectMenuBuilder,
    userMention
} from 'discord.js';
import icons from '../../util/icons.js';
import {SELECT_MENU_OPTIONS_LIMIT, SELECT_MENU_TITLE_LIMIT} from '../../util/apiLimits.js';
import Cache from '../../bot/Cache.js';
import ErrorEmbed from '../../formatting/embeds/ErrorEmbed.js';
import MessageBuilder from '../../formatting/MessageBuilder.js';
import MarkdownConverter from '../../formatting/markdown/MarkdownConverter.js';

/**
 * @import {ZendeskArticle} from '../../apis/Zendesk.js';
 */


const completions = new Cache();
const CACHE_DURATION = 60 * 60 * 1000;
const ARTICLE_EMBED_PREVIEW_LENGTH = 1300;

export default class ArticleCommand extends Command {
    #markdownConverter = new MarkdownConverter();

    getName() {
        return 'article';
    }

    getDescription() {
        return 'Search articles in the help center';
    }

    buildOptions(builder) {
        builder.addStringOption(option =>
            option.setName('query')
                .setDescription('Search query')
                .setRequired(true)
                .setAutocomplete(true));
        builder.addUserOption(option =>
            option.setName('user')
                .setDescription('The user you\'re replying to. This user will be mentioned in the Message.')
                .setRequired(false));
        return builder;
    }

    isAvailableInAllGuilds() {
        return false;
    }

    async isAvailableIn(guild) {
        const guildSettings = await GuildSettings.get(guild.id);
        return !!guildSettings.helpcenter;
    }

    async execute(interaction) {
        const zendesk = (await GuildSettings.get(interaction.guild.id)).getZendesk();
        if (!zendesk) {
            await interaction.reply(ErrorEmbed.message('No help center configured!'));
            return;
        }

        const data = await zendesk.searchArticles(interaction.options.getString('query', true));
        if (!data.count) {
            await interaction.reply(ErrorEmbed.message('No article found!'));
            return;
        }

        const results = data.results.map(result => {
            return {
                default: false,
                label: result.title.substring(0, SELECT_MENU_TITLE_LIMIT),
                emoji: icons.article,
                value: result.id.toString()
            };
        }).slice(0, SELECT_MENU_OPTIONS_LIMIT);

        await interaction.reply(this.generateMessage(results, data.results[0], interaction.user.id, 0, interaction.options.getUser('user')?.id));
    }

    async executeSelectMenu(interaction) {
        const [, originalAuthor, mentionedUser] = interaction.customId.split(':');
        if (interaction.user.id !== originalAuthor) {
            await interaction.reply(ErrorEmbed.message('Only the person who executed this command can select a different result'));
            return;
        }

        const selectMenu = /** @type {import('discord.js').SelectMenuComponent} */
            this.findComponentWithCustomIdPrefix(interaction.message.components, 'article:');
        const index = selectMenu.options
            .findIndex(option => option.value === interaction.values[0]);
        const article = await (await GuildSettings.get(interaction.guildId)).getZendesk()
            .getArticle(selectMenu.options[index].value);
        await interaction.update(this.generateMessage(selectMenu.options, article, interaction.user.id, index, mentionedUser));
    }

    /**
     * Find a component with a specific custom id
     * @param {import('discord.js').AnyComponent} components
     * @param {string} customId
     * @returns {import('discord.js').AnyComponent|null}
     */
    findComponentWithCustomIdPrefix(components, customId) {
        for (const component of components) {
            if ('customId' in component && component.customId?.startsWith(customId)) {
                return component;
            }

            if ('components' in component) {
                const found = this.findComponentWithCustomIdPrefix(component.components, customId);
                if (found) {
                    return found;
                }
            }

            if ('component' in component && component.component?.customId?.startsWith(customId)) {
                return component.component;
            }
        }
        return null;
    }

    async complete(interaction) {
        const zendesk = (await GuildSettings.get(interaction.guild.id)).getZendesk();
        if (!zendesk) {
            return [];
        }

        const query = interaction.options.getString('query') ?? '';

        const cachedCompletions = completions.get(`${zendesk.identifier}:${query}`);
        if (cachedCompletions) {
            return cachedCompletions;
        }

        const articles = (query ? await zendesk.getArticleSuggestions(query) : await zendesk.getPromotedArticles())
            .map(r => {
                const title = r.title.replace(/<\/?[^>]+>/g, '');
                return {name: title, value: title};
            });

        completions.set(`${zendesk.identifier}:${query}`, articles, CACHE_DURATION);

        return articles;
    }

    /**
     * @param {import('discord.js').APISelectMenuOption[]} results
     * @param {ZendeskArticle} article
     * @param {import('discord.js').Snowflake} userId id of the user that executed the command
     * @param {number} [index]
     * @param {?import('discord.js').Snowflake} mention user to mention in the message
     * @returns {import('discord.js').InteractionReplyOptions}
     */
    generateMessage(results, article, userId, index = 0, mention = null) {
        for (const result of results) {
            result.default = false;
        }
        results[index].default = true;

        const message = new MessageBuilder();

        if (mention) {
            message.content = `${userMention(mention)} this article from our help center might help you:`;
        }

        const container = this.appendContent(message, results[index], article.body)
            .endComponent()
            .addSeparatorComponents()
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setOptions(results)
                        .setCustomId(`article:${userId}` + (mention ? `:${mention}` : ''))
                ),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Link)
                        .setURL(article.html_url)
                        .setLabel('View Article')
                ),
            )
            .toJSON();

        return {
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        };
    }

    /**
     * get a description from the HTML body of an article
     * @param {MessageBuilder} message
     * @param {import('discord.js').APISelectMenuOption} result
     * @param {string} body website body
     * @returns {MessageBuilder}
     */
    appendContent(message, result, body) {
        message.heading(result.label);

        let string = this.#markdownConverter.generate(body);
        if (string.length > ARTICLE_EMBED_PREVIEW_LENGTH) {
            string = string.substring(0, ARTICLE_EMBED_PREVIEW_LENGTH);
            message.text(string.replace(/\.?\n+.*$/, ''))
                .newLine()
                .subtext('To read more, click \'View Article\' below.');
        } else {
            message.text(string);
        }

        return message;
    }
}
