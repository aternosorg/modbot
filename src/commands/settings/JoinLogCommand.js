import SubCommand from '../SubCommand.js';
import GuildSettings from '../../settings/GuildSettings.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import {PermissionFlagsBits} from 'discord.js';

export default class JoinLogCommand extends SubCommand {

    buildOptions(builder) {
        builder.addChannelOption(option => option
            .setName('channel')
            .setDescription('Join log channel')
            .setRequired(false)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const channelId = interaction.options.getChannel('channel')?.id;
        if (channelId) {
            const channel = await new GuildWrapper(interaction.guild).fetchChannel(channelId);

            if (!channel) {
                await interaction.reply({
                    ephemeral: true,
                    content: 'I can\'t access that channel!'
                });
                return;
            }

            if (!channel.permissionsFor(interaction.guild.members.me)
                .has(PermissionFlagsBits.SendMessages)) {
                await interaction.reply({
                    ephemeral: true,
                    content: 'I can\'t send messages to that channel!'
                });
                return;
            }
        }

        const guildSettings = await GuildSettings.get(interaction.guildId);
        guildSettings.joinLogChannel = channelId;
        await guildSettings.save();
        await interaction.reply({
            ephemeral: true,
            content: channelId ? `Set join log to <#${channelId}>.` : 'Disabled join log.'
        });
    }

    getDescription() {
        return 'Set the channel where joins and leaves messages are logged';
    }

    getName() {
        return 'join-log';
    }
}