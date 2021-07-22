const Discord = require('discord.js');
const {
    Constants,
    Snowflake,
    Client,

} = Discord;
const {APIErrors} = Constants;

class User {

    /**
     * @type {Snowflake}
     */
    id;

    /**
     * @type {Discord.User}
     */
    user;

    /**
     * @type {Client}
     */
    client;

    /**
     *
     * @param {Snowflake} id
     * @param {Client} client
     */
    constructor(id, client) {
        this.id = id;
        this.client = client;
    }

    /**
     * fetch this user
     * @return {Promise<User>}
     * @deprecated use this.fetchUser() instead
     */
    async fetch() {
        await this.fetchUser();
        return this;
    }

    /**
     * fetch this user
     * @return {Promise<Discord.User>}
     */
    async fetchUser() {
        try {
            this.user = await this.client.users.fetch(this.id);
        }
        catch (e) {
            if (e.code === APIErrors.UNKNOWN_USER) {
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
     * @return {Snowflake|null|*}
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
     * @param {Client} client
     * @return {Promise<null|User>}
     */
    static async getMentionedUser(string, client) {
        const userID = this.getID(string);
        if (!userID) {
            return null;
        }

        let user = new User(userID, client);
        await user.fetch();
        user = user.user;
        return user;
    }
}

module.exports = User;
