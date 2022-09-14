import {RESTJSONErrorCodes} from 'discord.js';
import Bot from '../bot/Bot.js';

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
     * @return {Promise<UserWrapper>}
     * @deprecated use this.fetchUser() instead
     */
    async fetch() {
        await this.fetchUser();
        return this;
    }

    /**
     * fetch this user
     * @return {Promise<import('discord.js').User>}
     */
    async fetchUser() {
        try {
            this.user = await Bot.instance.client.users.fetch(this.id);
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

    /**
     * get an ID from a string. Supported formats:
     * - 790967448111153153
     * - <@790967448111153153>
     * - <@!790967448111153153>
     * @param {String} string
     * @return {import('discord.js').Snowflake|null}
     */
    static getID(string) {
        if (/^<@!?\d+>$/.test(string)) {
            return /** @type {Snowflake|null} */ string.match(/^<@!?(\d+)>$/)[1];
        }
        else if(/^\d+$/.test(string)) {
            return string;
        }
        else {
            return null;
        }
    }

    /**
     *
     * @param {String} string
     * @return {Promise<null|UserWrapper>}
     */
    static async getMentionedUser(string) {
        const userID = this.getID(string);
        if (!userID) {
            return null;
        }

        let user = new UserWrapper(userID);
        return user.fetchUser();
    }
}

module.exports = UserWrapper;