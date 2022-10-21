import config from '../bot/Config.js';
import {formatEmoji} from 'discord.js';

/**
 * convert a string to title case
 * @param {string} s
 * @return {string}
 */
export function toTitleCase(s) {
    return s.toLowerCase().replace(/^(\w)|\s(\w)/g, c => c.toUpperCase());
}

/**
 * @param {*} bool
 * @return {string}
 */
export function yesNo(bool) {
    return bool ? 'Yes' : 'No';
}

/**
 * @param {string} configKey
 * @return {string}
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
 * @return {*}
 */
export function formatNumber(number, name) {
    if (number === 1) {
        return `${number} ${name}`;
    }
    return `${number} ${name}s`;
}

/**
 * @param {string} configKey
 * @param {?string} fallback
 * @return {import('discord.js').APIMessageComponentEmoji}
 */
export function componentEmojiIfExists(configKey, fallback = null) {
    const emoji = config.data.emoji[configKey];
    if (!emoji) {
        return {name: fallback ?? undefined};
    }
    else {
        return {id: emoji};
    }
}