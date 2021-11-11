const {
    ApplicationCommand,
    ApplicationCommandData,
    ApplicationCommandOption,
    ApplicationCommandOptionChoice,
    Collection,
} = require('discord.js');

class SlashCommand {

    /**
     * @param command
     * @param {"USER"|"CHAT_INPUT"|"MESSAGE"} type
     * @return {ApplicationCommandData}
     */
    constructor(command, type) {
        this.type = type;
        this.name = command.names[0];
        if (type === 'CHAT_INPUT') {
            this.description = command.description;
            this.options = command.getOptions();
        }
    }

    /**
     *
     * @param {ApplicationCommand} command
     */
    matchesDefinition(command) {
        if (this.name !== command.name || this.type !== this.type) {
            return false;
        }
        return this.type !== 'CHAT_INPUT' || (this.description === command.description
            && matchingOptions(this.options, command.options));
    }

    /**
     * @param {[]} commands
     * @return {Collection<String, SlashCommand>}
     */
    static getFromClasses(commands) {
        const result = new Collection();
        for (const command of commands) {
            if (command.supportsSlashCommands) {
                result.set(`CHAT_INPUT:${command.names[0]}`, new SlashCommand(command, 'CHAT_INPUT'));
            }
            if (command.supportedContextMenus.USER) {
                result.set(`USER:${command.names[0]}`, new SlashCommand(command, 'USER'));
            }
            if (command.supportedContextMenus.MESSAGE) {
                result.set(`MESSAGE:${command.names[0]}`, new SlashCommand(command, 'MESSAGE'));
            }
        }
        return result;
    }
}

/**
 *
 * @param {ApplicationCommandOption[]} a
 * @param {ApplicationCommandOption[]} b
 * @return {boolean}
 */
function matchingOptions(a, b) {
    if (!Array.isArray(a) && !Array.isArray(b))
        return true;

    if (!Array.isArray(a) || !Array.isArray(b))
        return false;

    return a.every((aElement, index) => {
        const bElement = b[index];
        if (!bElement) {
            return false;
        }
        return aElement.name === bElement.name
            && aElement.type === bElement.type
            && aElement.description === bElement.description
            && aElement.required === bElement.required
            && matchingChoices(aElement.choices, bElement.choices)
            && (!aElement.options && !bElement.options || matchingOptions(aElement.options, bElement.options));
    });
}

/**
 * @param {ApplicationCommandOptionChoice[]} a
 * @param {ApplicationCommandOptionChoice[]} b
 * @return {boolean}
 */
function matchingChoices(a, b) {
    if (!Array.isArray(a) && !Array.isArray(b))
        return true;

    if (!Array.isArray(a) || !Array.isArray(b))
        return false;

    if (a.length !== b.length)
        return false;

    return a.every((aElement, index) => {
        const bElement = b[index];
        return aElement.value === bElement.value && aElement.name && bElement.name;
    });
}

module.exports = SlashCommand;