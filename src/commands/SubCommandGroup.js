export default class SubCommandGroup {

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
            builder.addSubcommand(child.buildSubCommand);
        }

        return builder;
    }
}