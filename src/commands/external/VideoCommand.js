import Command from '../Command.js';
import GuildSettings from '../../settings/GuildSettings.js';
import {SELECT_MENU_TITLE_LIMIT} from '../../util/apiLimits.js';
import icons from '../../util/icons.js';
import {ActionRowBuilder, SelectMenuBuilder} from 'discord.js';

const SELECT_MENU_TIMEOUT = 30 * 1000;

export default class VideoCommand extends Command {

    buildOptions(builder) {
        builder.addStringOption(option => option
            .setName('query')
            .setDescription('Search query')
            .setRequired(true)
            .setAutocomplete(true));
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const playlist = (await GuildSettings.get(interaction.guild.id)).getPlaylist();

        if (!playlist) {
            await interaction.reply('No playlist configured!');
            return;
        }

        const videos = await playlist.searchVideos(interaction.options.getString('query', true));

        if (!videos.length) {
            await interaction.reply({
                ephemeral: true,
                content: 'No video found!'
            });
            return;
        }

        /** @type {import('discord.js').APISelectMenuOption[]} */
        const results = videos.map(video => {
            return {
                default: false,
                label: video.item.snippet.title.substring(0, SELECT_MENU_TITLE_LIMIT),
                emoji: icons.article,
                value: video.item.etag,
            };
        }).slice(0, 5);

        const answer = /** @type {import('discord.js').Message} */
            await interaction.reply(this.generateMessage(results, videos[0].item.snippet.resourceId.videoId, 0));

        const collector = await answer.createMessageComponentCollector({
            filter: interaction => interaction.customId === 'video',
            idle: SELECT_MENU_TIMEOUT,
        });

        collector.on('collect', async (selectInteraction) => {
            if (selectInteraction.user.id !== interaction.user.id) {
                await selectInteraction.reply({
                    ephemeral: true,
                    content: 'Only the person who executed this command can select a different result'
                });
                return;
            }

            const index = videos.findIndex(video => video.item.etag === selectInteraction.values[0]);
            await selectInteraction.update(this.generateMessage(results, videos[index].item.snippet.resourceId.videoId, index));
        });

        await new Promise(resolve => collector.on('end', resolve));
        // Remove select menu
        await answer.edit({content: answer.content, components: []});
    }

    /**
     * @param {import('discord.js').APISelectMenuOption[]} videos
     * @param {string} videoId
     * @param {number} [index]
     * @return {import('discord.js').MessagePayload}
     */
    generateMessage(videos, videoId, index = 0) {
        for (const result of videos) {
            result.default = false;
        }
        videos[index].default = true;

        return {
            content: `https://youtu.be/${videoId}`,
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {any} */ new SelectMenuBuilder()
                            .setOptions(/** @type {any} */ videos)
                            .setCustomId('video')
                    ),
            ],
            fetchReply: true,
        };
    }

    async complete(interaction) {
        const playlist = (await GuildSettings.get(interaction.guild.id)).getPlaylist();

        if (!playlist) {
            await interaction.reply('No playlist configured!');
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