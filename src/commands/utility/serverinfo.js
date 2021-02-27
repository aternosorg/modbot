const Command = require('../../Command')
const Discord = require('discord.js');
const util = require('../../util');

class ServerinfoCommand extends Command{
  
    static names = ['si', 'server'];

    static usage = '';

    static description = 'Show the servers info';

    async execute() {
        const guild = this.message.guild;
        
        let generic = '';
        generic += `**Owner:** ${guild.owner.user.username} \n`;
        generic += `**Owner ID:** ${guild.ownerID} \n`;
        generic += `**Created:** ${guild.createdAt.toDateString()} \n`;
        generic += `**Region:** ${guild.region} \n`;
        generic += `**Guild ID:** ${guild.id} \n`;
        
        let statistics = '';
        statistics += `**Members:** ${guild.memberCount} \n`;
        statistics += `**Max members:** ${guild.maximumMembers} \n`;
        statistics += `**Verified: ${guild.verified ? 'yes' : 'no'} \n`;
        statistics += `**Partnered:** ${guild.partnered ? 'yes' : 'no'} \n`;
        
        let embed = new Discord.MessageEmbed()
            .setAuthor(`Info of ${guild.name}`, guild.iconURL());
            .addFields(
              {name: '__**Generic**__', value: generic, inline: true},
              {name: '__**Statistics**__', value: statistics, inline: true }
            );
              
        await this.message.channel.send(embed);
    }
}
        
module.exports = ServerinfoCommand;
