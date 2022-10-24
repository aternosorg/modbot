import Command from '../Command.js';
import Exporter from '../../database/export/Exporter.js';
import {AttachmentBuilder, PermissionFlagsBits, PermissionsBitField} from 'discord.js';
import {FILE_UPLOAD_LIMITS} from '../../util/apiLimits.js';
import {gzipSync} from 'zlib';

export default class ExportCommand extends Command {

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ManageGuild);
    }

    getCoolDown() {
        return 60;
    }

    async execute(interaction) {
        await interaction.deferReply({ephemeral: true});
        const exporter = new Exporter(interaction.guild.id);
        let data = Buffer.from(await exporter.export());

        let gzip = data.byteLength > FILE_UPLOAD_LIMITS.get(interaction.guild.premiumTier);
        if (gzip) {
            data = gzipSync(data);
        }

        if (data.byteLength > FILE_UPLOAD_LIMITS.get(interaction.guild.premiumTier)) {
            await interaction.editReply('Unable to upload exported data (file too large)!');
            return;
        }

        await interaction.editReply({
            files: [
                new AttachmentBuilder(data, {
                    name: `ModBot-data-${interaction.guild.id}.json${gzip ? '.gz' : ''}`,
                    description: 'ModBot data for this guild. Use /import to import on another guild or ModBot instance'
                }),
            ]
        });
    }

    getDescription() {
        return 'Export all data ModBot stores about this guild';
    }

    getName() {
        return 'export';
    }
}