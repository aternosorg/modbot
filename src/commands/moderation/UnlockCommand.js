const Command = require('../../Command');
const {
    Constants,
    GuildChannel,
    MessageEmbed,
    PermissionResolvable,
    TextChannel,
} = require('discord.js');
const util = require('../../util');
const ChannelConfig = require('../../config/ChannelConfig');
const {APIErrors} = Constants;

class UnlockCommand extends Command {

    static description = 'Unlock channels';

    static usage = 'global|<#channel>…|<id>… <reason>';

    static names = ['unlock'];

    static modCommand = true;

    static userPerms = ['MANAGE_CHANNELS'];

    static botPerms = ['MANAGE_CHANNELS', 'MANAGE_ROLES'];

    async execute() {
        if (this.args.length === 0) return this.sendUsage();

        const embed = new MessageEmbed()
            .setTitle('This channel has been unlocked.')
            .setColor(util.color.green);

        if (this.args[0].toLowerCase() === 'global') {
            {
                const start = this.prefix.length + this.name.length + ' global '.length;
                embed.setDescription(this.message.content.substring(start));
            }
            /** @type {GuildChannel[]} */
            const channels = await util.asyncFilter(this.message.guild.channels.cache.array(), this.locked, this);
            if (channels.length === 0) return this.sendUsage();
            return this.unlock(channels, embed);
        }

        const channels = [];
        const notUnlockable = [];
        for (const channel of await util.channelMentions(this.message.guild, this.args)) {
            if (await this.locked(this.message.guild.channels.resolve(channel))) {
                channels.push(this.message.guild.channels.resolve(channel));
                continue;
            }
            notUnlockable.push(channel);
        }

        if (channels.length === 0 && notUnlockable.length === 0) return this.sendUsage();

        if (notUnlockable.length > 0) {
            const mentions = notUnlockable.map(id => `<#${id}>`).join(', ');
            await this.reply(`The following channels aren't locked ${mentions}`);
        }

        if (channels.length === 0) return;

        embed.setDescription(this.args.join(' '));

        return this.unlock(channels, embed);
    }

    /**
     * unlock the specified channels, send the embed to them and send a confirmation
     * @param {GuildChannel[]} channels
     * @param {MessageEmbed} embed
     */
    async unlock(channels, embed) {
        const everyone = this.message.guild.roles.everyone.id;
        for (const channel of channels) {
            /** @type {ChannelConfig} */
            const channelConfig = await ChannelConfig.get(channel.id);
            await util.retry(channel.permissionOverwrites.edit, channel.permissionOverwrites, [everyone, channelConfig.lock], 3, 
                (/** @type GuildChannel*/ result) => {
                    for (const /** @type {PermissionResolvable} */ key of Object.keys(channelConfig.lock)) {
                        if (result.permissionOverwrites.cache.get(everyone).deny.has(key))
                            return false;
                        if (channelConfig.lock[key] === true && !result.permissionOverwrites.cache.get(everyone).allow.has(key))
                            return false;
                    }
                    return true;
                });
            channelConfig.lock = {};
            await channelConfig.save();
            try {
                await channel.send({embeds: [embed]});
            }
            catch (e) {
                if (e.code !== APIErrors.MISSING_PERMISSIONS) {
                    throw e;
                }
            }
        }
        await this.reply(`Unlocked ${channels.map(c => `<#${c.id}>`).join(', ')}`);
    }

    /**
     * is this channel locked
     * @param {GuildChannel} channel
     * @return {Promise<boolean>}
     */
    async locked(channel) {
        if (!(channel instanceof TextChannel)) return false;
        return Object.keys((await ChannelConfig.get(channel.id)).lock).length !== 0;
    }
}

module.exports = UnlockCommand;
