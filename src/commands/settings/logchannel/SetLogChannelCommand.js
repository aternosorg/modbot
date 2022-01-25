const SetConfigCommand = require('../../SetConfigCommand');
const {MessageEmbed} = require('discord.js');
const util = require('../../../util');
const Guild = require('../../../Guild');

class SetLogChannelCommand extends SetConfigCommand {
    static usage = '<#channel|channelid>';

    static description = 'Set a channel moderations will be logged in';

    async execute() {
        const channelID = this.source.isInteraction ?
            this.options.getChannel('channel')?.id : this.options.getString('channelid');

        if (!channelID) {
            await this.sendUsage();
            return;
        }

        const channel = await (new Guild(this.source.getGuild())).fetchChannel(channelID);
        if (!channel) {
            await this.sendUsage();
            return;
        }

        this.guildConfig.logChannel = channelID;
        await this.guildConfig.save();
        await this.reply(new MessageEmbed()
            .setDescription(`Set log channel to <#${channel.id}>.`)
            .setColor(util.color.green)
        );
    }

    static getOptions() {
        return [{
            name: 'channel',
            type: 'CHANNEL',
            description: 'The new log channel.',
            required: true
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

module.exports = SetLogChannelCommand;
