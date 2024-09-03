import Command from '../Command.js';
import GuildSettings from '../../settings/GuildSettings.js';
import {SELECT_MENU_TITLE_LIMIT} from '../../util/apiLimits.js';
import icons from '../../util/icons.js';
import {ActionRowBuilder, StringSelectMenuBuilder, userMention} from 'discord.js';
import ErrorEmbed from '../../embeds/ErrorEmbed.js';
import config from '../../bot/Config.js';
import {componentEmojiIfExists} from '../../util/format.js';

export default class VideoCommand extends Command {

    buildOptions(builder) {
        builder.addStringOption(option => option
            .setName('query')
            .setDescription('Search query')
            .setRequired(true)
            .setAutocomplete(true));
        builder.addUserOption(option =>
            option.setName('user')
                .setDescription('The user you\'re replying to. This user will be mentioned in the Message.')
                .setRequired(false));
        return super.buildOptions(builder);
    }

    isAvailableInAllGuilds() {
        return false;
    }

    async isAvailableIn(guild) {
        const guildSettings = await GuildSettings.get(guild.id);
        return !!guildSettings.playlist;
    }

    async execute(interaction) {
        if (!config.data.googleApiKey) {
            return await interaction.reply(ErrorEmbed
                .message('There is no google API key configured for this instance of ModBot!'));
        }

        const playlist = (await GuildSettings.get(interaction.guild.id)).getPlaylist();
        if (!playlist) {
            await interaction.reply(ErrorEmbed.message('No playlist configured!'));
            return;
        }

        const videos = await playlist.searchVideos(interaction.options.getString('query', true));

        if (!videos.length) {
            await interaction.reply(ErrorEmbed.message('No video found!'));
            return;
        }

        /** @type {import('discord.js').APISelectMenuOption[]} */
        const results = videos.map(video => {
            return {
                default: false,
                label: video.item.snippet.title.substring(0, SELECT_MENU_TITLE_LIMIT),
                emoji: componentEmojiIfExists('youtube', icons.video),
                value: video.item.snippet.resourceId.videoId,
            };
        }).slice(0, 5);

        await interaction.reply(this.generateMessage(
            results,
            interaction.user.id,
            0,
            interaction.options.getUser('user')?.id,
        ));
    }

    async executeSelectMenu(interaction) {
        const [, originalAuthor, mentionedUser] = interaction.customId.split(':');
        if (interaction.user.id !== originalAuthor) {
            await interaction.reply(ErrorEmbed.message('Only the person who executed this command can select a different result'));
            return;
        }

        const selectMenu = /** @type {import('discord.js').SelectMenuComponent} */
            interaction.message.components[0].components[0];
        const index = selectMenu.options
            .findIndex(option => option.value === interaction.values[0]);
        await interaction.update(this.generateMessage(
            selectMenu.options,
            interaction.user.id,
            index,
            mentionedUser,
        ));
    }

    /**
     * @param {import('discord.js').APISelectMenuOption[]} videos
     * @param {import('discord.js').Snowflake} userId id of the user that executed this command
     * @param {number} [index]
     * @param {?import('discord.js').Snowflake} mention user to mention in the message
     * @returns {{content: string, components: ActionRowBuilder[], fetchReply: boolean}}
     */
    generateMessage(videos, userId, index = 0, mention = null) {
        for (const result of videos) {
            result.default = false;
        }
        videos[index].default = true;

        let content = `https://youtu.be/${videos[index].value}`;

        if (mention) {
            content = `${userMention(mention)} this video might help you:\n` + content;
        }

        return {
            content,
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {any} */ new StringSelectMenuBuilder()
                            .setOptions(/** @type {any} */ videos)
                            .setCustomId(`video:${userId}` + (mention ? `:${mention}` : ''))
                    ),
            ],
            fetchReply: true,
        };
    }

    async complete(interaction) {
        const playlist = (await GuildSettings.get(interaction.guild.id)).getPlaylist();

        if (!playlist || !config.data.googleApiKey) {
            return [];
        }

        const query = interaction.options.getString('query') ?? '';

        const videos = query ? (await playlist.searchVideos(query)).map(result => result.item) : await playlist.getVideos();

        return videos.map(video => {
            return {
                name: video.snippet.title,
                value: video.snippet.title,
            };
        });
    }

    getDescription() {
        return 'Search videos';
    }

    getName() {
        return 'video';
    }
}