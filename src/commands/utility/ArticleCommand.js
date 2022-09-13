import Command from '../Command.js';
import GuildSettings from '../../settings/GuildSettings.js';
import got from 'got';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle, EmbedBuilder, SelectMenuBuilder,
} from 'discord.js';
import Turndown from 'turndown';
import icons from '../../util/icons.js';
import {SELECT_MENU_TITLE_LIMIT, SELECT_MENU_VALUE_LIMIT} from '../../util/apiLimits.js';

/**
 * cache of zendesk autocompletions
 * Helpcenter ID => Query => Completions
 * @type {Map<String, Map<String, import('discord.js').ApplicationCommandOptionChoiceData[]>>}
 */
const completionCache = new Map();

const CACHE_DURATION = 60 * 60 * 1000;
const SELECT_MENU_TIMEOUT = 30 * 1000;

function setCompletionCache(helpcenter, query, articles) {
    if (!completionCache.has(helpcenter)) {
        completionCache.set(helpcenter, new Map());
    }

    completionCache.get(helpcenter).set(query, articles);
    setTimeout(() => {
        const hcCache = completionCache.get(helpcenter);
        hcCache.delete(query);
        if (!hcCache.size) {
            completionCache.delete(helpcenter);
        }
    }, CACHE_DURATION);
}

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
        const guildConfig = (await GuildSettings.get(interaction.guild.id));
        if (!guildConfig.helpcenter) {
            await interaction.reply('No help center configured!');
            return;
        }

        const query = interaction.options.getString('query');

        /** @type {{count: number, results: {html_url: string, title: string, body: string}[]}} */
        const data = await got.get(`https://${guildConfig.helpcenter}.zendesk.com/api/v2/help_center/articles/search.json?query=` + encodeURIComponent(query)).json();
        if (data.count) {
            const results = data.results.map(result => {
                return {
                    default: false,
                    label: result.title.substring(0, SELECT_MENU_TITLE_LIMIT),
                    emoji: icons.article,
                    value: result.html_url.substring(0, SELECT_MENU_VALUE_LIMIT)
                };
            });

            /** @type {import('discord.js').Message} */
            const answer = await interaction.reply(this.generateMessage(results, data.results[0].body));

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
            await answer.edit({embeds: answer.embeds, components: answer.components.slice(0, 1)});
        }
        else {
            await interaction.reply({
                ephemeral: true,
                content: 'No article found!'
            });
        }
    }

    async complete(interaction) {
        const guildConfig = (await GuildSettings.get(interaction.guild.id));
        if (!guildConfig.helpcenter) {
            return [];
        }

        const query = interaction.options.getString('query') ?? '';

        const cachedCompletions = completionCache.get(guildConfig.helpcenter)?.get(query);
        if (cachedCompletions) {
            return cachedCompletions;
        }

        let articles = [];
        if (query) {
            const res = await got.get(`https://${guildConfig.helpcenter}.zendesk.com/hc/api/internal/instant_search.json?query=${encodeURIComponent(query)}`).json();
            if (res && res.results) {
                articles = res.results.map(r => {
                    const title = r.title.replace(/<\/?[^>]+>/g, '');
                    return { name: title, value: title };
                });
            }
        }
        else {
            const res = await got.get(`https://${guildConfig.helpcenter}.zendesk.com/api/v2/help_center/articles?per_page=100`).json();
            if (res && res.articles) {
                articles = res.articles.filter(r => r.promoted).map(r => {
                    const title = r.title.replace(/<\/?[^>]+>/g, '');
                    return { name: title, value: title };
                });
            }
        }

        setCompletionCache(guildConfig.helpcenter, query, articles);

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
                        /** @type {any} */ new ButtonBuilder()
                            .setStyle(ButtonStyle.Link)
                            .setURL(results[index].value)
                            .setLabel('View Article')
                    ),
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {any} */ new SelectMenuBuilder()
                            .setOptions(/** @type {any} */ results)
                            .setCustomId('article')
                    )
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
        if (string.length > 800) {
            string = string.substring(0, 800);
            string = string.replace(/\.?\n+.*$/, '');
            embed.setFooter({
                text: 'To read more, click \'View Article\' below.',
            });
        }

        embed.setDescription(string);
        return embed;
    }
}