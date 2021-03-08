class User {

    /**
     * @type {Snowflake}
     */
    id;

    /**
     * @type {module:"discord.js".User}
     */
    user;

    /**
     *
     * @param {Snowflake} id
     */
    constructor(id) {
        this.id = id;
    }

    /**
     * fetch this user
     * @param {module:"discord.js".Client} client
     * @return {Promise<User>}
     */
    async fetch(client) {
        try {
            this.user = await client.users.fetch(this.id);
        }
        catch (e) {
            //Unknown User
            if (e.code === 10013) {
                this.user = null;
            }
            else {
                throw e;
            }
        }
        return this;
    }

    /**
     * get an ID from a string. Supported formats:
     * - 790967448111153153
     * - <@790967448111153153>
     * - <@!790967448111153153>
     * @param {String} string
     * @return {module:"discord.js".Snowflake|null|*}
     */
    static getID(string) {
        if (/^<@!?\d+>$/.test(string)) {
            return /** @type {module:"discord.js".Snowflake|null} */ string.match(/^<@!?(\d+)>$/)[1];
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
     * @param {module:"discord.js".Client} client
     * @return {Promise<null|User>}
     */
    static async getMentionedUser(string, client) {
        const userID = this.getID(string);
        if (!userID) {
            return null;
        }

        let user = new User(userID);
        await user.fetch(client);
        user = user.user;
        return user;
    }
}

module.exports = User;
