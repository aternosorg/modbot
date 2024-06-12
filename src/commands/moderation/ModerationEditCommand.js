import Moderation from '../../database/Moderation.js';
import {parseTime} from '../../util/timeutils.js';
import ModerationEmbed from '../../embeds/ModerationEmbed.js';
import ErrorEmbed from '../../embeds/ErrorEmbed.js';
import CompletingModerationCommand from './CompletingModerationCommand.js';

export default class ModerationEditCommand extends CompletingModerationCommand {

    buildOptions(builder) {
        builder.addIntegerOption(option =>
            option.setName('id')
                .setDescription('Moderation id')
                .setRequired(true)
                .setMinValue(0)
                .setAutocomplete(true)
        );
        builder.addStringOption(option =>
            option.setName('reason')
                .setDescription('New moderation reason')
                .setRequired(false)
        );
        builder.addStringOption(option =>
            option.setName('comment')
                .setDescription('New moderation comment')
                .setRequired(false)
        );
        builder.addStringOption(option =>
            option.setName('duration')
                .setDescription('New moderation duration (since moderation creation)')
                .setRequired(false)
        );
        builder.addIntegerOption(option =>
            option.setName('count')
                .setDescription('Strike count')
                .setRequired(false)
                .setMinValue(1)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const id = interaction.options.getInteger('id', true);
        const moderation = await Moderation.get(interaction.guildId, id);
        if (!moderation) {
            await interaction.reply(ErrorEmbed.message('Unknown moderation'));
            return;
        }

        const reason = interaction.options.getString('reason'),
            comment = interaction.options.getString('comment'),
            duration = parseTime(interaction.options.getString('duration'));
        let count = interaction.options.getInteger('count');

        if (!reason && !duration && !count && !comment) {
            await interaction.reply(ErrorEmbed.message('You need to provide at least one option you want to change'));
            return;
        }

        if (reason) {
            moderation.reason = reason;
        }

        if (comment) {
            moderation.comment = comment;
        }

        if (duration) {
            if (!moderation.active) {
                await interaction.reply(ErrorEmbed.message('You can\'t update the duration of inactive moderations!'));
                return;
            }
            moderation.expireTime = moderation.created + duration;
        }

        if (count) {
            switch (moderation.action) {
                case 'strike':
                    break;
                case 'pardon':
                    count = -count;
                    break;
                default:
                    await interaction.reply(ErrorEmbed.message('You can only update the count for strikes and pardons!'));
                    return;
            }
            moderation.value = count;
        }

        await moderation.save();
        const user = await (await moderation.getMemberWrapper()).getMemberOrUser();
        await interaction.reply(new ModerationEmbed(moderation, user).toMessage());
    }

    getDescription() {
        return 'Edit a moderation';
    }

    getName() {
        return 'edit';
    }
}