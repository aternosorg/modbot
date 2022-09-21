import Command from '../Command.js';
import GuildSettings from '../../settings/GuildSettings.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SelectMenuBuilder,
} from 'discord.js';
import Turndown from 'turndown';
import icons from '../../util/icons.js';
import {SELECT_MENU_OPTIONS_LIMIT, SELECT_MENU_TITLE_LIMIT, SELECT_MENU_VALUE_LIMIT} from '../../util/apiLimits.js';
import Cache from '../../Cache.js';

const completions = new Cache();
const CACHE_DURATION = 60 * 60 * 1000;
const SELECT_MENU_TIMEOUT = 30 * 1000;
const ARTICLE_EMBED_PREVIEW_LENGTH = 1000;

export default class ArticleCommand extends Command {

    getName() {
        return 'article';
    }

    getDescription() {
        return 'Search articles in the help center';
    }

    buildOptions(builder) {
        builder
            .addStringOption(option =>
                option.setName('query')
                    .setDescription('Search query')
                    .setRequired(true)
                    .setAutocomplete(true));
        return builder;
    }

    async execute(interaction) {
        const zendesk = (await GuildSettings.get(interaction.guild.id)).getZendesk();
        if (!zendesk) {
            await interaction.reply('No help center configured!');
            return;
        }

        const data = await zendesk.searchArticles(interaction.options.getString('query', true));
        if (!data.count) {
            await interaction.reply({
                ephemeral: true,
                content: 'No article found!'
            });
            return;
        }

        const results = data.results.map(result => {
            return {
                default: false,
                label: result.title.substring(0, SELECT_MENU_TITLE_LIMIT),
                emoji: icons.article,
                value: result.html_url.substring(0, SELECT_MENU_VALUE_LIMIT)
            };
        }).slice(0, SELECT_MENU_OPTIONS_LIMIT);

        const answer = /** @type {import('discord.js').Message} */
            await interaction.reply(this.generateMessage(results, data.results[0].body, 0));

        const collector = await answer.createMessageComponentCollector({
            filter: interaction => interaction.customId === 'article',
            idle: SELECT_MENU_TIMEOUT,
        });

        collector.on('collect', async (interaction) => {
            const index = data.results.findIndex(result => result.html_url === interaction.values[0]);
            await interaction.update(this.generateMessage(results, data.results[index].body, index));
        });

        await new Promise(resolve => collector.on('end', resolve));
        // Remove select menu
        await answer.edit({embeds: answer.embeds, components: answer.components.slice(1)});
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
                return { name: title, value: title };
            });

        completions.set(`${zendesk.identifier}:${query}`, articles, CACHE_DURATION);

        return articles;
    }

    /**
     * @param {import('discord.js').APISelectMenuOption[]} results
     * @param {string} body
     * @param {number} [index]
     * @return {import('discord.js').MessagePayload}
     */
    generateMessage(results, body, index = 0) {
        for (const result of results) {
            result.default = false;
        }
        results[index].default = true;

        return {
            embeds: [this.createEmbed(results[index], body)],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {any} */ new SelectMenuBuilder()
                            .setOptions(/** @type {any} */ results)
                            .setCustomId('article')
                    ),
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {any} */ new ButtonBuilder()
                            .setStyle(ButtonStyle.Link)
                            .setURL(results[index].value)
                            .setLabel('View Article')
                    ),
            ],
            fetchReply: true,
        };
    }

    /**
     * get a description from the HTML body of an article
     * @param {import('discord.js').APISelectMenuOption} result
     * @param {string} body website body
     * @return {EmbedBuilder}
     */
    createEmbed(result, body) {
        const embed = new EmbedBuilder()
            .setTitle(result.label);

        //set up turndown
        const turndown = new Turndown({
            bulletListMarker: '-'
        })
            //convert headings to bold
            .addRule('headings', {
                filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
                replacement(content) {
                    if (!content) return '';
                    return '**' + content.replaceAll('**', '') + '**\n';
                }
            })
            //ignore pre tags
            .addRule('codeblocks', {
                filter: ['pre'],
                replacement(content) {
                    return '```' + content
                        .replace(/(?<!\\)[*_~`]+/g, '')
                        .replace(/\\([*_~`>[\]])/g, '$1')
                        + '```';
                }
            })
            //remove img tags
            .addRule('images', {
                filter: ['img'],
                replacement() {
                    return '';

                }
            })
            .addRule('iframes', {
                filter: ['iframe'],
                replacement(content, node) {
                    const url = node._attrsByQName.src.data;
                    const result = url.match(/^\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/(.*)/);
                    if (result) {
                        return 'https://youtu.be/' + result[1];
                    }
                    else {
                        return '';
                    }
                }
            });
        //convert string
        let string = turndown.turndown(body);
        if (string.length > ARTICLE_EMBED_PREVIEW_LENGTH) {
            string = string.substring(0, ARTICLE_EMBED_PREVIEW_LENGTH);
            string = string.replace(/\.?\n+.*$/, '');
            embed.setFooter({
                text: 'To read more, click \'View Article\' below.',
            });
        }

        embed.setDescription(string);
        return embed;
    }
}