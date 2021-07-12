const Config = require('./Config');

class UserConfig extends Config {

    static tableName = 'users';

    /**
     * should commands be deleted automatically
     * @type {boolean}
     */
    deleteCommands;

    /**
     * Constructor - create a channel config
     *
     * @param {Snowflake} id user id
     * @param {Object} [json] options
     * @param {boolean} [json.deleteCommands] should commands be deleted automatically
     * @return {UserConfig} the config of the channel
     */
    constructor(id, json = {}) {
        super(id);
        this.deleteCommands = json.deleteCommands || false;
    }

    /**
     * @param {Snowflake|String} userid
     * @return {Promise<UserConfig>}
     */
    static async get(userid) {
        return super.get(userid);
    }
}

module.exports = UserConfig;
