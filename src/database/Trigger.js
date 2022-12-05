import {inlineCode} from 'discord.js';

export default class Trigger {
    /**
     * @type {String}
     */
    type;

    /**
     * @type {String}
     */
    content;

    /**
     * @type {String}
     */
    flags;

    /**
     * @param {Object} data
     * @property {String} type
     * @property {String} content
     * @property {String} [flags]
     */
    constructor(data) {
        this.type = data.type;
        this.content = data.content;
        this.flags = data.flags;
    }

    /**
     * @returns {string}
     */
    asString() {
        return `${this.type}: ${inlineCode(this.asContentString())}`;
    }

    /**
     * @return {string}
     */
    asContentString() {
        if (this.type === 'regex') {
            return `/${this.content}/${this.flags ?? ''}`;
        } else {
            return this.content;
        }
    }

    /**
     * Convert this trigger to a regex trigger.
     * This is only supported for include and match types.
     * @return {Trigger}
     */
    toRegex() {
        let content;
        switch (this.type) {
            case 'include':
                content = this.content;
                break;
            case 'match':
                content = `^${this.content}$`;
                break;

            default:
                return this;
        }

        return  new Trigger({type: 'regex', content, flags: 'i'});
    }
}