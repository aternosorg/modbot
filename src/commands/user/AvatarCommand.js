import Command from '../Command.js';
import {
    ALLOWED_SIZES,
    escapeMarkdown,
    MediaGalleryItemBuilder,
    MessageFlags,
} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import MessageBuilder from '../../formatting/MessageBuilder.js';

/**
 * @type {import('discord.js').ImageURLOptions}
 */
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

    async executeButton(interaction) {
        const member = await MemberWrapper.getMemberFromCustomId(interaction);
        if (!member) {
            return;
        }

        await interaction.reply(await this.buildMessage(member.user, interaction.guild, true));
    }

    /**
     * build the message
     * @param {import('discord.js').User} user
     * @param {import('discord.js').Guild|null} guild
     * @param {boolean} useServerProfile
     * @returns {Promise<{flags: number, components: import('discord.js').ContainerBuilder[]}>}
     */
    async buildMessage(user, guild, useServerProfile = true) {
        let url = user.displayAvatarURL(IMAGE_OPTIONS);

        const member = new MemberWrapper(user, new GuildWrapper(guild));
        if (guild && useServerProfile && await member.fetchMember()) {
            url = member.member.displayAvatarURL(IMAGE_OPTIONS);
        }

        const message = new MessageBuilder()
            .heading(`Avatar of ${escapeMarkdown(user.displayName)}`)
            .image(new MediaGalleryItemBuilder().setURL(url));

        return {
            components: [message.endComponent()],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        };
    }

    getDescription() {
        return 'Show the avatar of a user';
    }

    getName() {
        return 'avatar';
    }
}
