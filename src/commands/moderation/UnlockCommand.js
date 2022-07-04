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

class UnlockCommand extends Command {

    static description = 'Unlock channels';

    static usage = 'all|<#channel>…|<id>… <reason>';

    static names = ['unlock'];

    static modCommand = true;

    static userPerms = ['MANAGE_CHANNELS'];

    static botPerms = ['MANAGE_CHANNELS', 'MANAGE_ROLES'];

    async execute() {
        await this.defer();

        const embed = new MessageEmbed()
            .setTitle('This channel has been unlocked.')
            .setDescription(this.options.getString('message') ?? '')
            .setColor(util.color.green);

        if (this.options.getBoolean('all')) {
            /** @type {GuildChannel[]} */
            const channels = await util.asyncFilter(Array.from(this.source.getGuild().channels.cache.values()), this.locked, this);
            if (channels.length === 0) return this.sendUsage();
            return this.unlock(channels, embed);
        }

        const channels = this.options.getChannel('channel') ? [this.options.getChannel('channel').id] : this.options.get('channels')?.value;
        if (!channels?.length) {
            await this.sendUsage();
            return;
        }

        const unlockable = [];
        const notUnlockable = [];
        for (const channel of channels) {
            if (await this.locked(this.source.getGuild().channels.resolve(channel))) {
                unlockable.push(this.source.getGuild().channels.resolve(channel));
                continue;
            }
            notUnlockable.push(channel);
        }

        if (notUnlockable.length === 1) {
            await this.reply(`<#${notUnlockable[0]}> isn't locked!`);
        }
        else if (notUnlockable.length > 0) {
            const mentions = notUnlockable.map(id => `<#${id}>`).join(', ');
            await this.reply(`The following channels aren't locked: ${mentions}`);
        }

        if (unlockable.length === 0) return;

        return this.unlock(unlockable, embed);
    }

    /**
     * unlock the specified channels, send the embed to them and send a confirmation
     * @param {GuildChannel[]} channels
     * @param {MessageEmbed} embed
     */
    async unlock(channels, embed) {
        const everyone = this.source.getGuild().roles.everyone.id;
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

    static getOptions() {
        return [{
            name: 'channel',
            type: 'CHANNEL',
            description: 'A channel to unlock',
            required: false,
        },{
            name: 'all',
            type: 'BOOLEAN',
            required: false,
            description: 'Should all locked channels be unlocked?'
        },{
            name: 'message',
            type: 'STRING',
            required: false,
            description: 'Message that will be shown in the unlocked channel.',
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

module.exports = UnlockCommand;
