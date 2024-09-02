import SubCommand from '../../SubCommand.js';
import GuildSettings from '../../../settings/GuildSettings.js';
import EmbedWrapper from '../../../embeds/EmbedWrapper.js';
import colors from '../../../util/colors.js';
import {roleMention} from 'discord.js';

export default class AddProtectedRoleCommand extends SubCommand {

    buildOptions(builder) {
        builder.addRoleOption(option => option
            .setName('role')
            .setDescription('The role you want to protect from being moderated')
            .setRequired(true)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const role = interaction.options.getRole('role', true);
        const guildSettings = await GuildSettings.get(interaction.guildId);
        const embed = new EmbedWrapper();

        if (guildSettings.protectedRoles.has(role.id)) {
            embed.setColor(colors.RED)
                .setDescription(`${roleMention(role.id)} is already a protected role!`);
        }
        else {
            guildSettings.protectedRoles.add(role.id);
            await guildSettings.save();
            embed.setColor(colors.GREEN)
                .setDescription(`Added ${roleMention(role.id)} to the protected roles!`);
        }

        await interaction.reply(embed.toMessage());
    }

    getDescription() {
        return 'Add a protected role';
    }

    getName() {
        return 'add';
    }
}