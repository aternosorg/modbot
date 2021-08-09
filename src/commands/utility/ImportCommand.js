const Command = require('../../Command');
const Request = require('../../Request');
const ModBotImporter = require('../../data/ModBotImporter');
const VortexImporter = require('../../data/VortexImporter');

class ImportDataCommand extends Command {

    static description = 'Import moderation data from Vortex';

    static usage = '';

    static names = ['import'];

    static comment = 'You need to attach the .json file exported from ModBot or Vortex to your message';

    static userPerms = ['MANAGE_SERVER'];

    static botPerms = [];

    async execute() {
        if (!this.message.attachments.size) {
            await this.message.channel.send('Please attach a file to your message.');
            return;
        }

        const request = new Request(this.message.attachments.first().url);
        /** @type {Exporter|VortexImporter}*/
        let data;
        try {
            data = (await request.getJSON()).JSON;
        }
        catch (e) {
            if (typeof(e) === 'string' && e.startsWith('Failed to parse JSON response of')){
                await this.message.channel.send('Invalid JSON');
            }
            throw e;
        }

        const importer = this.getImporter(data);
        if (!importer) {
            await this.sendError('Unknown data type!');
            return;
        }

        try {
            importer.checkAllTypes();
        }
        catch (e) {
            if (e instanceof TypeError) {
                await this.message.channel.send('Invalid Data! Unable to import this');
                return;
            }
            else {
                throw e;
            }
        }
        await importer.import();
        await this.message.channel.send(importer.generateEmbed());
    }

    /**
     * get the correct importer for this datatype
     * @param data
     * @return {Importer|null}
     */
    getImporter(data) {
        if (!data.dataType)
            return new VortexImporter(this.bot, this.message.guild.id, data);
        if (data.dataType.toLowerCase().startsWith('modbot-1.'))
            return new ModBotImporter(this.bot, this.message.guild.id, data);

        return null;
    }
}

module.exports = ImportDataCommand;
