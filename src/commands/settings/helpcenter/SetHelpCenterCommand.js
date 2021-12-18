const SetConfigCommand = require('../../SetConfigCommand');
const Request = require('../../../Request');

class SetHelpCenterCommand extends SetConfigCommand {
    async execute() {
        let subdomain = this.options.getString('subdomain') ?? '';

        subdomain = subdomain
            .replace(/^https?:\/\//i, '')
            .replace(/\.zendesk\.com(\/.*)?$/ig, '');

        if (!subdomain || /[^\w]/.test(subdomain)) {
            await this.sendUsage();
            return;
        }

        const request = new Request(`https://${subdomain}.zendesk.com/api/v2/help_center/articles.json`);
        try {
            await request.getJSON();
        } catch (e) {
            if (e.response?.statusCode === 404 || e.code === 'ENOTFOUND') {
                await this.reply('This is not a valid help-center subdomain!');
                return;
            } else {
                throw e;
            }
        }
        this.guildConfig.helpcenter = subdomain;
        await this.guildConfig.save();
        await this.reply(`Set help-center to https://${subdomain}.zendesk.com/hc/`);
    }

    static getOptions() {
        return [{
            name: 'subdomain',
            type: 'STRING',
            description: 'Zendesk help-center subdomain (e.g. \'example.zendesk.com\'). Custom domains are not supported.',
            required: true,
        }];
    }

    parseOptions(args) {
        return [{
            type: 'STRING',
            name: 'subdomain',
            value: args.shift()
        }];
    }
}

module.exports = SetHelpCenterCommand;
