import Command from '../Command.js';
import {PermissionFlagsBits, PermissionsBitField} from 'discord.js';
import got from 'got';
import {promisify} from 'util';
import {gunzip as gunzipCb} from 'zlib';
import VortexImporter from '../../database/export/VortexImporter.js';
import ModBotImporter from '../../database/export/ModBotImporter.js';

/**
 * @import Importer from '../../database/export/Importer.js';
 */

const gunzip = promisify(gunzipCb);

export default class ImportCommand extends Command {

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ManageGuild);
    }

    buildOptions(builder) {
        builder.addAttachmentOption(option =>
            option
                .setName('data')
                .setRequired(true)
                .setDescription('Data exported from ModBot or Vortex')
        );
        return builder;
    }

    getCoolDown() {
        return 60;
    }

    async execute(interaction) {
        await interaction.deferReply({ephemeral: true});
        const file = interaction.options.getAttachment('data', true);

        let fileName = file.name;
        let data = await got.get(file.url).buffer();
        if (fileName.endsWith('.gz')) {
            try {
                data = await gunzip(data.buffer);
            }
            catch {
                await interaction.editReply('Failed to decompress gzip data. Make sure the file you\'re trying to upload is valid gzip.');
                return;
            }
            fileName = fileName.slice(0, -3);
        }

        if (!fileName.endsWith('.json')) {
            await interaction.editReply('Unknown file ending. Only .json and .json.gz files are supported.');
            return;
        }

        try {
            data = JSON.parse(data.toString());
        }
        catch {
            await interaction.editReply('Failed to parse JSON data. Make sure the file you\'re trying to upload is valid JSON.');
            return;
        }

        const importer = this.getImporter(data, interaction);

        if (!importer) {
            await interaction.editReply('Unknown data type. Only Vortex and ModBot data are currently supported. ' +
                'Feel free to create an issue on our GitHub if you want to suggest another type.');
            return;
        }

        try {
            importer.checkAllTypes();
        }
        catch (e) {
            if (e instanceof TypeError) {
                await interaction.editReply('Invalid Data! Only Vortex and ModBot data are currently supported. ' +
                    'Feel free to create an issue on our GitHub if you want to suggest another type.');
                return;
            }
            else {
                throw e;
            }
        }

        await importer.import();
        await interaction.editReply({embeds: [importer.generateEmbed()]});
    }

    /**
     * get the correct importer for this datatype
     * @param {object} data
     * @param {import('discord.js').Interaction} interaction
     * @returns {Importer|null}
     */
    getImporter(data, interaction) {
        if (!data.dataType)
            return new VortexImporter(interaction.guild.id, data);
        if (data.dataType.toLowerCase().startsWith('modbot-1.'))
            return new ModBotImporter(interaction.guild.id, data);

        return null;
    }

    getDescription() {
        return 'Import data exported by ModBot or Vortex';
    }

    getName() {
        return 'import';
    }
}