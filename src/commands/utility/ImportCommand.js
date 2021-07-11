const Command = require('../../Command');
const Request = require('../../Request');
const Importer = require('../../data/Importer');

class ImportDataCommand extends Command {

    static description = 'Import moderation data from Vortex';

    static usage = '';

    static names = ['importv2'];

    static comment = 'You need to attach the .json file exported from ModBot or Vortex to your message';

    static userPerms = ['MANAGE_SERVER'];

    static botPerms = [];

    async execute() {
        if (!this.message.attachments.size) {
            await this.message.channel.send('Please attach a file to your message.');
            return;
        }

        const request = new Request(this.message.attachments.first().url);
        let data;
        try {
            data = await request.getJSON();
        }
        catch (e) {
            if (typeof(e) === 'string' && e.startsWith('Failed to parse JSON response of')){
                await this.message.channel.send('Invalid JSON');
            }
            throw e;
        }

        const importer = new Importer(this.message.guild.id, data.JSON);
        if (this.guildID !== this.data.guildConfig.id) {
            await this.message.channel.send('This data was not exported from this guild!');
        }
        await importer.import();

        await this.message.channel.send(importer.generateEmbed());
    }
}

module.exports = ImportDataCommand;
