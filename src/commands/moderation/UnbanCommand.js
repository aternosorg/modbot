const ModerationCommand = require('../ModerationCommand');
const Member = require('../../Member');
const {MessageEmbed} = require('discord.js');
const util = require('../../util');

class UnbanCommand extends ModerationCommand {

    static description = 'Unban a user';

    static names = ['unban'];

    static userPerms = ['BAN_MEMBERS'];

    static botPerms = ['BAN_MEMBERS'];

    static type = {
        execute: 'unban',
        done: 'unbanned',
    };

    async executePunishment(target) {
        const member = new Member(target, this.message.guild);

        if (!await member.isBanned(this.database)) {
            await this.message.channel.send(new MessageEmbed()
                .setDescription(`**${util.escapeFormatting(target.tag)}** isn't banned here!`)
                .setColor(util.color.red)
            );
            return false;
        }

        await member.unban(this.database, this.reason, this.message.author);
        return true;
    }
}

module.exports = UnbanCommand;
