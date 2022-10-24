/**
 * Reply to an interaction if it wasn't already deferred or replied. Follow up otherwise.
 * @param {import('discord.js').Interaction} interaction
 * @param {string | import('discord.js').MessagePayload | import('discord.js').InteractionReplyOptions} options
 * @return {Promise<void>}
 */
export async function replyOrFollowUp(interaction, options) {
    if (interaction.deferred || interaction.replied) {
        await interaction.followUp(options);
    }
    else {
        await interaction.reply(options);
    }
}