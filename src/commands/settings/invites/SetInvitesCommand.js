const SetConfigCommand = require('../../SetConfigCommand');
const ChannelConfig = require('../../../config/ChannelConfig');
const {MessageEmbed} = require('discord.js');
const util = require('../../../util');

class SetInvitesCommand extends SetConfigCommand {
    static usage = '<allowed|forbidden|default> [<#channel|channelid>]';

    async execute() {
        const channelID = this.source.isInteraction ?
            this.options.getChannel('channel')?.id : this.options.getString('channelid');
        const mode = this.getInviteMode(this.options.getString('mode'));
        if (channelID) {
            if (typeof mode !== 'boolean' && mode !== null) {
                await this.sendUsage();
                return;
            }
            /** @type {ChannelConfig} */
            const channelConfig = await ChannelConfig.get(channelID);
            channelConfig.invites = mode;
            await channelConfig.save();
            if (channelConfig.invites === null) {
                await this.reply(
                    new MessageEmbed()
                        .setDescription(`Invites will now default to the guild setting in <#${channelID}>!`));
            } else {
                await this.reply(
                    new MessageEmbed()
                        .setColor(channelConfig.invites ? util.color.green : util.color.red)
                        .setDescription(`Invites are now ${channelConfig.invites ? 'allowed' : 'forbidden'} in <#${channelID}>!`)
                );
            }
        }
        else {
            if (typeof mode !== 'boolean') {
                await this.sendError('Invites can either be \'allowed\' or \'forbidden\' in a server.');
                return;
            }
            this.guildConfig.invites = mode;
            await this.guildConfig.save();
            await this.reply(new MessageEmbed()
                .setColor(this.guildConfig.invites ? util.color.green : util.color.red)
                .setDescription(`Invites are now ${this.guildConfig.invites ? 'allowed' : 'forbidden'} in this server!`)
            );
        }
    }

    /**
     * @param {String} string
     * @return {null|boolean|undefined}
     */
    getInviteMode(string) {
        switch (string.toLowerCase()) {
            case 'allowed':
                return true;
            case 'forbidden':
                return false;
            case 'default':
                return null;
            default:
                return undefined;
        }
    }

    static getOptions() {
        return [{
            name: 'mode',
            type: 'STRING',
            description: '?',
            required: true,
            choices: [
                {
                    name: 'allowed',
                    value: 'allowed',
                }, {
                    name: 'forbidden',
                    value: 'forbidden',
                }, {
                    name: 'default',
                    value: 'default',
                }
            ]
        }, {
            name: 'channel',
            type: 'CHANNEL',
            description: 'Get the override for a specific channel.',
            required: false
        }];
    }

    parseOptions(args) {
        return [{
            name: 'mode',
            type: 'STRING',
            value: args.shift()
        },{
            name: 'channelid',
            type: 'STRING',
            value: util.channelMentionToId(args.shift())
        }];
    }
}

module.exports = SetInvitesCommand;
