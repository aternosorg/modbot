const Command = require('../../Command');
const util = require('../../util.js');
const Discord = require('discord.js');

class LogChannelCommand extends Command {

    static description = 'Configure the channel that moderations will be logged in';

    static usage = '<#channel|id>|off|status';

    static names = ['log','logchannel'];

    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        if (this.args.length !== 1) {
            await this.sendUsage();
            return;
        }

        switch (this.args[0].toLowerCase()) {
            case "off":
                this.guildConfig.logChannel = null;
                await this.guildConfig.save();
                await this.message.channel.send(new Discord.MessageEmbed()
                    .setDescription("Disabled moderation logs")
                    .setFooter("You can configure message logs with the 'messagelogs' command.")
                    .setColor(util.color.red)
                );
                break;
            case "status":
                await this.message.channel.send(new Discord.MessageEmbed()
                    .setDescription(`Moderations are currently ${this.guildConfig.logChannel ? `logged to <#${this.guildConfig.logChannel}>` : 
                        `not logged.\n Use \`${this.prefix}log ${LogChannelCommand.usage}\` to change this`}.`)
                    .setFooter(`You can configure message logs with ${this.prefix}messagelogs`)
                    .setColor(this.guildConfig.logChannel ? util.color.green : util.color.red)
                );
                break;
            default:
                const channel = util.channelMentionToId(this.args[0]);
                if (channel === null || !await util.isChannel(this.message.guild, channel)) return this.sendUsage();
                if (!this.message.guild.channels.resolve(/** @type {Snowflake} */channel).permissionsFor(this.bot.user).has(['SEND_MESSAGES', 'VIEW_CHANNEL'])){
                    return this.message.channel.send('I am missing the required permissions to send messages to that channel!');
                }

                this.guildConfig.logChannel = channel;
                await this.guildConfig.save();
                await this.message.channel.send(new Discord.MessageEmbed()
                    .setDescription(`Set moderation log channel to <#${channel}>.`)
                    .setFooter("You can configure message logs with the 'messagelogs' command.")
                    .setColor(util.color.green)
                );
        }
    }
}

module.exports = LogChannelCommand;
