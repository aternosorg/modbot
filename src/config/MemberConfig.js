const Config = require('./Config');

/**
 * Class representing the config of a channel
 */
class MemberConfig extends Config {

    static tableName = 'members';

    /**
     * @type {Snowflake}
     */
    guildid;

    /**
     * @type {Snowflake}
     */
    userid;

    /**
     * should commands be deleted automatically
     * @type {boolean}
     */
    deleteCommands;

    /**
     * Constructor - create a channel config
     *
     * @param {Snowflake} id guildid-userid
     * @param {Object} [json] options
     * @param {boolean} [json.deleteCommands] should commands be deleted automatically
     * @return {MemberConfig} the config of the channel
     */
    constructor(id, json = {}) {
        super(id);
        const [guildid, userid] = id.split('-');
        this.guildid = guildid;
        this.userid = userid;
        this.deleteCommands = json.deleteCommands || false;
    }
}

module.exports = MemberConfig;
