const Command = require('../../Command')
const Discord = require('discord.js');
const util = require('../../util');

class ServerinfoCommand extends Command{
  
    static names = ['si', 'server'];

    static usage = '';

    static description = 'Show the servers info';

    async execute() {
        const guild = this.message.guild;
        const ServerEmbed = new Discord.MessageEmbed()
            .setAuthor(`Info of ${guild.name}`, guild.iconURL());
            .addFields(
                {name: 'Generic', value: `**Owner:** ${guild.owner}\n**Owner ID:**\n${guild.ownerID}\n**Created:** ${guild.createdAt.toDateString()}
    }
}
        
