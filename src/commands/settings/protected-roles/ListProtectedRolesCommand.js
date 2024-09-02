import SubCommand from '../../SubCommand.js';
import GuildSettings from '../../../settings/GuildSettings.js';
import LineEmbed from '../../../embeds/LineEmbed.js';
import {roleMention} from 'discord.js';
import GuildWrapper from '../../../discord/GuildWrapper.js';

export default class ListProtectedRolesCommand extends SubCommand {

    async execute(interaction) {
        const guildSettings = await GuildSettings.get(interaction.guildId);
        const embed = new LineEmbed()
            .setTitle('Protected roles')
            .setDescription('This server has no protected roles');

        const guild = new GuildWrapper(interaction.guild);

        const validRoles = new Set();
        for (const role of guildSettings.protectedRoles) {
            if (await guild.fetchRole(role)) {
                validRoles.add(role);
            }
            embed.addLine(`- ${roleMention(role)}`);
        }
        if (validRoles !== guildSettings.protectedRoles) {
            guildSettings.protectedRoles = validRoles;
            await guildSettings.save();
        }

        await interaction.reply(embed.toMessage());
    }

    getDescription() {
        return 'List the protected roles';
    }

    getName() {
        return 'list';
    }
}