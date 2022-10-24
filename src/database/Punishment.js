import {parseTime} from '../util/timeutils.js';

export default class Punishment {
    /**
     * @type {PunishmentAction}
     */
    action;

    /**
     * @type {?number|string}
     */
    duration = null;

    /**
     * @type {?string}
     */
    message = null;

    /**
     * @param {Object} raw
     * @param {PunishmentAction} raw.action
     * @param {?number|string} [raw.duration]
     * @param {?string} [raw.message]
     */
    constructor(raw) {
        this.action = raw.action;
        this.duration = raw.duration ?? null;
        this.message = raw.message ?? null;
    }

    /**
     * create a new punishment
     * @param {PunishmentAction} action
     * @param {?string} duration
     * @param {?string} message
     */
    static from(action, duration = null, message = null) {
        return new this({action, duration: parseTime(duration), message});
    }
}

/**
 * Possible actions for punishments
 * @enum {string}
 */
export const PunishmentAction = {
    BAN: 'ban',
    KICK: 'kick',
    MUTE: 'mute',
    SOFTBAN: 'softban',
    STRIKE: 'strike',
};