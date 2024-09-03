import ExecutableCommand from './ExecutableCommand.js';

/**
 * @abstract
 */
export default class SubCommand extends ExecutableCommand {
    /**
     * add options to slash command builder
     * @param {import('discord.js').SlashCommandSubcommandBuilder} builder
     * @returns {import('discord.js').SlashCommandSubcommandBuilder}
     */
    buildOptions(builder) {
        return super.buildOptions(builder);
    }

    /**
     * @param {import('discord.js').SlashCommandSubcommandBuilder} builder
     * @returns {import('discord.js').SlashCommandSubcommandBuilder}
     */
    buildSubCommand(builder) {
        builder.setName(this.getName());
        builder.setDescription(this.getDescription());
        this.buildOptions(builder);

        return builder;
    }
}