const Command = require('../../Command')
const Discord = require('discord.js');
const util = require('../../util');

class ServerinfoCommand extends Command{
  
    static names = ['si', 'server'];

    static usage = '';

    static description = 'Show the servers info';

    async execute() {
        const guild = this.message.guild;
        const embed = new Discord.MessageEmbed()
            embed.setAuthor(`Info of ${guild.name}`, guild.iconURL());
            embed.addField(
                '__**Generic**__',
                `**Owner:** ${guild.owner}\n**Owner ID:**\n${guild.ownerID}\n**Created:** ${guild.createdAt.toDateString()}\n**Region:** ${guild.region}\n**Guild ID:** ${guild.id}`,
                true
                );
    }
}
        
