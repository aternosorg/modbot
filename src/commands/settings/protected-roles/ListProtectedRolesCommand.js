import SubCommand from '../../SubCommand.js';
import GuildSettings from '../../../settings/GuildSettings.js';
import LineEmbed from '../../../embeds/LineEmbed.js';
import {roleMention} from 'discord.js';

export default class ListProtectedRolesCommand extends SubCommand {

    async execute(interaction) {
        const guildSettings = await GuildSettings.get(interaction.guildId);
        const embed = new LineEmbed()
            .setTitle('Protected roles')
            .setDescription('This server has no protected roles');

        for (const role of guildSettings.getProtectedRoles()) {
            embed.addLine(`- ${roleMention(role)}`);
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