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
            res = await Promise.resolve(fn.apply(thisArg, args));
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
 * convert a string to title case
 * @param {string} s
 * @return {string}
 */
export function toTitleCase(s) {
    return s.toLowerCase().replace(/^(\w)|\s(\w)/g, c => c.toUpperCase());
}