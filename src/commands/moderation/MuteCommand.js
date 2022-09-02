const TimedModerationCommand = require('../TimedModerationCommand');
const Member = require('../../discord/Member.js');
const util = require('../../util');
const {Constants: {APIErrors}} = require('discord.js');

class MuteCommand extends TimedModerationCommand {

    static description = 'Mute a user';

    static names = ['mute'];

    static userPerms = ['BAN_MEMBERS'];

    static botPerms = ['MANAGE_ROLES', 'MODERATE_MEMBERS'];

    static type = {
        execute: 'mute',
        done: 'muted',
    };

    async executePunishment(target) {
        const member = new Member(target, this.source.getGuild());
        try {
            await member.mute(this.database, this.reason, this.source.getUser(), this.duration);
        }
        catch (e) {
            if (e.code === APIErrors.UNKNOWN_ROLE) {
                await this.sendError('Muted role could not be found. Please verify it\'s set correctly.');
                return false;
            }
            else {
                throw e;
            }
        }
        return true;
    }

    async checkRequirements() {
        if(this.duration && this.duration >= util.apiLimits.timeoutLimit && !this.guildConfig.mutedRole) {
            await this.sendError(`There is no muted role set for this server. Please use \`${this.prefix}mutedrole\` to specify it.`);
            return false;
        }
        return super.checkRequirements();
    }
}

module.exports = MuteCommand;
