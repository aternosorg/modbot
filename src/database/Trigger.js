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
        return `(${this.type}): ${this.type === 'regex' ? `/${this.content}/` : this.content}`;
    }
}