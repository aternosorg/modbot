const Command = require('../OldCommand.js');
const Discord = require('discord.js');
const util = require('../../../util.js');

class ServerInfoCommand extends OldCommand{
  
    static names = ['serverinfo', 'si', 'server'];

    static usage = '';

    static description = 'Show the servers info';

    async execute() {
        const guild = this.source.getGuild();
        
        let owner = await guild.fetchOwner();
      
        let generic = '';
        generic += `**Owner:** <@!${owner.id}> (${owner.user.tag}) \n`;
        generic += `**Owner ID:** ${owner.id} \n`;
        generic += `**Created:** <t:${Math.floor(guild.createdTimestamp/1000)}:D> \n`;
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
            .setFooter({text: `Command executed by ${util.escapeFormatting(this.source.getUser().tag)}`})
            .setTimestamp()
            .addFields(
                /** @type {any} */ {name: '__**Generic**__', value: generic, inline: true},
                /** @type {any} */ {name: '__**Statistics**__', value: statistics, inline: true },
                /** @type {any} */ {name: '__**Features**__', value: features.join(', ') || 'None', inline: false }
            );
              
        await this.reply(embed);
    }
}
        
module.exports = ServerInfoCommand;
