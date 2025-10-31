import TurndownRule from './TurndownRule.js';
import {codeBlock} from 'discord.js';

export default class TableRule extends TurndownRule {
    filter = ['table'];

    /**
     * @param {string} content
     * @param {HTMLTableElement} node
     * @returns {string}
     */
    replacement(content, node) {
        return codeBlock("Please click the 'View Article' button below to view this table.");
    };
}
