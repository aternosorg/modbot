const Command = require('../OldCommand.js');
const Exporter = require('../../../database/export/Exporter.js');
const {MessageAttachment} = require('discord.js');

class ExportCommand extends OldCommand {

    static description = 'Export all data saved for this server';

    static usage = '';

    static names = ['export'];

    static userPerms = ['MANAGE_GUILD'];

    static botPerms = [];

    async execute() {
        await this.defer();
        const exporter = new Exporter(this.source.getGuild().id);
        const data = await exporter.export();
        await this.reply(new MessageAttachment(Buffer.from(data), `modbot-data-${this.source.getGuild().id}.json`));
    }
}

module.exports = ExportCommand;
