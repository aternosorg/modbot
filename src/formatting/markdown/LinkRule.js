import {hyperlink} from 'discord.js';
import TurndownRule from './TurndownRule.js';

export default class LinkRule extends TurndownRule {
    filter = ['a'];

    replacement(content, node) {
        const href = node.getAttribute('href');
        if (href === content) {
            return href;
        }

        if (content.includes('https://') || content.includes('http://')) {
            return href;
        }

        if (!/^https?:\/\//.test(href)) {
            // Remove non-http links and local links
            return content;
        }

        return hyperlink(content, href);
    };
}
