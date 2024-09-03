import Settings from './Settings.js';

export default class UserSettings extends Settings {

    static tableName = 'users';

    /**
     * @param {import('discord.js').Snowflake} id user id
     * @param {object} [json] options
     * @param {boolean} [json.deleteCommands] should commands be deleted automatically
     * @returns {UserSettings} the settings of the channel
     */
    constructor(id, json = {}) {
        super(id);
    }

    /**
     * @param {import('discord.js').Snowflake} userid
     * @returns {Promise<UserSettings>}
     */
    static async get(userid) {
        return super.get(userid);
    }
}
