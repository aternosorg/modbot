const Command = require('../Command');
const util = require('../../util.js');
const {MessageEmbed} = require('discord.js');

class MessageLogChannelCommand extends Command {

    static description = 'Configure the channel that messages will be logged in';

    static usage = '<#channel|id>|off|status';

    static names = ['messagelog','messagelogchannel'];

    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        if (this.args.length !== 1) {
            await this.sendUsage();
            return;
        }

        switch (this.args[0].toLowerCase()) {
            case 'off':
                this.guildConfig.messageLogChannel = null;
                await this.guildConfig.save();
                await this.reply(new MessageEmbed()
                    .setDescription('Disabled message logs')
                    .setColor(util.color.red)
                );
                break;
            case 'status':
                await this.reply(new MessageEmbed()
                    .setDescription(`Messages are currently ${this.guildConfig.messageLogChannel ? `logged to <#${this.guildConfig.messageLogChannel}>` : 
                        `not logged.\n Use \`${this.prefix}messagelog ${MessageLogChannelCommand.usage}\` to change this`}.`)
                    .setColor(this.guildConfig.messageLogChannel ? util.color.green : util.color.red)
                );
                break;
            default: {
                const channel = util.channelMentionToId(this.args[0]);
                if (channel === null || !await util.isChannel(this.message.guild, channel)) return this.sendUsage();
                if (!this.message.guild.channels.resolve(channel).permissionsFor(this.bot.user).has(['SEND_MESSAGES', 'VIEW_CHANNEL'])) {
                    return this.reply('I am missing the required permissions to send messages to that channel!');
                }

                this.guildConfig.messageLogChannel = channel;
                await this.guildConfig.save();
                await this.reply(new MessageEmbed()
                    .setDescription(`Set message log channel to <#${channel}>.`)
                    .setColor(util.color.green)
                );
            }
        }
    }
}

module.exports = MessageLogChannelCommand;
