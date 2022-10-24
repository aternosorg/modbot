import AbstractMutedRoleCommand from './AbstractMutedRoleCommand.js';

export default class CreateMutedRoleCommand extends AbstractMutedRoleCommand {
    async execute(interaction) {
        const role = await interaction.guild.roles.create({name: 'Muted', hoist: false});
        await this.setMutedRole(interaction, role);
    }

    getDescription() {
        return 'Create a muted role (required for long or permanent mutes)';
    }

    getName() {
        return 'create';
    }
}