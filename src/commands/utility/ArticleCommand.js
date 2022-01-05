const Command = require('../Command');
const Request = require('../../Request');
const {
    MessageOptions,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    ApplicationCommandOptionChoice,
} = require('discord.js');
const Turndown = require('turndown');
const got = require('got');
/**
 * cache of zendesk autocompletions
 * Helpcenter ID => Query => Completions
 * @type {Map<String, Map<String, ApplicationCommandOptionChoice[]>>}
 */
const completionCache = new Map();

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
    }, 60*60*1000);
}

class ArticleCommand extends Command {

    static description = 'Search articles in the help center';

    static usage = '<query>';

    static names = ['article', 'a'];

    static supportsSlashCommands = true;

    static ephemeral = false;

    async execute() {
        if (!this.guildConfig.helpcenter) {
            await this.sendError('No help center configured!');
            return;
        }

        const query = this.options.getString('query');
        if (!query) {
            await this.sendUsage();
            return;
        }

        const request = new Request(`https://${this.guildConfig.helpcenter}.zendesk.com/api/v2/help_center/articles/search.json?query=` + encodeURIComponent(query));
        await request.getJSON();

        if (request.JSON.count !== 0) {
            /**
             * @type {{html_url: String, title: String, label_names: String[], body: String}}
             */
            const result = request.JSON.results[0];
            /** @type {MessageOptions} */
            const options = {
                embeds: [
                    this.createEmbed(result)
                ],
                components: [
                    new MessageActionRow()
                        .addComponents(new MessageButton({
                            style: 'LINK',
                            url: result.html_url,
                            label: 'View Article',
                        }))
                ]
            };

            if (!this.source.isInteraction && this.userConfig.deleteCommands && this.source.getRaw().reference) {
                options.reply = {
                    messageReference: this.source.getRaw().reference.messageId,
                    failIfNotExists: false
                };
            }

            await this.reply(options);
        } else {
            await this.sendError('No article found!');
        }
    }

    async getAutoCompletions() {
        console.log('getting autocompletions');
        if (!this.guildConfig.helpcenter) {
            return [];
        }

        const query = this.options.getString('query') ?? '';

        const cachedCompletions = completionCache.get(this.guildConfig.helpcenter)?.get(query);
        if (cachedCompletions) {
            return cachedCompletions;
        }

        console.log('Requesting zendesk API!');
        const res = await got.get(`https://${this.guildConfig.helpcenter}.zendesk.com/hc/api/internal/instant_search.json?query=${encodeURIComponent(query)}`).json();
        const articles = res && res.results ? res.results.map(r => {
            const title = r.title.replace(/<\/?[^>]+>/g, '');
            return {
                name: title,
                value: title
            };
        }) : [];

        setCompletionCache(this.guildConfig.helpcenter, query, articles);

        return articles;
    }

    static getOptions() {
        return [{
            name: 'query',
            type: 'STRING',
            description: 'Search query',
            required: true,
            autocomplete: true,
        }];
    }

    parseOptions(args) {
        return [
            {
                name: 'query',
                type: 'STRING',
                value: args.join(' '),
            }
        ];
    }

    /**
     * get a description from the HTML body of an article
     * @param result
     * @return {MessageEmbed}
     */
    createEmbed(result) {
        const embed = new MessageEmbed()
            .setTitle(result.title);

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
        let string = turndown.turndown(result.body);
        if (string.length > 800) {
            string = string.substr(0, 800);
            string = string.replace(/\.?\n+.*$/, '');
            embed.setFooter({
                text: 'To read more, click \'View Article\' below.',
            });
        }

        embed.setDescription(string);
        return embed;
    }
}

module.exports = ArticleCommand;
