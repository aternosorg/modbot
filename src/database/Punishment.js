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