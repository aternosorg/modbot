import Trigger from './Trigger.js';

export default class RegexTrigger extends Trigger {
    constructor(data) {
        super({
            type: 'regex',
            ...data
        });
    }

    /**
     * @return {string}
     */
    asContentString() {
        return `/${this.content}/${this.flags ?? ''}`;
    }

    toRegex() {
        return this;
    }

    test(content) {
        let regex = new RegExp(this.content, this.flags);
        return regex.test(content);
    }

    supportsImages() {
        return true;
    }
}