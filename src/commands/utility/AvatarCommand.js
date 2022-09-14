import Command from '../Command.js';
import {
    ALLOWED_SIZES,
    ApplicationCommandOptionType, Collection,
    CommandInteractionOptionResolver,
    EmbedBuilder,
    escapeMarkdown
} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import Bot from '../../bot/Bot.js';

const IMAGE_OPTIONS = {
    size: ALLOWED_SIZES.at(-1),
};

export default class AvatarCommand extends Command {

    supportsUserCommands() {
        return true;
    }

    buildOptions(builder) {
        builder
            .addUserOption(option =>
                option
                    .setRequired(false)
                    .setName('user')
                    .setDescription('The user who\'s avatar you want to view')
            )
            .addBooleanOption(option =>
                option
                    .setRequired(false)
                    .setName('use-server-profile')
                    .setDescription('Show avatar from server profile if it exists (default: true)')
            );
        return super.buildOptions(builder);
    }

    async promptForOptions(interaction) {
        interaction.options = new CommandInteractionOptionResolver(Bot.instance.client, [{
            name: 'user',
            user: interaction.targetUser,
            type: ApplicationCommandOptionType.User,
        }], {
            users: /** @type {Collection<import('discord.js').Snowflake, import('discord.js').User>} */
                new Collection().set(interaction.targetUser.id, interaction.targetUser)
        });
        return interaction;
    }

    async execute(interaction) {
        const user = interaction.options.getUser('user') ?? interaction.user;
        let url = user.displayAvatarURL(IMAGE_OPTIONS);

        if (interaction.options.getBoolean('use-server-profile') ?? true) {
            const member = await (new MemberWrapper(user, new GuildWrapper(interaction.guild))).fetchMember();
            if (member) {
                url = member.displayAvatarURL(IMAGE_OPTIONS);
            }
        }

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Avatar of ${escapeMarkdown(user.tag)}`)
                    .setImage(url),
            ],
            ephemeral: true,
        });
    }

    getDescription() {
        return 'Show the avatar of a user';
    }

    getName() {
        return 'avatar';
    }
}