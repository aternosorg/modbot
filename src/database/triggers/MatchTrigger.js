import Trigger from './Trigger.js';
import {escapeRegExp} from '../../util/util.js';
import RegexTrigger from './RegexTrigger.js';

export default class MatchTrigger extends Trigger {
    constructor(data) {
        super({
            type: 'match',
            ...data
        });
    }

    toRegex() {
        return new RegexTrigger({
            content: '^' + escapeRegExp(this.content) + '$',
            flags: this.flags
        });
    }

    test(content) {
        return content.toLowerCase() === this.content.toLowerCase();
    }
}
