import EventListener from '../../EventListener.js';
import CommandManager from '../../../commands/CommandManager.js';
import UserInfoCommand from '../../../commands/utility/UserInfoCommand.js';
import UserWrapper from '../../../discord/UserWrapper.js';

export default class InteractionCreateEventListener extends EventListener {
    get name() {
        return 'interactionCreate';
    }

    /**
     * @param {import('discord.js').Interaction} interaction
     * @return {Promise<unknown>}
     */
    async execute(interaction) {
        if (interaction.isCommand()) {
            await CommandManager.instance.execute(interaction);
        }
        else if (interaction.isAutocomplete()) {
            await CommandManager.instance.autocomplete(
                /** @type {import('discord.js').AutocompleteInteraction}*/ interaction);
        }
        else if (interaction.isButton()) {
            const match = interaction.customId.match(/^userinfo:([^:]+):(\d+)$/);
            if (!match) {
                return;
            }

            interaction.commandName = match[1];
            const userId = match[2], user = await (new UserWrapper(userId)).fetchUser();

            if (!user) {
                interaction.reply({ephemeral: true, content: 'Unknown User'});
            }

            if (interaction.commandName === 'refresh') {
                await interaction.update(await (new UserInfoCommand()).generateUserMessage(user, interaction));
            } else {
                // TODO: Make sure this actually works after implementing the other commands
                await CommandManager.instance.execute(interaction);
            }
        }
    }
}