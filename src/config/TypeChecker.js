class TypeChecker {
    /**
     * check if value has correct type, otherwise throw a type error
     * @param value
     * @param {("undefined"|"object"|"boolean"|"number"|"string"|"function"|"symbol"|"bigint")[]} types
     * @param {String} name
     * @throws {TypeError}
     */
    static assertOfTypes(value, types, name) {
        if (!types.includes(typeof value)) {
            throw new TypeError(`${name} has the wrong type. Expected: ${types.join(', ')} Found: ${typeof value}`);
        }
    }

    /**
     * check if value is a number or undefined
     * @param value
     * @param {String} name
     */
    static assertNumberOrUndefined(value, name) {
        return this.assertOfTypes(value, ['number', 'undefined'], name);
    }

    /**
     * check if value is a number
     * @param value
     * @param {String} name
     */
    static assertNumber(value, name) {
        return this.assertOfTypes(value, ['number'], name);
    }

    /**
     * check if value is a string or undefined
     * @param value
     * @param {String} name
     */
    static assertStringOrUndefined(value, name) {
        return this.assertOfTypes(value, ['string', 'undefined'], name);
    }


    /**
     * check if value is a string
     * @param value
     * @param {String} name
     */
    static assertString(value, name) {
        return this.assertOfTypes(value, ['string'], name);
    }
}

module.exports = TypeChecker;