import SlashCommandPermissionManagerV2 from './SlashCommandPermissionManagerV2.js';
import SlashCommandPermissionManagerV3 from './SlashCommandPermissionManagerV3.js';
import {GuildFeature} from 'discord.js';

export default class SlashCommandPermissionManagers {
    static V2 = new SlashCommandPermissionManagerV2();
    static V3 = new SlashCommandPermissionManagerV3();

    /**
     * @param {import('discord.js').Interaction<"cached">} interaction
     * @returns {SlashCommandPermissionManagerV2|SlashCommandPermissionManagerV3}
     */
    static getManager(interaction) {
        if (interaction.guild.features.includes(GuildFeature.ApplicationCommandPermissionsV2)) {
            return this.V2;
        } else {
            return this.V3;
        }
    }
}