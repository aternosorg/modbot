/**
 * parse this time string to a duration in seconds
 * @param {?string} string
 * @returns {?number} null if no time was included in the string
 */
export function parseTime(string) {
    if (!string) {
        return null;
    }

    let total = null;

    const regex = /(?<value>\d*\.?\d+)\s*(?<unit>years?|yrs?|y|months?|M|weeks?|w|days?|d|hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)/i;
    let match = regex.exec(string);

    while (match) {
        let factor = 1;
        const unit = match.groups.unit.toLowerCase();

        if (['years', 'year', 'yrs', 'yr', 'y'].includes(unit)) {
            factor = 365 * 24 * 60 * 60;
        }
        else if (['months', 'month'].includes(unit) || match.groups.unit === 'M') {
            factor = 30 * 24 * 60 * 60;
        }
        else if (['weeks', 'week', 'w'].includes(unit)) {
            factor = 7 * 24 * 60 * 60;
        }
        else if (['days', 'day', 'd'].includes(unit)) {
            factor = 24 * 60 * 60;
        }
        else if (['hours', 'hour', 'hrs', 'hr', 'h'].includes(unit)) {
            factor = 60 * 60;
        }
        else if (['minutes', 'minute', 'mins', 'min', 'm'].includes(unit)) {
            factor = 60;
        }
        else if (['seconds', 'second', 'secs', 'sec', 's'].includes(unit)) {
            factor = 1;
        }

        total ??= 0;
        total += parseInt(match.groups.value) * factor;

        string = string.slice(match[0].length);
        match = regex.exec(string);
    }

    return total;
}

/**
 * format this duration as a string
 * @param {number} duration in seconds
 * @returns {string}
 */
export function formatTime(duration) {
    let output = '';
    for (let [name, factor] of [
        ['year', 365 * 24 * 60 * 60],
        ['month', 30 * 24 * 60 * 60],
        ['day', 24 * 60 * 60],
        ['hour', 60 * 60],
        ['minute', 60],
        ['second', 1]]) {

        const value = Math.floor(duration / factor);
        if (value) {
            if (value !== 1) {
                name = name + 's';
            }
            output += `${value} ${name} `;
        }
        duration = duration % factor;
    }

    return output.trimEnd();
}

/**
 * current time as a unix timestamp (seconds)
 * @returns {number}
 */
export function timeNow() {
    return Math.floor(Date.now() / 1000);
}

/**
 * return time after duration has expired as unix timestamp (seconds)
 * @param {string} duration
 * @returns {number}
 */
export function timeAfter(duration) {
    return timeNow() + (parseTime(duration) ?? 0);
}