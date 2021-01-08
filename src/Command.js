const GuildConfig = require('./GuildConfig');
const ChannelConfig = require('./ChannelConfig');
const util = require('./util');

class Command {
    /**
     * Description of the command
     * @type {string}
     */
    static description = '';

    /**
     * Parameters/Subcommands
     * @type {string}
     */
    static usage = '';

    /**
     * commands
     * @type {String[]}
     */
    static names = [];

    /**
     * Comment
     * @type {String|null}
     */
    static comment = null;

    /**
     * permissions a user needs to execute this command
     * @type {PermissionResolvable[]}
     */
    static userPerms = [];

    /**
     * permissions the bot needs for this command to work
     * @type {PermissionResolvable[]}
     */
    static botPerms = [];

    /**
     * call this command
     * @param {module:"discord.js".Message} message
     * @param {Database}                    database
     * @param {module:"discord.js".Client}  bot
     */
    constructor(message, database, bot) {
        this.message = message;
        this.database = database;
        this.bot = bot;
        this.args = util.split(message.content,' ').slice(1);
        this.guildConfig = GuildConfig.get(/** @type {module:"discord.js".Snowflake} */message.guild.id);
        this.channelConfig = ChannelConfig.get(/** @type {module:"discord.js".Snowflake} */message.channel.id);
    }

    /**
     * Can this user run this command?
     * @return {boolean}
     */
    userHasPerms() {
        const missingPerms = [];
        for (const perm of this.constructor.userPerms) {
            if (!this.message.member.hasPermission(perm)) missingPerms.push(perm);
        }
        return missingPerms.length ? missingPerms : true;
    }

    /**
     * Can the bot run this command
     * @return {boolean|module:"discord.js".PermissionFlags}
     */
    botHasPerms() {
        const botMember = this.message.guild.member(this.bot.user);
        const missingPerms = [];
        for (const perm of this.constructor.botPerms) {
            if (!botMember.hasPermission(perm)) missingPerms.push(perm);
        }
        return missingPerms.length ? missingPerms : true;
    }

    async execute() {

    }


    /**
     * Generate a usage embed
     * @return {module:"discord.js".MessageEmbed}
     */
    static getUsage() {}
}

module.exports = Command
