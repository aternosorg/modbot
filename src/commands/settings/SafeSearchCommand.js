import Command from '../Command.js';
import GuildSettings from '../../settings/GuildSettings.js';
import config from '../../bot/Config.js';
import colors from '../../util/colors.js';
import LineEmbed from '../../embeds/LineEmbed.js';
import {bold, PermissionsBitField, PermissionFlagsBits} from 'discord.js';

export default class SafeSearchCommand extends Command {

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ManageGuild);
    }

    isAvailableInAllGuilds() {
        return false;
    }

    async isAvailableIn(guild) {
        const guildSettings = await GuildSettings.get(guild.id);
        return config.data.googleCloud.vision?.enabled && guildSettings.isFeatureWhitelisted;
    }

    buildOptions(builder) {
        builder.addBooleanOption(enabled => enabled
            .setName('enabled')
            .setRequired(true)
            .setDescription('Should images be scanned? (excludes age-restricted channels)')
        );
        builder.addIntegerOption(strikes => strikes
            .setName('strikes')
            .setRequired(false)
            .setDescription('How many strikes should a user receive if the image is very likely to contain unsafe content?')
            .setMinValue(0)
            .setMaxValue(100)
        );
        builder.addIntegerOption(strikes => strikes
            .setName('likelihood')
            .setRequired(false)
            .setDescription('Likelihood required to delete an image')
            .setChoices({
                name: 'possible',
                value: 0,
            },{
                name: 'likely',
                value: 1,
            }, {
                name: 'very likely',
                value: 2,
            })
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const enabled = interaction.options.getBoolean('enabled', true);
        const guildSettings = await GuildSettings.get(interaction.guild.id);
        const strikes = interaction.options.getInteger('strikes') ?? guildSettings.safeSearch.strikes;
        const likelihood = interaction.options.getInteger('likelihood') ?? guildSettings.safeSearch.likelihood;

        guildSettings.safeSearch = {enabled, strikes, likelihood};
        await guildSettings.save();

        const embed = new LineEmbed();
        if (enabled) {
            embed.setColor(colors.GREEN)
                .addLine(`Images ${guildSettings.displayLikelihood()} adult, violent, medical or racy content ${bold('will be deleted')}.`);

            if (strikes) {
                embed.addLine(`If the detection is ${bold('very likely')} to be correct the user will receive ${bold(strikes + ' strikes')}`);
            }
        }
        else {
            embed.setColor(colors.RED)
                .addLine('Images will not be scanned for adult, violent, medical or racy content.');
        }

        await interaction.reply(embed.toMessage());
    }

    getDescription() {
        return 'Scan images for adult, violent, medical and racy content using Google Cloud Vision.';
    }

    getName() {
        return 'safe-search';
    }
}