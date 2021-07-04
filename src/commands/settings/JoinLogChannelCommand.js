const Command = require('../../Command');
const util = require('../../util.js');
const Discord = require('discord.js');

class JoinLogChannelCommand extends Command {

    static description = 'Configure the channel that joins will be logged in';

    static usage = '<#channel|id>|off|status';

    static names = ['joinlogs','memberlogs'];

    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        if (this.args.length !== 1) {
            await this.sendUsage();
            return;
        }

        switch (this.args[0].toLowerCase()) {
            case 'off':
                this.guildConfig.joinLogChannel = null;
                await this.guildConfig.save();
                await this.message.channel.send(new Discord.MessageEmbed()
                    .setDescription('Disabled join logs')
                    .setColor(util.color.red)
                );
                break;
            case 'status':
                await this.message.channel.send(new Discord.MessageEmbed()
                    .setDescription(`New members are currently ${this.guildConfig.joinLogChannel ? `logged to <#${this.guildConfig.joinLogChannel}>` : 'not logged'}.`)
                    .setColor(this.guildConfig.joinLogChannel ? util.color.green : util.color.red)
                );
                break;
            default: {
                const channel = util.channelMentionToId(this.args[0]);
                if (channel === null || !await util.isChannel(this.message.guild, channel)) return this.sendUsage();
                if (!this.message.guild.channels.resolve(/** @type {Snowflake} */channel).permissionsFor(this.bot.user).has(['SEND_MESSAGES', 'VIEW_CHANNEL'])) {
                    return this.message.channel.send('I am missing the required permissions to send messages to that channel!');
                }

                this.guildConfig.joinLogChannel = channel;
                await this.guildConfig.save();
                await this.message.channel.send(new Discord.MessageEmbed()
                    .setDescription(`Set join log channel to <#${channel}>.`)
                    .setColor(util.color.green)
                );
            }
        }
    }
}

module.exports = JoinLogChannelCommand;
