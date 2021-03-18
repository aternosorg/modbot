const Command = require('../../Command');
const Request = require('../../Request');

class ArticleCommand extends Command {

    static description = 'Search articles in the help center';

    static usage = '<query>';

    static names = ['article'];

    async execute() {
        if (!this.guildConfig.helpcenter) {
            await this.message.channel.send('No help center configured!');
            return;
        }

        const query = this.args.join(' ').toLowerCase();
        if(!query){
            await this.sendUsage();
            return;
        }


        const request = new Request(`https://${this.guildConfig.helpcenter}.zendesk.com/api/v2/help_center/articles/search.json?query=`+encodeURIComponent(query));
        await request.getJSON()

        if(request.JSON.count !== 0){
            await this.message.channel.send(request.JSON.results[0].html_url);
        }
        else {
            await this.message.channel.send('No article found!');
        }
    }
}

module.exports = ArticleCommand;
