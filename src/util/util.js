/**
 * Retries a function if it fails
 * @async
 * @param {function}  fn                function to retry
 * @param {Object}    thisArg           object that should execute the function
 * @param {Array}     [args=[]]         arguments to pass to the function
 * @param {Number}    [maxRetries=5]    amount of retries before throwing an error
 * @param {function}  [returnValMatch]  function to test the result on
 * @return {*} result of fn
 */
export async function retry(fn, thisArg, args = [], maxRetries = 5, returnValMatch = null) {
    let err;
    for (let i = 0; i < maxRetries; i++) {
        let res;
        try {
            res = await fn.apply(thisArg, args);
        } catch (e) {
            err = e;
            continue;
        }
        if (typeof returnValMatch === 'function' && !returnValMatch(res)) {
            err = new Error('Returned value did not match requirements');
            continue;
        }
        return res;
    }
    throw err;
}

/**
 *
 * @template T, Z
 * @param {T[]} array
 * @param {Function} filter
 * @param args
 * @return {Promise<T[]>}
 */
export async function asyncFilter(array, filter, ...args) {
    const results = [];
    for (const element of array) {
        if (await filter(element, ...args)) {
            results.push(element);
        }
    }
    return results;
}

/**
 * Ensure that a number is within bounds
 * Returns min if value is below limit or not a number.
 * Returns max if value is above limit.
 * If value is within limits returns value
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
export function inLimits(value, min, max) {
    if (isNaN(value)) {
        return min;
    }

    return Math.min(Math.max(value, min), max);
}

/**
 * deep merge two objects
 * @param {Object} target
 * @param {Object} source
 * @return {Object}
 */
export function deepMerge(target, source) {
    for (const key in source) {
        switch (typeof target[key]) {
            case 'undefined':
                target[key] = source[key];
                break;
            case 'object':
                target[key] = deepMerge(target[key], source[key]);
                break;
        }
    }
    return target;
}