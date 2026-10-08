import TurndownRule from './TurndownRule.js';
import {codeBlock} from 'discord.js';

export default class UnsupportedContentRule extends TurndownRule {
    filter = ['table', 'svg'];

    /**
     * @param {string} content
     * @param {HTMLTableElement} node
     * @returns {string}
     */
    replacement(content, node) {
        return codeBlock("Please click the 'View Article' below to view this content.");
    };
}
