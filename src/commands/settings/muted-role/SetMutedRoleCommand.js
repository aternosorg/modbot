import AbstractMutedRoleCommand from './AbstractMutedRoleCommand.js';

export default class SetMutedRoleCommand extends AbstractMutedRoleCommand {

    buildOptions(builder) {
        builder.addRoleOption(option => option
            .setName('role')
            .setDescription('The role you want to use for muted members')
            .setRequired(true)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const role = interaction.options.getRole('role', true);
        await this.setMutedRole(interaction,
            /** @type {import('discord.js').Role} */ role);
    }

    getDescription() {
        return 'Set a muted role (required for long or permanent mutes)';
    }

    getName() {
        return 'set';
    }
}