const Command = require('../../Command')
const Discord = require('discord.js');
const util = require('../../util');

class ServerInfoCommand extends Command{
  
    static names = ['serverinfo', 'si', 'server'];

    static usage = '';

    static description = 'Show the servers info';

    async execute() {
        const guild = this.message.guild;
        
        let generic = '';
        generic += `**Owner:** <@!${guild.ownerID}> \n`;
        generic += `**Owner ID:** ${guild.ownerID} \n`;
        generic += `**Created:** ${guild.createdAt.toString()} \n`;
        generic += `**Guild ID:** ${guild.id} \n`;
        
        let statistics = '';
        statistics += `**Members:** ${guild.memberCount} \n`;
        statistics += `**Max members:** ${guild.maximumMembers} \n`;
        statistics += `**Verified:** ${guild.verified ? 'Yes' : 'No'} \n`;
        statistics += `**Partnered:** ${guild.partnered ? 'Yes' : 'No'} \n`;

        const features = guild.features.map(feature => util.toTitleCase(feature.replace(/[-_]/g, ' ')));

        const embed = new Discord.MessageEmbed()
            .setTitle(`Info of ${guild.name}`)
            .setColor(util.color.red)
            .setThumbnail(guild.iconURL({dynamic: true, size: 2048}))
            .setFooter(`Command executed by ${util.escapeFormatting(this.message.author.tag)}`)
            .setTimestamp()
            .addFields(
                /** @type {any} */ {name: '__**Generic**__', value: generic, inline: true},
                /** @type {any} */ {name: '__**Statistics**__', value: statistics, inline: true },
                /** @type {any} */ {name: '__**Features**__', value: features.join(', ') || 'None', inline: false }
            );
              
        await this.message.channel.send(embed);
    }
}
        
module.exports = ServerInfoCommand;
