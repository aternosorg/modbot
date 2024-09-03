import Command from '../Command.js';
import {inlineCode, PermissionFlagsBits, PermissionsBitField} from 'discord.js';
import ChannelWrapper from '../../discord/ChannelWrapper.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import PurgeLogEmbed from '../../embeds/PurgeLogEmbed.js';
import PurgeContentFilter from '../../purge/PurgeContentFilter.js';
import {PurgeUserFilter} from '../../purge/PurgeUserFilter.js';
import PurgeRegexFilter from '../../purge/PurgeRegexFilter.js';
import PurgeAgeFilter from '../../purge/PurgeAgeFilter.js';

/**
 * @import PurgeFilter from '../../purge/PurgeFilter.js';
 * @import {Message} from 'discord.js';
 */

const REGEX_REGEX = /^\/(.*)\/([gimsuy]*)$/;

export default class PurgeCommand extends Command {

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ManageMessages);
    }

    getRequiredBotPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ManageMessages);
    }

    buildOptions(builder) {
        builder.addStringOption(option => option
            .setName('content')
            .setDescription('Only delete messages including this string')
            .setRequired(false));
        builder.addUserOption(option => option
            .setName('author')
            .setDescription('Only delete messages sent by this user')
            .setRequired(false));
        builder.addStringOption(option => option
            .setName('regex')
            .setDescription('Only delete messages matching this regex')
            .setRequired(false));
        builder.addIntegerOption(option => option
            .setName('limit')
            .setDescription('Test filters against the last x messages (default: 100)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(1000));
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        await interaction.deferReply({ephemeral: true});

        /** @type {PurgeFilter[]} */
        const filters = [
            new PurgeAgeFilter(),
        ];

        let content = interaction.options.getString('content');
        if (content) {
            filters.push(new PurgeContentFilter(content));
        }

        let user = interaction.options.getUser('author');
        if (user) {
            filters.push(new PurgeUserFilter(user));
        }

        let regex = null;
        {
            let rawRegex = interaction.options.getString('regex');
            if (rawRegex) {
                const match = rawRegex.match(REGEX_REGEX);
                try {
                    const regex = new RegExp(match[1], match[2]);
                    filters.push(new PurgeRegexFilter(regex));
                } catch {
                    await interaction.editReply(`Invalid regex: ${inlineCode(rawRegex)}`);
                    return;
                }
            }
        }

        const limit = Math.min(interaction.options.getInteger('limit') ?? 100, 1000);

        const channel = new ChannelWrapper(/** @type {import('discord.js').GuildChannel}*/ interaction.channel);
        const messages = (await channel.getMessages(limit))
            .filter(message => filters.every(filter => filter.matches(message)));

        if (messages.size === 0) {
            await interaction.editReply('No messages matched your filters.');
            return;
        }

        await channel.bulkDelete(Array.from(messages.keys()));

        await (new GuildWrapper(interaction.guild))
            .log(new PurgeLogEmbed(
                interaction,
                messages.size,
                limit,
                user,
                regex,
            ).toMessage());

        await interaction.editReply({
            content: `Deleted ${messages.size} messages!`
        });
    }

    getDescription() {
        return 'Bulk delete messages matching a filter';
    }

    getName() {
        return 'purge';
    }
}