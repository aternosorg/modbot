const Command = require('../Command');
const util = require('../util');
const Guild = require('../Guild');

class ModerationCommand extends Command {

    static usage = '<@user|id> [<@user|id…>] [<reason>]';

    /**
     * moderation type, e.g. 'ban'
     * @type {string}
     */
    static type = 'moderate';

    async execute() {
        this.targetedUsers = await this.getTargetedUsers();
        if (this.targetedUsers === null) return;

        this.reason = this.getReason();
        for (const target of this.targetedUsers) {
            if (await this.isProtected(target)) return;
            await this.executePunishment(target);
        }
    }

    userHasPerms() {
        return this.guildConfig.isMod(this.message.member) || super.userHasPerms();
    }

    /**
     * get the reason for this command
     * @return {string|string}
     */
    getReason() {
        return this.args.join(' ') || 'No reason provided';
    }

    /**
     * can this user be moderated?
     * @param {module:"discord.js".User} target
     * @return {Promise<boolean>}
     */
    async isProtected(target) {
        if (target.bot) {
            await this.message.channel.send("I can't interact with bots!");
            return;
        }
        const member = await Guild.fetchMember(this.message.guild, /** @type {module:"discord.js".Snowflake} */ target.id);
        if (member === null) return false;

        if (this.message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || this.guildConfig.isProtected(member)) {
            await this.message.channel.send(`You don't have the permission to ${this.constructor.type} <@!${target.id}>!`)
            return true;
        }
        return false;
    }

    /**
     * get users targeted by this command
     * @return {Promise<null|module:"discord.js".User[]>}
     */
    async getTargetedUsers() {
        const targetedIDs = await util.userMentions(this.args);

        if (!targetedIDs.length) {
            await this.sendUsage();
            return null;
        }

        const targetedUsers = [];
        for (const id of targetedIDs) {
            targetedUsers.push(await this.bot.users.fetch(id));
        }

        return targetedUsers;
    }

    /**
     * execute the punishment on this user
     * @param {module:"discord.js".User} target
     * @return {Promise<void>}
     */
    async executePunishment(target) {}
}

module.exports = ModerationCommand;
