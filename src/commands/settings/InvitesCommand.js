const Command = require('../../Command');
const util = require('../../util');
const ChannelConfig = require('../../config/ChannelConfig');
const Discord = require('discord.js');

class InvitesCommand extends Command {

    static description = 'Configure discord invite deletion';

    static usage = 'allowed|forbidden|default|status [<#channel|channelID>]';

    static names = ['invites'];

    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        if (this.args.length === 0 || this.args.length > 2) {
            return this.sendUsage();
        }

        const embed = new Discord.MessageEmbed();

        if (this.args.length === 1) {
            switch (this.args.shift().toLowerCase()) {
                case 'allowed':
                    this.guildConfig.invites = true;
                    await this.guildConfig.save();
                    embed.setColor(util.color.green)
                        .setDescription('Invites are now allowed!');
                    break;
                case 'forbidden':
                    this.guildConfig.invites = false;
                    await this.guildConfig.save();
                    embed.setColor(util.color.red)
                        .setDescription('Invites are now forbidden!');
                    break;
                case 'status':
                    embed.setColor(this.guildConfig.invites ? util.color.green : util.color.red)
                        .setDescription(`Invites are currently ${this.guildConfig.invites ? 'allowed': 'forbidden'}!`);
                    break;
                default:
                    return this.sendUsage();
            }
            return this.message.channel.send(embed.setFooter('This can be overwritten per channel'));
        }

        const action = this.args.shift();
        if (!await util.isChannelMention(this.message.guild, this.args[0])) {
            return this.sendUsage();
        }

        const channelID = await util.channelMentionToId(this.args.shift());
        /** @type {ChannelConfig} */
        const channelConfig = await ChannelConfig.get(channelID);
        switch (action.toLowerCase()) {
            case 'allowed':
                channelConfig.invites = true;
                await channelConfig.save();
                embed.setColor(util.color.green)
                    .setDescription(`Invites are now allowed in <#${channelID}>!`);
                break;
            case 'forbidden':
                channelConfig.invites = false;
                await channelConfig.save();
                embed.setColor(util.color.red)
                    .setDescription(`Invites are now forbidden in <#${channelID}>!`);
                break;
            case 'default':
                channelConfig.invites = null;
                await channelConfig.save();
                embed.setColor(this.guildConfig.invites ? util.color.green : util.color.red)
                    .setDescription(`Invites are now ${this.guildConfig.invites ? 'allowed': 'forbidden'} (server default) in <#${channelID}>!`);
                break;
            case 'status':
                if (channelConfig.invites !== null) {
                    embed.setColor(channelConfig.invites ? util.color.green : util.color.red)
                        .setDescription(`Invites are currently ${channelConfig.invites ? 'allowed': 'forbidden'} in <#${channelID}>!`);
                }
                else {
                    embed.setColor(this.guildConfig.invites ? util.color.green : util.color.red)
                        .setDescription(`Invites are currently ${this.guildConfig.invites ? 'allowed': 'forbidden'} (server default) in <#${channelID}>!`);
                }
                break;
            default:
                await this.sendUsage();
        }
        return this.message.channel.send(embed);
    }
}

module.exports = InvitesCommand;
