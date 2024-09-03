export default class TypeChecker {
    /**
     * check if value has correct type, otherwise throw a type error
     * @param {*} value
     * @param {("undefined"|"object"|"boolean"|"number"|"string"|"function"|"symbol"|"bigint")[]} types
     * @param {string} name
     * @param {boolean} [allowNull]
     * @throws {TypeError}
     */
    static assertOfTypes(value, types, name, allowNull = false) {
        if (allowNull && value === null) {
            return;
        }
        if (!types.includes(typeof value)) {
            throw new TypeError(`${name} has the wrong type. Expected: ${types.join(', ')} Found: ${typeof value}`);
        }
    }

    /**
     * check if value is a number or undefined
     * @param {*} value
     * @param {string} name
     */
    static assertNumberUndefinedOrNull(value, name) {
        this.assertOfTypes(value, ['number', 'undefined'], name, true);
    }

    /**
     * check if value is a number
     * @param {*} value
     * @param {string} name
     */
    static assertNumber(value, name) {
        this.assertOfTypes(value, ['number'], name);
    }

    /**
     * check if value is a string or undefined
     * @param {*} value
     * @param {string} name
     */
    static assertStringUndefinedOrNull(value, name) {
        this.assertOfTypes(value, ['string', 'undefined'], name, true);
    }


    /**
     * check if value is a string
     * @param {*} value
     * @param {string} name
     */
    static assertString(value, name) {
        this.assertOfTypes(value, ['string'], name);
    }

    static assertBooleanOrNull(value, name) {
        this.assertOfTypes(value, ['boolean'], name, true);
    }
}