const Command = require('../../Command');
const Request = require('../../Request');
const {MessageOptions} = require('discord.js');

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
            /** @type {MessageOptions} */
            const options = {content: request.JSON.results[0].html_url};

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
}

module.exports = ArticleCommand;
