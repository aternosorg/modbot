import {codeBlock} from 'discord.js';
import TurndownRule from './TurndownRule.js';

export default class CodeblockRule extends TurndownRule {
    filter = ['pre'];

    replacement(content, node) {
        return codeBlock(this.unescapeMarkdown(this.removeMarkdown(content)));
    };
}
