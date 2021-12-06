const Command = require('./Command');
const util = require('../util');
const Guild = require('../Guild');
const {
    MessageEmbed,
    User,
    Message,
    ApplicationCommandOptionData
} = require('discord.js');

class ModerationCommand extends Command {

    static modCommand = true;

    static usage = '<@user|id> [<@user|id…>] [<reason>]';

    static supportsSlashCommands = true;

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

    static getOptions() {
        return /** @type {ApplicationCommandOptionData[]} */ [{
            name: 'user',
            type: 'USER',
            description: 'Targeted user',
            required: true,
        }, {
            name: 'reason',
            type: 'STRING',
            description: `${this.type.execute.replace(/^./, a => a.toUpperCase())} reason`,
            required: false,
        }];
    }

    async execute() {
        if (!await this.checkRequirements()) return;
        this.targetedUsers = await this.getTargetedUsers();
        if (this.targetedUsers === null) return;

        this.loadInfo();
        const successes = [];
        for (const target of this.targetedUsers) {
            if (await this.isProtected(target)) continue;
            if(await this.executePunishment(target)) {
                successes.push(target);
            }
        }
        if (successes.length) {
            await this.sendSuccess(successes);
            await this.postPunishment(successes);
        }
    }

    /**
     * check if this command can be executed, send an error if it cant be
     * @returns {Promise<boolean>}
     */
    async checkRequirements() {
        return true;
    }

    /**
     * load information (e.g. reason, duration)
     */
    loadInfo() {
        this.reason = this.getReason();
    }

    /**
     * send an embed showing that the command was executed successfully.
     * @param {User[]} targets
     * @return {Promise<Message>}
     */
    async sendSuccess(targets) {
        const type = this.constructor.type.done;
        let description = `${targets.map(user => `\`${user.tag.replace(/`/g, '')}\``).join(', ')} ${targets.length === 1 ? 'has' : 'have'} been **${type}** `;
        description += `| ${this.reason.substring(0, 4000 - description.length)}`;

        return await this.reply(new MessageEmbed()
            .setColor(util.color.resolve(type))
            .setDescription(description));
    }

    /**
     * get the reason for this command
     * @return {string|string}
     */
    getReason() {
        if (this.source.isInteraction)
            return this.options.getString('reason', false) || 'No reason provided';
        else
            return this.args.join(' ') || 'No reason provided';
    }

    /**
     * can this user be moderated?
     * @param {User} target
     * @return {Promise<boolean>}
     */
    async isProtected(target) {
        if (target.bot) {
            await this.sendError('I can\'t interact with bots!');
            return true;
        }
        const guild = Guild.get(this.source.getGuild());
        const member = await guild.fetchMember(target.id);
        if (member === null) return false;

        if (this.source.getMember().roles.highest.comparePositionTo(member.roles.highest) <= 0 || this.guildConfig.isProtected(member)) {
            await this.sendError(`You don't have the permission to ${this.constructor.type.execute} <@!${target.id}>!`);
            return true;
        }
        return false;
    }

    /**
     * get users targeted by this command
     * @return {Promise<null|User[]>}
     */
    async getTargetedUsers() {
        if (this.source.isInteraction) return [this.options.getUser('user', true)];
        const targetedIDs = await util.userMentions(this.args);

        if (!targetedIDs.length) {
            await this.sendUsage();
            return null;
        }

        const targetedUsers = [];
        for (const [index, id] of targetedIDs.entries()) {
            //prevent duplicate users
            if (targetedIDs.indexOf(id) !== index) continue;
            targetedUsers.push(await this.bot.users.fetch(id));
        }

        return targetedUsers;
    }

    /**
     * execute the punishment on this user
     * @param {User} target
     * @return {Promise<boolean>}
     */
    // eslint-disable-next-line no-unused-vars
    async executePunishment(target) {}

    /**
     * run something after all targets have been punished
     * @param {User[]} successes
     * @return {Promise<void>}
     */
    // eslint-disable-next-line no-unused-vars
    async postPunishment(successes) {}
}

module.exports = ModerationCommand;
