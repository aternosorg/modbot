import SubCommand from '../SubCommand.js';
import ErrorEmbed from '../../embeds/ErrorEmbed.js';
import GuildSettings from '../../settings/GuildSettings.js';
import EmbedWrapper from '../../embeds/EmbedWrapper.js';
import colors from '../../util/colors.js';
import commandManager from '../CommandManager.js';
import config from '../../bot/Config.js';
import YouTubePlaylist from '../../apis/YouTubePlaylist.js';

const PLAYLIST_REGEX = /^(?:(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*[&?]list=)?([a-zA-Z0-9\-_]+?)(?:&.*)?$/i;

export default class PlaylistCommand extends SubCommand {

    buildOptions(builder) {
        builder.addStringOption(option => option
            .setName('playlist')
            .setDescription('YouTube playlist url or id.')
            .setRequired(false)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const option = interaction.options.getString('playlist');
        const guildSettings = await GuildSettings.get(interaction.guildId);

        if (!option) {
            guildSettings.playlist = null;
            await guildSettings.save();
            await commandManager.updateCommandsForGuild(interaction.guild);
            return await interaction.editReply(new EmbedWrapper()
                .setDescription('Disabled playlist')
                .setColor(colors.RED)
                .toMessage()
            );
        }

        if (!config.data.googleApiKey) {
            return await interaction.editReply(ErrorEmbed
                .message('There is no google API key configured for this instance of ModBot!'));
        }

        const id = this.getPlaylistId(option);
        if (!id) {
            return await interaction.editReply(ErrorEmbed.message('Invalid playlist URL!'));
        }

        if (!await YouTubePlaylist.isValidPlaylist(id)) {
            await interaction.editReply(ErrorEmbed
                .message('Playlist not found. Make sure the playlist is public or unlisted and the link is correct.'));
            return;
        }

        guildSettings.getPlaylist()?.clearCache();
        guildSettings.playlist = id;
        const playlist = new YouTubePlaylist(id);

        await guildSettings.save();
        await commandManager.updateCommandsForGuild(interaction.guild);
        await interaction.editReply(new EmbedWrapper()
            .setDescription(`Set playlist to ${playlist.getFormattedUrl()}`)
            .setColor(colors.GREEN)
            .toMessage()
        );
    }

    /**
     * @param {string} url
     * @returns {?string}
     */
    getPlaylistId(url) {
        const match = url.match(PLAYLIST_REGEX);
        if (!match) {
            return null;
        }

        return match[1];
    }

    getDescription() {
        return 'Configure YouTube playlist used for the video command';
    }

    getName() {
        return 'playlist';
    }
}