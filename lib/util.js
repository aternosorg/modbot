const util = {};

util.retry = async (fn, thisArg, args = [], maxRetries = 5, returnValMatch = null) => {
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

module.exports = util;
