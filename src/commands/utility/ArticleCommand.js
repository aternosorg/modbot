const Command = require('../../Command');
const Request = require('../../Request');
const {MessageOptions, MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');
const Turndown = require('turndown');

class ArticleCommand extends Command {

    static description = 'Search articles in the help center';

    static usage = '<query>';

    static names = ['article', 'a'];

    static supportsSlashCommands = true;

    async execute() {
        if (!this.guildConfig.helpcenter) {
            await this.sendError('No help center configured!');
            return;
        }

        const query = this.options.getString('query');
        if(!query){
            await this.sendUsage();
            return;
        }

        const request = new Request(`https://${this.guildConfig.helpcenter}.zendesk.com/api/v2/help_center/articles/search.json?query=`+encodeURIComponent(query));
        await request.getJSON();

        if(request.JSON.count !== 0){
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
        }
        else {
            await this.sendError('No article found!');
        }
    }

    static getOptions() {
        return [{
            name: 'query',
            type: 'STRING',
            description: 'Search query',
            required: true,
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
        });
        //convert headings to bold
        turndown.addRule('headings', {
            filter: ['h1','h2','h3','h4','h5','h6'],
            replacement: function (content) {
                return '**' + content.replaceAll('**', '') + '**\n';
            }
        });
        //ignore pre tags
        turndown.addRule('codeblocks', {
            filter: ['pre'],
            replacement: function (content) {
                return '```' + content.replace(/(?<!\\)[*_~`]+/g, '') + '```';
            }
        });

        //convert string
        let string = turndown.turndown(result.body.replace(/<img[^>]+>/g, ''));
        if (string.length > 800) {
            string = string.substr(0, 800);
            string = string.replace(/\.?\n+.*$/, '');
            embed.setFooter('To read more click \'View Article\' below.');
        }

        embed.setDescription(string);
        return embed;
    }
}

module.exports = ArticleCommand;
