const Command = require('../../Command');
const Discord = require('discord.js');
const util = require('../../util');
const ChannelConfig = require('../../ChannelConfig');

class UnlockCommand extends Command {

    static description = 'Unlock channels';

    static usage = 'global|<#channel>…|<id>… <reason>';

    static names = ['unlock'];

    static modCommand = true;

    static userPerms = ['MANAGE_CHANNELS'];

    static botPerms = ['MANAGE_CHANNELS', 'MANAGE_ROLES'];

    async execute() {
        if (this.args.length === 0) return this.sendUsage();

        const embed = new Discord.MessageEmbed()
            .setTitle('This channel has been unlocked.')
            .setColor(util.color.green)

        if (this.args[0].toLowerCase() === 'global') {
            {
                const start = this.prefix.length + this.name.length + ' global '.length;
                embed.setDescription(this.message.content.substring(start))
            }
            /** @type {module:"discord.js".GuildChannel[]} */
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
            await this.message.channel.send(`The following channels aren't locked ${mentions}`);
        }

        if (channels.length === 0) return;

        {
            const regex = new RegExp(`${this.prefix}${this.name} (<?#?\\d+>? ?)+`);
            const start = this.message.content.match(regex)[0].length;
            embed.setDescription(this.message.content.substring(start));
        }

        return this.unlock(channels, embed);
    }

    /**
     * unlock the specified channels, send the embed to them and send a confirmation
     * @param {module:"discord.js".GuildChannel[]} channels
     * @param {module:"discord.js".MessageEmbed} embed
     * @return {Promise<void>}
     */
    async unlock(channels, embed) {
        const everyone = this.message.guild.roles.everyone.id;
        for (const channel of channels) {
            /** @type {ChannelConfig} */
            const channelConfig = await ChannelConfig.get(/** @type {module:"discord.js".Snowflake} */ channel.id);
            await util.retry(channel.updateOverwrite, channel, [everyone, channelConfig.lock], 3, (/** @type module:"discord.js".GuildChannel*/ result) => {
                for (const key of Object.keys(channelConfig.lock)) {
                    if (result.permissionOverwrites.get(everyone).deny.has(/** @type {PermissionResolvable} */key)) return false;
                    if (channelConfig.lock[key] === true && !result.permissionOverwrites.get(everyone).allow.has(/** @type {PermissionResolvable} */ key)) return false;
                }
                return true;
            });
            channelConfig.lock = {};
            await channelConfig.save();
            await channel.send(embed);
        }
        await this.message.channel.send(`Unlocked ${channels.map(c => `<#${c.id}>`).join(', ')}`);
    }

    /**
     * is this channel locked
     * @param {module:"discord.js".GuildChannel} channel
     * @return {Promise<boolean>}
     */
    async locked(channel) {
        if (!(channel instanceof Discord.TextChannel)) return false;
        return Object.keys((await ChannelConfig.get(channel.id)).lock).length !== 0;
    }
}

module.exports = UnlockCommand;
