const TimedModerationCommand = require('../TimedModerationCommand');
const Member = require('../../Member');
const Discord = require('discord.js');

class MuteCommand extends TimedModerationCommand {

    static description = 'Mute a user';

    static names = ['mute'];

    static userPerms = ['BAN_MEMBERS'];

    static botPerms = ['MANAGE_ROLES'];

    static type = {
        execute: 'mute',
        done: 'muted',
    };

    async executePunishment(target) {
        const member = new Member(target, this.message.guild);
        await member.mute(this.database, this.reason, this.message.author, this.duration);
        return true;
    }

    async checkRequirements() {
        if(!this.guildConfig.mutedRole) {
            await this.message.channel.send(new Discord.MessageEmbed()
                .setDescription(`There is no muted role set for this server. Please use \`${this.prefix}mutedrole\` to specify it.`)
            );
            return false;
        }
        return super.checkRequirements();
    }
}

module.exports = MuteCommand;
