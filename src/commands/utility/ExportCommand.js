const Command = require('../../Command');
const Exporter = require('../../data/Exporter');
const {MessageAttachment} = require('discord.js');

class ExportCommand extends Command {

    static description = 'Export all data saved for this server';

    static usage = '';

    static names = ['export'];

    static userPerms = ['MANAGE_GUILD'];

    static botPerms = [];

    async execute() {
        const exporter = new Exporter(this.message.guild.id);
        const data = await exporter.export();
        await this.message.channel.send({files: [new MessageAttachment(Buffer.from(data), `modbot-data-${this.message.guild.id}.json`)]});
    }
}

module.exports = ExportCommand;
