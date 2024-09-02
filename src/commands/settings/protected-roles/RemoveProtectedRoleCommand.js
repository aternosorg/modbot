import SubCommand from '../../SubCommand.js';
import GuildSettings from '../../../settings/GuildSettings.js';
import EmbedWrapper from '../../../embeds/EmbedWrapper.js';
import colors from '../../../util/colors.js';
import {roleMention} from 'discord.js';

export default class RemoveProtectedRoleCommand extends SubCommand {

    buildOptions(builder) {
        builder.addRoleOption(option => option
            .setName('role')
            .setDescription('The role you want to remove')
            .setRequired(true)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const role = interaction.options.getRole('role', true);
        const guildSettings = await GuildSettings.get(interaction.guildId);
        const embed = new EmbedWrapper();

        if (guildSettings.protectedRoles.has(role.id)) {
            guildSettings.protectedRoles.delete(role.id);
            await guildSettings.save();
            embed.setColor(colors.RED)
                .setDescription(`Removed ${roleMention(role.id)} from the protected roles!`);
        } else {
            embed.setColor(colors.RED)
                .setDescription(`${roleMention(role.id)} is not a protected role!`);
        }

        await interaction.reply(embed.toMessage());
    }

    getDescription() {
        return 'Remove a protected role';
    }

    getName() {
        return 'remove';
    }
}