import Trigger from './Trigger.js';
import {escapeRegExp} from '../../util/util.js';
import RegexTrigger from './RegexTrigger.js';

export default class IncludeTrigger extends Trigger {
    constructor(data) {
        super({
            type: 'include',
            ...data
        });
    }

    toRegex() {
        return new RegexTrigger({
            content: escapeRegExp(this.content),
            flags: this.flags
        });
    }

    test(content) {
        return content.toLowerCase().includes(this.content.toLowerCase());
    }

    supportsImages() {
        return true;
    }
}