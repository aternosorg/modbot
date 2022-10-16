import database from '../bot/Database.js';

export default class WhereParameter {
    /**
     * comparison operator
     * @type {string}
     */
    #comparator;

    constructor(field, value, comparator = '=') {
        this.field = field;
        this.value = value;
        this.#comparator = comparator;
    }

    get escapedField() {
        return database.escapeId(this.field);
    }

    get comparator() {
        return this.#comparator ?? '=';
    }

    get placeholder() {
        if (this.comparator.toUpperCase() === 'IN') {
            return '(?)';
        } else {
            return '?';
        }
    }

    toString() {
        return `${this.escapedField} ${this.comparator} ${this.placeholder}`;
    }
}