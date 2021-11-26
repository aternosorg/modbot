const Command = require('../Command');
const Request = require('../../Request');

class HelpCenterCommand extends Command {

    static description = 'Configure the Zendesk help center';

    static usage = '<url|id>|off|show';

    static names = ['helpcenter', 'zendesk'];

    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        if (this.args.length !== 1) {
            await this.sendUsage();
            return;
        }

        switch (this.args[0].toLowerCase()) {
            case 'off':
                this.guildConfig.helpcenter = null;
                await this.guildConfig.save();
                await this.reply('Disabled Zendesk help center!');
                break;
            case 'show':
                if (!this.guildConfig.helpcenter) {
                    await this.reply('There is no help center configured');
                }
                else {
                    await this.reply(`Active help center: https://${this.guildConfig.helpcenter}.zendesk.com`);
                }
                break;
            default: {
                let subdomain = this.args.shift().replace(/^https?:\/\/|\.zendesk\.com(\/.*)?$/ig, '').replace(/[^\w]/g, '');

                if (!subdomain) {
                    await this.sendUsage();
                    return;
                }

                const request = new Request(`https://${subdomain}.zendesk.com/api/v2/help_center/articles.json`);
                try {
                    await request.getJSON();
                } catch (e) {
                    if (e.response?.statusCode === 404 || e.code === 'ENOTFOUND') {
                        await this.reply('This is not a valid helpcenter subdomain!');
                        return;
                    } else {
                        throw e;
                    }
                }
                this.guildConfig.helpcenter = subdomain;
                await this.guildConfig.save();
                await this.reply(`Set help center to https://${subdomain}.zendesk.com`);
            }
        }
    }
}

module.exports = HelpCenterCommand;
