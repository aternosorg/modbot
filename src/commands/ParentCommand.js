import Command from './Command.js';
import {SlashCommandBuilder} from 'discord.js';
import SubCommandGroup from './SubCommandGroup.js';
import SubCommand from './SubCommand.js';

/**
 * @abstract
 */
export default class ParentCommand extends Command {
    /**
     * @abstract
     * @return {(SubCommand|SubCommandGroup)[]}
     */
    getChildren() {
        return [];
    }

    /**
     * build this slash command
     * @return {SlashCommandBuilder}
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
     * @return {Promise<SubCommand|SubCommandGroup|null>}
     */
    async #findChild(interaction) {
        const match = interaction.customId.match(/^[^:]+:([^:]+):/);
        if (!match || !match[1]) {
            return null;
        }

        return this.getChildren().find(child => child.getName() === match[1]) ?? null;
    }

    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand()
            ?? interaction.options.getSubcommandGroup();
        const child = this.getChildren().find(child => child.getName() === subCommand) ?? null;
        if (!child) {
            return;
        }

        await child.execute(interaction);
    }

    async executeModal(interaction) {
        const child = await this.#findChild(interaction);
        if (!child) {
            return;
        }

        await child.executeModal(interaction);
    }

    async executeButton(interaction) {
        const child = await this.#findChild(interaction);
        if (!child) {
            return;
        }

        await child.executeButton(interaction);
    }
}