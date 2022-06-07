const util = require('../../util');
const Log = require('../../Log');
const {MessageEmbed} = require('discord.js');

exports.event = async (options, {guild, user}) => {
    let result = await options.database.query('SELECT * FROM moderations WHERE action = \'ban\' AND active = TRUE AND userid = ? AND guildid = ?',[user.id,guild.id]);
    if (result) {
        await options.database.query('UPDATE moderations SET active = FALSE WHERE action = \'ban\' AND active = TRUE AND userid = ? AND guildid = ?',[user.id,guild.id]);

        const embed = new MessageEmbed()
            .setAuthor({name: `Ban ${result.id} was deleted from guild | ${util.escapeFormatting(user.tag)}`, iconURL: user.avatarURL()})
            .setFooter({text: user.id});

        if (result.expireTime) {
            const remaining = result.expireTime - Math.floor(Date.now()/1000);
            embed.addField('Remaining timer', util.secToTime(remaining));
        }
        await Log.logEmbed(guild, embed);
    }
};
