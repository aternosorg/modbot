const RED = 0xf04747;
const ORANGE = 0xfaa61a;
const GREEN = 0x43b581;
export default {RED, ORANGE, GREEN};

/**
 * Resolves an action to a color
 * @param  {String} action name of the action to resolve
 * @return {Number|null}  hex color code or null
 */
export function resolve(action) {
    switch (action.toLowerCase()) {
        case 'banned':
        case 'ban':
            return RED;
        case 'striked':
        case 'muted':
        case 'softbanned':
        case 'kicked':
        case 'strike':
        case 'mute':
        case 'softban':
        case 'kick':
            return ORANGE;
        case 'pardon':
        case 'pardoned':
        case 'unbanned':
        case 'unmuted':
        case 'unban':
        case 'unmute':
            return GREEN;
    }
    return null;
}
