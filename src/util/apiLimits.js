import {GuildPremiumTier} from 'discord.js';

/**
 * maximum timeout duration in seconds
 * @type {number}
 */
export const TIMEOUT_LIMIT = 28 * 24 * 60 * 60;

/**
 * maximum number of embeds per message
 * @type {number}
 */
export const MESSAGE_EMBED_LIMIT = 10;

/**
 * maximum length of an embed description
 * @type {number}
 */
export const EMBED_DESCRIPTION_LIMIT = 4096;

/**
 * maximum length of the title for a select menu
 * @type {number}
 */
export const SELECT_MENU_TITLE_LIMIT = 100;

/**
 * maximum length of the title for a select menu
 * @type {number}
 */
export const SELECT_MENU_VALUE_LIMIT = 100;

/**
 * @type {Map<import('discord.js').GuildPremiumTier, number>}
 */
export const FILE_UPLOAD_LIMITS = new Map()
    .set(GuildPremiumTier.None, 8 * 1024 * 1024)
    .set(GuildPremiumTier.Tier1, 8 * 1024 * 1024)
    .set(GuildPremiumTier.Tier2, 50 * 1024 * 1024)
    .set(GuildPremiumTier.Tier3, 100 * 1024 * 1024);