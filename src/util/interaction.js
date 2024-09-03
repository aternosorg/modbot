/**
 * Reply to an interaction if it wasn't already deferred or replied. Follow up otherwise.
 * @param {import('discord.js').Interaction} interaction
 * @param {string | import('discord.js').MessagePayload | import('discord.js').InteractionReplyOptions} options
 * @returns {Promise<void>}
 */
export async function replyOrFollowUp(interaction, options) {
    if (interaction.deferred || interaction.replied) {
        await interaction.followUp(options);
    }
    else {
        await interaction.reply(options);
    }
}

/**
 * Reply to an interaction if it wasn't already deferred or replied. Edit the response otherwise.
 * @param {import('discord.js').Interaction} interaction
 * @param {string | import('discord.js').MessagePayload | import('discord.js').InteractionReplyOptions} options
 * @returns {Promise<void>}
 */
export async function replyOrEdit(interaction, options) {
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(options);
    }
    else {
        await interaction.reply(options);
    }
}

/**
 * Defer a reply to an interaction if it wasn't already deferred or replied.
 * @param {import('discord.js').Interaction} interaction interaction to defer
 * @param {boolean} ephemeral should the reply be ephemeral
 * @returns {Promise<void>}
 */
export async function deferReplyOnce(interaction, ephemeral = true) {
    if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply( {ephemeral});
    }
}