const Log = require('../../Log');
const {MessageEmbed} = require('discord.js');
const util = require('../../util');

/**
 * @param options
 * @param {module:"discord.js".GuildMember} member
 * @return {Promise<void>}
 */
exports.event = async (options, member) => {
    await Log.joinLog(member.guild.id, '', new MessageEmbed()
        .setTitle(`${member.user.tag} joined this server`)
        .setColor(util.color.green)
        .setThumbnail(member.user.avatarURL())
        .setTimestamp()
    );
};
