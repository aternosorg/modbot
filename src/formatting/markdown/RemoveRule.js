import TurndownRule from './TurndownRule.js';

export default class RemoveRule extends TurndownRule {
    filter = ['img', 'script', 'youtube-video', 'minecraft-edition', 'highlight-box', 'iframe'];

    replacement(content, node, options) {
        return '';
    }
}
