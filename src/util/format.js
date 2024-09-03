import config from '../bot/Config.js';
import {formatEmoji} from 'discord.js';

/**
 * convert a string to title case
 * @param {string} s
 * @returns {string}
 */
export function toTitleCase(s) {
    return s.toLowerCase().replace(/^(\w)|\s(\w)/g, c => c.toUpperCase());
}

/**
 * @param {*} bool
 * @returns {string}
 */
export function yesNo(bool) {
    return bool ? 'Yes' : 'No';
}

/**
 * @param {string} configKey
 * @returns {string}
 */
export function inlineEmojiIfExists(configKey) {
    const emoji = config.data.emoji[configKey];
    if (!emoji) {
        return '';
    }
    else {
        return formatEmoji(emoji) + ' ';
    }
}

/**
 * Format a number followed by a name/unit.
 * Add s if number is not 1
 * @param {number} number
 * @param {string} name
 * @returns {*}
 */
export function formatNumber(number, name) {
    if (number === 1) {
        return `${number} ${name}`;
    }
    return `${number} ${name}s`;
}

/**
 * @param {string} configKey name of the emoji in the config
 * @param {?string} fallback emoji character to use if the config key is not set
 * @returns {?import('discord.js').APIMessageComponentEmoji}
 */
export function componentEmojiIfExists(configKey, fallback = null) {
    const emoji = config.data.emoji[configKey];
    if (emoji) {
        return {id: emoji};
    }

    if (fallback) {
        return {name: fallback};
    }

    return null;
}