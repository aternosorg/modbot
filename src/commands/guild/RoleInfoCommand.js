import Command from '../Command.js';
import {PermissionFlagsBits, time, TimestampStyles} from 'discord.js';
import KeyValueEmbed from '../../embeds/KeyValueEmbed.js';

export default class RoleInfoCommand extends Command {

    buildOptions(builder) {
        builder.addRoleOption(option => option
            .setName('role')
            .setDescription('The role you want to view')
            .setRequired(true));
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const role = /** @type {import('discord.js').Role} */
            interaction.options.getRole('role', true);

        const permissions = role.permissions.has(PermissionFlagsBits.Administrator) ?
            'Administrator' : role.permissions.toArray().map(p => `\n- ${p}`).join('') || 'None';

        const embed = new KeyValueEmbed()
            .setTitle(`Role ${role.name}`)
            .setColor(role.color)
            .setImage(role.iconURL())
            .addPair('Name', role.name)
            .addPair('Created', time(role.created, TimestampStyles.ShortTime))
            .addPair('Managed', role.managed ? 'Yes' : 'No')
            .addPair('Hoisted', role.hoist ? 'Yes' : 'No')
            .addPair('Color', `${role.hexColor}`)
            .addPair('Permissions', permissions);


        await interaction.reply(embed.toMessage());
    }

    getDescription() {
        return 'Show information about a role';
    }

    getName() {
        return 'role';
    }
}