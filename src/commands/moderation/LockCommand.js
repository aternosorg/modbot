const Command = require('../Command');
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


const PERMS = ['SEND_MESSAGES', 'ADD_REACTIONS'];

class LockCommand extends Command {

    static description = 'Lock channels (stop users from sending messages or add reactions)';

    static usage = 'all|<#channel>…|<id>… <reason>';

    static names = ['lock'];

    static modCommand = true;

    static userPerms = ['MANAGE_CHANNELS'];

    static botPerms = ['MANAGE_CHANNELS', 'MANAGE_ROLES'];

    static supportsSlashCommands = true;

    async execute() {
        await this.source.defer();

        const embed = new MessageEmbed()
            .setTitle('This channel is locked.')
            .setColor(util.color.red)
            .setDescription(this.options.getString('message') ?? '')
            .setFooter('You are not muted, this channel is locked for everyone. Don\'t send direct messages to team members or moderators.');

        if (this.options.getBoolean('all')) {
            /** @type {GuildChannel[]} */
            const channels = Array.from(this.source.getGuild().channels.cache.filter(this.lockable, this).values());
            if (channels.length === 0) return this.sendUsage();
            return this.lock(channels, embed);
        }

        const channels = this.options.getChannel('channel') ? [this.options.getChannel('channel').id] : this.options.get('channels')?.value;
        if (!channels?.length) {
            await this.sendUsage();
            return;
        }

        const lockable = [];
        const notLockable = [];
        for (const channel of channels) {
            if (this.lockable(this.source.getGuild().channels.resolve(channel))) {
                lockable.push(this.source.getGuild().channels.resolve(channel));
                continue;
            }
            notLockable.push(channel);
        }

        if (notLockable.length === 1) {
            await this.reply(`<#${notLockable[0]}> doesn't need to be locked!`);
        }
        else if (notLockable.length > 1) {
            const mentions = notLockable.map(id => `<#${id}>`).join(', ');
            await this.reply(`The following channels don't need to be locked: ${mentions}`);
        }

        if (lockable.length === 0) return;

        return this.lock(lockable, embed);
    }

    /**
     * lock the specified channels, send the embed to them and send a confirmation
     * @param {GuildChannel[]} channels
     * @param {MessageEmbed} embed
     * @return {Promise<void>}
     */
    async lock(channels, embed) {
        const everyone = this.source.getGuild().roles.everyone.id;
        for (const channel of channels) {
            try {
                await channel.send({embeds: [embed]});
            }
            catch (e) {
                if (e.code !== APIErrors.MISSING_PERMISSIONS) {
                    throw e;
                }
            }
            /** @type {ChannelConfig} */
            const channelConfig = await ChannelConfig.get(channel.id);
            const options = {};
            for (const /** @type {PermissionResolvable} */perm of PERMS) {
                if (!channel.permissionsFor(everyone).has(perm)) continue;
                const overwrite = channel.permissionOverwrites.cache.get(everyone);
                channelConfig.lock[perm] = !overwrite ? null : overwrite.allow.has(perm) ? true : null;
                options[perm] = false;
            }
            await util.retry(channel.permissionOverwrites.edit, channel.permissionOverwrites, [everyone, options], 3,
                (/** @type GuildChannel*/ result) => {
                    for (const /** @type {PermissionResolvable} */ key of Object.keys(options)) {
                        if (result.permissionsFor(everyone).has(key))
                            return false;
                    }
                    return true;
                });
            await channelConfig.save();
        }

        await this.reply(`Locked ${channels.map(c => `<#${c.id}>`).join(', ')}`);
    }

    /**
     * is this channel lockable
     * @param {GuildChannel} channel
     * @return {boolean}
     */
    lockable(channel) {
        if (!(channel instanceof TextChannel)) return false;
        const everyonePermissions = channel.permissionsFor(this.source.getGuild().roles.everyone);
        if (!everyonePermissions.has('VIEW_CHANNEL')) return false;
        for (const /** @type {PermissionResolvable} */ perm of PERMS) {
            if (everyonePermissions.has(perm)) return true;
        }
        return false;
    }

    static getOptions() {
        return [{
            name: 'channel',
            type: 'CHANNEL',
            description: 'A channel to lock',
            required: false,
        },{
            name: 'all',
            type: 'BOOLEAN',
            required: false,
            description: 'Should all public channels be locked?'
        },{
            name: 'message',
            type: 'STRING',
            required: false,
            description: 'Message that will be shown in the locked channel.',
        }];
    }

    parseOptions(args) {
        let channels = [];
        let all = false;
        if (['all','global'].includes(args[0]?.toLowerCase())) {
            all = true;
            args.shift();
        }
        else {
            channels = util.channelMentions(this.source.getGuild(), args);
        }


        return [{
            name: 'all',
            type: 'BOOLEAN',
            value: all,
        },{
            name: 'channels',
            type: 'CHANNELS',
            value: channels,
        },{
            name: 'message',
            type: 'STRING',
            value: args.join(' '),
        }];
    }
}

module.exports = LockCommand;
