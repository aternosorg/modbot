const Command = require('./OldCommand.js');
const SubCommand = require('./SubCommand.js');

/**
 * OldCommand used to set settings options (guild/channel/user configs)
 * @class
 * @abstract
 */
class ConfigCommand extends OldCommand {
    /**
     * the subcommand executed right now
     * @type {SubCommand}
     */
    subCommand;

    /**
     * List of sub commands
     * @return {(typeof SubCommand)[]}
     * @abstract
     */
    static getSubCommands() {
        return [];
    }

    static getOptions() {
        return this.getSubCommands().map(c => {
            c.parentCommand = this;
            return {
                type: c.type,
                name: c.getPrimaryName(),
                description: c.description,
                options: c.getOptions(),
            };
        });
    }

    parseOptions(args) {
        const name = args.shift();
        return [{
            type: 'SUB_COMMAND',
            name: name,
            options: this.getSubCommand(name)?.parseOptions(args)
        }];
    }

    /**
     * get the correct sub command
     * @param {string} name
     * @return {SubCommand}
     */
    getSubCommand(name) {
        if (this.subCommand) return this.subCommand;
        for (const SC of this.constructor.getSubCommands()) {
            if (SC.names.includes(name)) {
                return this.subCommand = new SC(this.source, this.database, this.bot, this.constructor);
            }
        }
    }

    async execute() {
        this.getSubCommand(this.options.getSubcommand(false));
        if (!this.subCommand) {
            await this.sendUsage();
            return;
        }
        await this.subCommand._loadConfigs();
        this.subCommand.options = this.options;
        await this.subCommand.execute();
    }
}

module.exports = ConfigCommand;
