const GetConfigCommand = require('../../GetConfigCommand');
const ChannelConfig = require('../../../config/ChannelConfig');
const {MessageEmbed} = require('discord.js');
const util = require('../../../util');

class GetInvitesCommand extends GetConfigCommand {
    static usage = '[<#channel|channelid>]';

    static names = ['get','status'];

    async execute() {
        const channelID = this.source.isInteraction
            ? this.options.getChannel('channel')?.id
            : this.options.getString('channelid');

        if (channelID) {
            /** @type {ChannelConfig} */
            const channelConfig = await ChannelConfig.get(channelID);
            if (channelConfig.invites === null) {
                await this.reply(
                    new MessageEmbed()
                        .setDescription(`There's no override for <#${channelID}>!`));
            } else {
                await this.reply(
                    new MessageEmbed()
                        .setColor(channelConfig.invites ? util.color.green : util.color.red)
                        .setDescription(`Invites are currently ${channelConfig.invites ? 'allowed' : 'forbidden'} in <#${channelID}>!`)
                );
            }
        } else {
            await this.reply(
                new MessageEmbed()
                    .setColor(this.guildConfig.invites ? util.color.green : util.color.red)
                    .setDescription(`Invites are currently ${this.guildConfig.invites ? 'allowed' : 'forbidden'}!`)
            );
        }
    }

    static getOptions() {
        return [{
            name: 'channel',
            type: 'CHANNEL',
            description: 'Get the override for a specific channel.',
            required: false
        }];
    }

    parseOptions(args) {
        return [{
            name: 'channelid',
            type: 'STRING',
            value: util.channelMentionToId(args.shift())
        }];
    }
}

module.exports = GetInvitesCommand;
