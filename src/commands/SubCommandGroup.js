import ExecutableCommand from './ExecutableCommand.js';
import CommandManager from './CommandManager.js';

export default class SubCommandGroup extends ExecutableCommand {

    /**
     * @abstract
     * @return {string}
     */
    getName() {
        return 'unknown';
    }

    /**
     * @abstract
     * @return {string}
     */
    getDescription() {
        return 'unknown';
    }

    /**
     * @abstract
     * @return {SubCommand[]}
     */
    getChildren() {
        return [];
    }

    /**
     * @param {import('discord.js').SlashCommandSubcommandGroupBuilder} builder
     * @return {import('discord.js').SlashCommandSubcommandGroupBuilder}
     */
    buildSubCommandGroup(builder) {
        builder.setName(this.getName());
        builder.setDescription(this.getDescription());

        for (const child of this.getChildren()) {
            builder.addSubcommand(child.buildSubCommand.bind(child));
        }

        return builder;
    }

    /**
     * find a child by the custom id of the moderation
     * must use syntax 'command:subcommand:other-data'
     * @param {import('discord.js').Interaction} interaction
     * @return {Promise<SubCommand|SubCommandGroup|null>}
     */
    async #findChild(interaction) {
        const match = interaction.customId.match(/^[^:]+:[^:]+:([^:]+)(:|$)/);
        if (!match || !match[1]) {
            return null;
        }

        return this.getChildren().find(child => child.getName() === match[1]) ?? null;
    }

    async execute(interaction) {
        const name = interaction.options.getSubcommand();
        const command = this.getChildren().find(child => child.getName() === name) ?? null;
        if (!await CommandManager.instance.checkCommandAvailability(command, interaction)) {
            return;
        }

        await command.execute(interaction);
    }

    async executeModal(interaction) {
        const command = await this.#findChild(interaction);
        if (!await CommandManager.instance.checkCommandAvailability(command, interaction)) {
            return;
        }

        await command.executeModal(interaction);
    }

    async executeButton(interaction) {
        const command = await this.#findChild(interaction);
        if (!await CommandManager.instance.checkCommandAvailability(command, interaction)) {
            return;
        }

        await command.executeButton(interaction);
    }
}