import Settings from './Settings.js';

export default class UserSettings extends Settings {

    static tableName = 'users';

    /**
     * should commands be deleted automatically
     * @type {boolean}
     */
    deleteCommands;

    /**
     * Constructor - create a channel settings
     *
     * @param {import('discord.js').Snowflake} id user id
     * @param {Object} [json] options
     * @param {boolean} [json.deleteCommands] should commands be deleted automatically
     * @return {UserSettings} the settings of the channel
     */
    constructor(id, json = {}) {
        super(id);
        this.deleteCommands = json.deleteCommands || false;
    }

    /**
     * @param {Snowflake|String} userid
     * @return {Promise<UserSettings>}
     */
    static async get(userid) {
        return super.get(userid);
    }
}
