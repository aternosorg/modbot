import {bold, escapeBold} from 'discord.js';
import TurndownRule from './TurndownRule.js';

export default class HeadingRule extends TurndownRule {
    filter = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

    replacement(content, node) {
        if (!content) {
            return '';
        }

        // Check if the heading is inside a list
        let parent = node.parentNode;
        while (parent) {
            if (parent.nodeName === 'UL' || parent.nodeName === 'OL') {
                node.localName = 'b';
                break;
            }
            parent = parent.parentNode;
        }

        switch (node.localName) {
            case 'h1':
                return '\n# ' + content + '\n';
            case 'h2':
                return '\n## ' + content + '\n';
            case 'h3':
                return '\n### ' + content + '\n';
            default:
                return '\n' + bold(escapeBold(content)) + '\n';
        }
    }
}
