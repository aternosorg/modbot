const ModerationCommand = require('../ModerationCommand');
const Member = require('../../Member');
const {MessageEmbed} = require('discord.js');
const util = require('../../util');

class UnmuteCommand extends ModerationCommand {

    static description = 'Unmute a user';

    static names = ['unmute'];

    static userPerms = ['BAN_MEMBERS'];

    static botPerms = ['MANAGE_ROLES'];

    static type = {
        execute: 'unmute',
        done: 'unmuted',
    };

    async executePunishment(target) {
        const member = new Member(target, this.source.getGuild());

        if (!await member.isMuted(this.database)) {
            await this.reply(new MessageEmbed()
                .setDescription(`**${util.escapeFormatting(target.tag)}** isn't muted here!`)
                .setColor(util.color.red)
            );
            return false;
        }

        await member.unmute(this.database, this.reason, this.source.getUser());
        return true;
    }
}

module.exports = UnmuteCommand;
