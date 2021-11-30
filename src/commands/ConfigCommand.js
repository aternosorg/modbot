const Command = require('./Command');
const SubCommand = require('./SubCommand');

/**
 * @class
 * @classdesc Get the current configuration
 * @abstract
 */
class GetConfigCommand extends SubCommand {
    static description = 'View the current configuration.';

    static names = ['get','status'];
}

/**
 * @class
 * @classdesc Change the configuration
 * @abstract
 */
class SetConfigCommand extends SubCommand {
    static description = 'Reconfigure this option.';

    static names = ['set'];
}

/**
 * Command used to set config options (guild/channel/user configs)
 * @class
 * @abstract
 */
class ConfigCommand extends Command {

    static supportsSlashCommands = true;

    static usage

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
module.exports = {ConfigCommand, GetConfigCommand, SetConfigCommand};
