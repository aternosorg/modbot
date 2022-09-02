const Log = require('../../discord/GuildLog.js');
const GuildConfig = require('../../config/GuildConfig');
const util = require('../../util');
const {APIErrors} = require('discord.js').Constants;

exports.event = async (options, member) => {
    if (member.communicationDisabledUntilTimestamp) {
        return;
    }
    let result = await options.database.query('SELECT * FROM moderations WHERE action = \'mute\' AND active = TRUE AND userid = ? AND guildid = ?',[member.id,member.guild.id]);
    if (result) {
        let guildConfig = await GuildConfig.get(member.guild.id);

        try {
            await member.roles.add(guildConfig.mutedRole);
        }
        catch (e) {
            if ([APIErrors.UNKNOWN_MEMBER, APIErrors.UNKNOWN_ROLE].includes(e.code)) {
                return;
            }
            throw e;
        }

        await Log.logEmbed(member.guild,{
            title: `Restored mute | ${util.escapeFormatting(member.user.tag)}`,
            description: `Mute ID: ${result.id}`,
            footer: {text:`ID: ${member.id}`}
        });
    }
};
