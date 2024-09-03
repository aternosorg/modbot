import SubCommand from '../SubCommand.js';
import ErrorEmbed from '../../embeds/ErrorEmbed.js';
import {resolveCname} from 'dns/promises';
import {inlineCode} from 'discord.js';
import GuildSettings from '../../settings/GuildSettings.js';
import Request from '../../bot/Request.js';
import EmbedWrapper from '../../embeds/EmbedWrapper.js';
import colors from '../../util/colors.js';
import commandManager from '../CommandManager.js';

const ZENDESK_REGEX = /^([\w.]+)\.zendesk\.com$/i;

export default class HelpCenterCommand extends SubCommand {

    buildOptions(builder) {
        builder.addStringOption(option => option
            .setName('domain')
            .setDescription('Zendesk help center domain (e.g. \'aternos.zendesk.com\' or \'support.aternos.org\').')
            .setRequired(false)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const option = interaction.options.getString('domain');
        const guildSettings = await GuildSettings.get(interaction.guildId);

        if (!option) {
            guildSettings.helpcenter = null;
            await guildSettings.save();
            await commandManager.updateCommandsForGuild(interaction.guild);
            return await interaction.reply(new EmbedWrapper()
                .setDescription('Disabled help center')
                .setColor(colors.RED)
                .toMessage()
            );
        }
        const domain = this.findDomain(option);
        if (!domain) {
            return await interaction.reply(ErrorEmbed.message('Invalid domain!'));
        }

        const name = await this.findHelpCenterName(domain);
        if (!name) {
            return await interaction.reply(ErrorEmbed.message('Only Zendesk help centers are supported. ' +
                `You must have a CNAME on your domain or use the ${inlineCode('.zendesk.com')} domain.`)
            );
        }

        const request = new Request(`https://${name}.zendesk.com/api/v2/help_center/articles.json`);
        try {
            await request.getJSON();
        } catch (e) {
            if (e.response?.statusCode === 404 || e.code === 'ENOTFOUND') {
                return await interaction.reply(ErrorEmbed.message('This Zendesk help center does not exist.'));
            } else {
                throw e;
            }
        }

        guildSettings.helpcenter = name;
        await guildSettings.save();
        await commandManager.updateCommandsForGuild(interaction.guild);
        await interaction.reply(new EmbedWrapper()
            .setDescription(`Set help center to https://${name}.zendesk.com/hc/`)
            .setColor(colors.GREEN)
            .toMessage()
        );
    }

    /**
     * @param {string} domain
     * @returns {?string}
     */
    findDomain(domain) {
        const match = domain.match(/^(?:https?:\/\/)?([\w.]+)(?:[/?].*)?$/i);
        if (!match) {
            return null;
        }

        return match[1];
    }

    /**
     * resolve the zendesk help center name
     * @param {string} domain
     * @returns {Promise<?string>}
     */
    async findHelpCenterName(domain) {
        if (domain.includes('.') && !ZENDESK_REGEX.test(domain)) {
            domain = await this.resolveCNAME(domain);

            if (!domain) {
                return null;
            }
        }

        const match = domain.match(ZENDESK_REGEX);
        if (match) {
            return match[1];
        }

        return domain;
    }

    /**
     * find a CNAME record pointing to a zendesk help center
     * @param {string} domain
     * @returns {Promise<?string>}
     */
    async resolveCNAME(domain) {
        try {
            const result = await resolveCname(domain);
            return result.find(entry => entry.endsWith('.zendesk.com')) ?? null;
        }
        catch {
            return null;
        }
    }

    getDescription() {
        return 'Configure the Zendesk help center used for the article command';
    }

    getName() {
        return 'help-center';
    }
}