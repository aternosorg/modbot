const Log = require('../../Log');
const GuildConfig = require('../../config/GuildConfig');

exports.event = async (options, member) => {
    /** @type {GuildConfig} */
    const guildConfig = await GuildConfig.get(member.guild.id);
    if (guildConfig.raidMode === true && member.kickable) {
        await Log.log(member.guild.id,`Kicked <@!${member.id}> because anti-raid-mode is enabled!`);
        await member.kick('anti-raid-mode');
    }
};
