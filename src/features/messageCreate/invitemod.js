const util = require('../../util');
const Log = require('../../discord/GuildLog.js');
const GuildConfig = require('../../config/GuildConfig');
const ChannelConfig = require('../../config/ChannelConfig');

exports.event = async (options, message) => {
    if (await util.ignoresAutomod(message)) {
        return;
    }

    if (!includesInvite(message.content)) {
        return;
    }

    let guildConfig = await GuildConfig.get(message.guild.id);
    let channelConfig = await ChannelConfig.get(message.channel.id);
    let allowed = channelConfig.invites ?? guildConfig.invites;

    if (!allowed) {
        await util.delete(message);
        await Log.logMessageDeletion(message, 'Invites are not allowed here');
        let response = await message.channel.send(`<@!${message.author.id}> Invites are not allowed here!`);
        await util.delete(response, {timeout: 5000});
    }

};

const invites = ['discord.gg','discord.com/invite', 'discordapp.com/invite', 'invite.gg', 'discord.me', 'top.gg/servers', 'dsc.gg'];

function includesInvite(string) {
    for (let url of invites) {
        let regex = new RegExp(url + '/\\w+');
        if (string.match(regex)) {
            return true;
        }
    }
}
