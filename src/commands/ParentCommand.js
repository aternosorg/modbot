import Command from './Command.js';
import {SlashCommandBuilder} from 'discord.js';
import SubCommandGroup from './SubCommandGroup.js';
import SubCommand from './SubCommand.js';
import commandManager from './CommandManager.js';

/**
 * @abstract
 */
export default class ParentCommand extends Command {
    /**
     * @abstract
     * @returns {(SubCommand|SubCommandGroup)[]}
     */
    getChildren() {
        return [];
    }

    /**
     * build this slash command
     * @returns {SlashCommandBuilder}
     */
    buildSlashCommand() {
        const builder = new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription(this.getDescription())
            .setDefaultMemberPermissions(this.getDefaultMemberPermissions()?.bitfield)
            .setDMPermission(this.isAvailableInDMs());

        for (const child of this.getChildren()) {
            if (child instanceof SubCommandGroup) {
                builder.addSubcommandGroup(child.buildSubCommandGroup.bind(child));
            } else if (child instanceof SubCommand) {
                builder.addSubcommand(child.buildSubCommand.bind(child));
            }
        }

        return builder;
    }

    /**
     * find a child by the custom id of the moderation
     * must use syntax 'command:subcommand:other-data'
     * @param {import('discord.js').Interaction} interaction
     * @returns {SubCommand|SubCommandGroup|null}
     */
    #findChildByCustomId(interaction) {
        const name = interaction.customId.split(':')[1];

        return this.getChildren().find(child => child.getName() === name) ?? null;
    }

    /**
     * find a child by the sub command name
     * @param {import('discord.js').Interaction} interaction
     * @returns {SubCommand|SubCommandGroup|null}
     */
    #findChildByName(interaction) {
        const name = interaction.options.getSubcommandGroup()
            ?? interaction.options.getSubcommand();
        return  this.getChildren().find(child => child.getName() === name) ?? null;
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