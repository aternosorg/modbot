const {ConfigCommand, GetConfigCommand, SetConfigCommand} = require('../ConfigCommand');
const SubCommand = require('../SubCommand');
const Request = require('../../Request');

class GetHelpCenterCommand extends GetConfigCommand {

    static names = ['get','show'];

    static getParentCommand() {
        return HelpCenterCommand;
    }

    async execute() {
        if (!this.guildConfig.helpcenter) {
            await this.reply('There is no help-center configured');
        }
        else {
            await this.reply(`Active help-center: https://${this.guildConfig.helpcenter}.zendesk.com`);
        }
    }
}

class SetHelpCenterCommand extends SetConfigCommand {

    static getParentCommand() {
        return HelpCenterCommand;
    }

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

class DisableHelpCenterCommand extends SubCommand {

    static names = ['disable', 'off'];

    static description = 'Disable the spam protection.';

    static getParentCommand() {
        return HelpCenterCommand;
    }

    async execute() {
        this.guildConfig.helpcenter = null;
        await this.guildConfig.save();
        await this.reply('Disabled Zendesk help-center!');
    }
}

class HelpCenterCommand extends ConfigCommand {

    static names = ['helpcenter', 'zendesk'];

    static userPerms = ['MANAGE_GUILD'];

    static description = 'Configure the Zendesk help-center used in the article command.';

    static usage = 'get|set|disable';

    static getSubCommands() {
        return [GetHelpCenterCommand, SetHelpCenterCommand, DisableHelpCenterCommand];
    }
}

module.exports = HelpCenterCommand;
