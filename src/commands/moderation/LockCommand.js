const Command = require('../../Command');
const Discord = require('discord.js');
const util = require('../../util');
const ChannelConfig = require('../../ChannelConfig');

const PERMS = ['SEND_MESSAGES', 'ADD_REACTIONS'];

class LockCommand extends Command {

    static description = 'Lock channels (stop users from sending messages or add reactions)';

    static usage = 'global|<#channel>…|<id>… <reason>';

    static names = ['lock'];

    static modCommand = true;

    static userPerms = ['MANAGE_CHANNELS'];

    static botPerms = ['MANAGE_CHANNELS', 'MANAGE_ROLES'];

    async execute() {
        if (this.args.length === 0) return this.sendUsage();

        const embed = new Discord.MessageEmbed()
            .setTitle('This channel is locked.')
            .setColor(util.color.red)
            .setFooter('You are not muted, this channel is locked for everyone. Don\'t send direct messages to team members or moderators.');

        if (this.args[0].toLowerCase() === 'global') {
            {
                const start = this.prefix.length + this.name.length + ' global '.length;
                embed.setDescription(this.message.content.substring(start))
            }
            /** @type {module:"discord.js".GuildChannel[]} */
            const channels = this.message.guild.channels.cache.filter(this.lockable, this).array();
            if (channels.length === 0) return this.sendUsage();
            return this.lock(channels, embed);
        }

        const channels = [];
        const notLockable = [];
        for (const channel of await util.channelMentions(this.message.guild, this.args)) {
            if (this.lockable(this.message.guild.channels.resolve(channel))) {
                channels.push(this.message.guild.channels.resolve(channel));
                continue;
            }
            notLockable.push(channel);
        }

        if (channels.length === 0 && notLockable.length === 0) return this.sendUsage();

        if (notLockable.length > 0) {
            const mentions = notLockable.map(id => `<#${id}>`).join(', ');
            await this.message.channel.send(`The following channels don't need to be locked ${mentions}`);
        }

        if (channels.length === 0) return;

        {
            const regex = new RegExp(`${this.prefix}${this.name} (<?#?\\d+>? )+`);
            const start = this.message.content.match(regex)[0].length;
            embed.setDescription(this.message.content.substring(start));
        }

        return this.lock(channels, embed);
    }

    /**
     * lock the specified channels, send the embed to them and send a confirmation
     * @param {module:"discord.js".GuildChannel[]} channels
     * @param {module:"discord.js".MessageEmbed} embed
     * @return {Promise<void>}
     */
    async lock(channels, embed) {
        const everyone = this.message.guild.roles.everyone.id;
        for (const channel of channels) {
            await channel.send(embed);
            /** @type {ChannelConfig} */
            const channelConfig = await ChannelConfig.get(/** @type {module:"discord.js".Snowflake} */ channel.id);
            const options = {};
            for (const perm of PERMS) {
                const overwrite = channel.permissionOverwrites.get(everyone);
                channelConfig.lock[perm] = overwrite == null ? null : overwrite.allow.has(perm) ? true : null;
                options[perm] = false;
            }
            await util.retry(channel.updateOverwrite, channel, [everyone, options], 3, (/** @type module:"discord.js".GuildChannel*/ result) => {
                for (const key of Object.keys(options)) {
                    if (result.permissionsFor(everyone).has(/** @type {PermissionResolvable} */key)) return false;
                }
                return true;
            });
            await channelConfig.save();
        }
        await this.message.channel.send(`Locked ${channels.map(c => `<#${c.id}>`).join(', ')}`);
    }

    /**
     * is this channel lockable
     * @param {module:"discord.js".GuildChannel} channel
     * @return {boolean}
     */
    lockable(channel) {
        if (!(channel instanceof Discord.TextChannel)) return false;
        const everyonePermissions = channel.permissionsFor(this.message.guild.roles.everyone);
        if (!everyonePermissions.has('VIEW_CHANNEL')) return false;
        for (const perm of PERMS) {
            if (everyonePermissions.has(perm)) return true;
        }
        return false;
    }
}

module.exports = LockCommand;
