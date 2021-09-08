const {ApplicationCommand, ApplicationCommandData, ApplicationCommandOption, ApplicationCommandOptionChoice} = require('discord.js');

class SlashCommand {

    /**
     * @param command
     * @return {ApplicationCommandData}
     */
    constructor(command) {
        this.name = command.names[0];
        this.description = command.description;
        this.options = command.getOptions();
    }

    /**
     *
     * @param {ApplicationCommand} command
     */
    matchesDefinition(command) {
        return this.name === command.name
            && this.description === command.description
            && matchingOptions(this.options, command.options);
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