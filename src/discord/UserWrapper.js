import {RESTJSONErrorCodes} from 'discord.js';
import bot from '../bot/Bot.js';

export default class UserWrapper {

    /**
     * @type {import('discord.js').Snowflake}
     */
    id;

    /**
     * @type {import('discord.js').User}
     */
    user;

    /**
     *
     * @param {import('discord.js').Snowflake} id
     */
    constructor(id) {
        this.id = id;
    }

    /**
     * fetch this user
     * @returns {Promise<import('discord.js').User>}
     */
    async fetchUser() {
        try {
            this.user = await bot.client.users.fetch(this.id);
        }
        catch (e) {
            if (e.code === RESTJSONErrorCodes.UnknownUser || e.httpStatus === 404) {
                this.user = null;
            }
            else {
                throw e;
            }
        }
        return this.user;
    }
}
