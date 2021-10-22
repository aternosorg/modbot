const Command = require('../../Command');
const Exporter = require('../../data/Exporter');
const {MessageAttachment} = require('discord.js');

class ExportCommand extends Command {

    static description = 'Export all data saved for this server';

    static usage = '';

    static names = ['export'];

    static userPerms = ['MANAGE_GUILD'];

    static botPerms = [];

    static supportsSlashCommands = true;

    async execute() {
        await this.source.defer();
        const exporter = new Exporter(this.source.getGuild().id);
        const data = await exporter.export();
        await this.reply(new MessageAttachment(Buffer.from(data), `modbot-data-${this.source.getGuild().id}.json`));
    }
}

module.exports = ExportCommand;
