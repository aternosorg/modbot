import ExecutableCommand from './ExecutableCommand.js';
import commandManager from './CommandManager.js';

/**
 * @import SubCommand from './SubCommand.js';
 */

export default class SubCommandGroup extends ExecutableCommand {

    /**
     * @abstract
     * @returns {string}
     */
    getName() {
        return 'unknown';
    }

    /**
     * @abstract
     * @returns {string}
     */
    getDescription() {
        return 'unknown';
    }

    /**
     * @abstract
     * @returns {SubCommand[]}
     */
    getChildren() {
        return [];
    }

    /**
     * @param {import('discord.js').SlashCommandSubcommandGroupBuilder} builder
     * @returns {import('discord.js').SlashCommandSubcommandGroupBuilder}
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
     * find a child by the sub command name
     * @param {import('discord.js').Interaction} interaction
     * @returns {SubCommand|null}
     */
    #findChildByName(interaction) {
        const name = interaction.options.getSubcommand();
        return  this.getChildren().find(child => child.getName() === name) ?? null;
    }

    /**
     * find a child by the custom id of the moderation
     * must use syntax 'command:subcommand:other-data'
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<SubCommand|null>}
     */
    async #findChildByCustomId(interaction) {
        const name = interaction.customId.split(':')[2];

        return this.getChildren().find(child => child.getName() === name) ?? null;
    }

    async execute(interaction) {
        const command = this.#findChildByName(interaction);
        if (!await commandManager.checkCommandAvailability(command, interaction)) {
            return;
        }

        await command.execute(interaction);
    }

    async executeModal(interaction) {
        const command = await this.#findChildByCustomId(interaction);
        if (!await commandManager.checkCommandAvailability(command, interaction)) {
            return;
        }

        await command.executeModal(interaction);
    }

    async executeButton(interaction) {
        const command = await this.#findChildByCustomId(interaction);
        if (!await commandManager.checkCommandAvailability(command, interaction)) {
            return;
        }

        await command.executeButton(interaction);
    }

    async executeSelectMenu(interaction) {
        const command = await this.#findChildByCustomId(interaction);
        if (!await commandManager.checkCommandAvailability(command, interaction)) {
            return;
        }

        await command.executeSelectMenu(interaction);
    }

    async complete(interaction) {
        const command = await this.#findChildByName(interaction);
        if (!command) {
            return [];
        }

        return await command.complete(interaction);
    }
}