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
 * total length limit for the entire embed
 * @type {number}
 */
export const EMBED_TOTAL_LIMIT = 6000;

/**
 * limit for the length of an embed field
 * @type {number}
 */
export const EMBED_FIELD_LIMIT = 1024;

/**
 * maximum length of the title for a select menu
 * @type {number}
 */
export const SELECT_MENU_TITLE_LIMIT = 100;

/**
 * maximum length of the value for a select menu
 * @type {number}
 */
export const SELECT_MENU_VALUE_LIMIT = 100;

/**
 * upload limits for guilds in byte
 * @type {Map<import('discord.js').GuildPremiumTier, number>}
 */
export const FILE_UPLOAD_LIMITS = new Map()
    .set(GuildPremiumTier.None, 25 * 1024 * 1024)
    .set(GuildPremiumTier.Tier1, 25 * 1024 * 1024)
    .set(GuildPremiumTier.Tier2, 50 * 1024 * 1024)
    .set(GuildPremiumTier.Tier3, 100 * 1024 * 1024);

/**
 * maximum number of autocomplete options
 * @type {number}
 */
export const AUTOCOMPLETE_OPTIONS_LIMIT = 25;

export const AUTOCOMPLETE_NAME_LIMIT = 100;

export const CHOICE_NAME_LIMIT = 100;

/**
 * maximum select menu options
 * @type {number}
 */
export const SELECT_MENU_OPTIONS_LIMIT = 25;

/**
 * maximum seconds of messages you can delete with a ban
 * @type {number}
 */
export const BAN_MESSAGE_DELETE_LIMIT = 7 * 24 * 60 * 60;

/**
 * maximum duration of a timeout
 * @type {number}
 */
export const TIMEOUT_DURATION_LIMIT = 28 * 24 * 60 * 60;

export const MODAL_TITLE_LIMIT = 45;

export const TEXT_INPUT_LABEL_LIMIT = 45;

export const FETCH_MESSAGES_LIMIT = 100;

export const BULK_DELETE_LIMIT = 100;

export const BULK_DELETE_MAX_AGE = 14 * 24 * 60 * 60 * 1000;

/**
 * maximum number of bans that can be fetched per page
 * @type {number}
 */
export const FETCH_BAN_PAGE_SIZE = 1000;

export const MESSAGE_FILE_LIMIT = 10;
export const MESSAGE_LENGTH_LIMIT = 2000;