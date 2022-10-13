import SubCommand from '../../SubCommand.js';
import GuildSettings from '../../../settings/GuildSettings.js';
import ChannelSettings from '../../../settings/ChannelSettings.js';
import {getEmbed} from './ShowInvitesCommand.js';
import ErrorEmbed from '../../../embeds/ErrorEmbed.js';

export default class SetInvitesCommand extends SubCommand {

    buildOptions(builder) {
        builder.addStringOption(option => option
            .setName('invites')
            .setDescription('Are invites allowed?')
            .addChoices(
                { name: 'Allowed', value: 'allowed' },
                { name: 'Forbidden', value: 'forbidden' },
                { name: 'Default (only available for channels)', value: 'default' },
            )
            .setRequired(true)
        );
        builder.addChannelOption(option => option
            .setName('channel')
            .setDescription('get the configuration for this channel')
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        let invites = null;

        switch (interaction.options.getString('invites')) {
            case 'default':
                invites = null;
                break;

            case 'allowed':
                invites = true;
                break;

            case 'forbidden':
                invites = false;
                break;
        }

        if (channel) {
            const channelSettings = await ChannelSettings.get(channel.id);
            channelSettings.invites = invites;
            await channelSettings.save();
            await interaction.reply(await getEmbed(interaction.guildId, channel));
        }
        else {
            if (invites === null) {
                return await interaction.reply(ErrorEmbed
                    .message('The option \'default\' is only allowed for channel overrides.'));
            }

            const guildSettings = await GuildSettings.get(interaction.guildId);
            guildSettings.invites = invites;
            await guildSettings.save();
            await interaction.reply(await getEmbed(interaction.guildId));
        }
    }

    getDescription() {
        return 'Configure if users are allowed to post invites (in this channel)';
    }

    getName() {
        return 'set';
    }
}