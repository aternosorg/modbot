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
 * @param {string} configKey
 * @return {import('discord.js').APIMessageComponentEmoji}
 */
export function buttonEmojiIfExists(configKey) {
    const emoji = config.data.emoji[configKey];
    if (!emoji) {
        return {};
    }
    else {
        return {id: emoji};
    }
}