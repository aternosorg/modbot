import Command from '../Command.js';
import {ALLOWED_SIZES, EmbedBuilder, escapeMarkdown} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import GuildWrapper from '../../discord/GuildWrapper.js';

const IMAGE_OPTIONS = {
    size: ALLOWED_SIZES.at(-1),
};

export default class AvatarCommand extends Command {
    isAvailableInDMs() {
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

    async execute(interaction) {
        const user = interaction.options.getUser('user') ?? interaction.user;
        const useServerProfile = interaction.options.getBoolean('use-server-profile') ?? true;
        await interaction.reply(await this.buildMessage(user, interaction.guild, useServerProfile));
    }

    /**
     * build the message
     * @param {import('discord.js').User} user
     * @param {import('discord.js').Guild|null} guild
     * @param {boolean} useServerProfile
     * @return {Promise<{ephemeral: boolean, embeds: EmbedBuilder[]}>}
     */
    async buildMessage(user, guild, useServerProfile = true) {
        let url = user.displayAvatarURL(IMAGE_OPTIONS);

        if (guild && useServerProfile) {
            const member = await (new MemberWrapper(user, new GuildWrapper(guild))).fetchMember();
            if (member) {
                url = member.displayAvatarURL(IMAGE_OPTIONS);
            }
        }

        return {
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Avatar of ${escapeMarkdown(user.tag)}`)
                    .setImage(url),
            ],
            ephemeral: true,
        };
    }

    getDescription() {
        return 'Show the avatar of a user';
    }

    getName() {
        return 'avatar';
    }
}