const Log = require('../../Log');
const {MessageEmbed, GuildMember} = require('discord.js');
const util = require('../../util');

/**
 * @param options
 * @param {GuildMember} member
 * @return {Promise<void>}
 */
exports.event = async (options, member) => {
    let description = `**ID:** ${member.id}\n` +
        `**Created Account:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n`;

    if (member.joinedTimestamp) {
        description += `**Joined:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`;
    }
    await Log.joinLog(member.guild.id, '', new MessageEmbed()
        .setTitle(`${member.user.tag} left this server`)
        .setColor(util.color.red)
        .setThumbnail(member.user.avatarURL())
        .setDescription(description)
        .setTimestamp()
        .setFooter(`Now at ${member.guild.memberCount} members`)
    );
};
