const Command = require('../Command');
const util = require('../util');
const Guild = require('../Guild');

class ModerationCommand extends Command {

    static modCommand = true;

    static usage = '<@user|id> [<@user|id…>] [<reason>]';

    static timed = false;

    /**
     * @type {Object}
     */
    static type = {
        /**
         * infinitive, e.g. 'ban', 'mute'
         * @type {String}
         */
        execute: 'moderate',
        /**
         * past tense, e.g. 'banned', 'muted'
         * @type {String}
         */
        done: 'moderated',
    };

    async execute() {
        this.targetedUsers = await this.getTargetedUsers();
        if (this.targetedUsers === null) return;

        if (this.constructor.timed) {
            this.duration = this.getDuration();
        }

        this.reason = this.getReason();
        for (const target of this.targetedUsers) {
            if (await this.isProtected(target)) continue;
            await this.executePunishment(target);
            await util.chatSuccess(this.message.channel, target, this.reason, this.constructor.type.done);
        }
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
            await this.sendError("I can't interact with bots!");
            return true;
        }
        const guild = Guild.get(this.message.guild);
        const member = await guild.fetchMember(/** @type {module:"discord.js".Snowflake} */ target.id);
        if (member === null) return false;

        if (this.message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || this.guildConfig.isProtected(member)) {
            await this.sendError(`You don't have the permission to ${this.constructor.type.execute} <@!${target.id}>!`)
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
