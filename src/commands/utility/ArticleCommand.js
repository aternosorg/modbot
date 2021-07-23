const Command = require('../../Command');
const Request = require('../../Request');
const {MessageOptions} = require('discord.js');

class ArticleCommand extends Command {

    static description = 'Search articles in the help center';

    static usage = '<query>';

    static names = ['article', 'a'];

    async execute() {
        if (!this.guildConfig.helpcenter) {
            await this.reply('No help center configured!');
            return;
        }

        const query = this.args.join(' ').toLowerCase();
        if(!query){
            await this.sendUsage();
            return;
        }


        const request = new Request(`https://${this.guildConfig.helpcenter}.zendesk.com/api/v2/help_center/articles/search.json?query=`+encodeURIComponent(query));
        await request.getJSON();

        if(request.JSON.count !== 0){
            /** @type {MessageOptions} */
            const options = {content: request.JSON.results[0].html_url};

            if (this.userConfig.deleteCommands && this.message.reference) {
                options.reply = {
                    messageReference: this.message.reference.messageId,
                    failIfNotExists: false
                };
            }

            await this.message.channel.send(options);
        }
        else {
            await this.reply('No article found!');
        }
    }
}

module.exports = ArticleCommand;
