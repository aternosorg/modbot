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
     * @param {string} raw.action
     * @param {?number|string} [raw.duration]
     * @param {?string} [raw.message]
     */
    constructor(raw) {
        this.action = raw.action;
        this.duration = raw.duration ?? null;
        this.message = raw.message ?? null;
    }
}

/**
 * Possible actions for punishments
 * @enum {String}
 */
export const PunishmentAction = {
    BAN: 'ban',
    KICK: 'kick',
    MUTE: 'mute',
    SOFTBAN: 'softban',
    STRIKE: 'strike',
};