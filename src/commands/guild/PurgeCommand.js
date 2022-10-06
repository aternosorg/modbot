import Command from '../Command.js';
import {PermissionFlagsBits, PermissionsBitField} from 'discord.js';
import ChannelWrapper from '../../discord/ChannelWrapper.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import {BULK_DELETE_MAX_AGE} from '../../util/apiLimits.js';
import PurgeLogEmbed from '../../embeds/PurgeLogEmbed.js';

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
        const content = interaction.options.getString('content'),
            user = interaction.options.getUser('author'),
            limit = Math.min(interaction.options.getInteger('limit') ?? 100, 1000),
            rawRegex = interaction.options.getString('regex');

        let regex = null;
        if (rawRegex) {
            const match = rawRegex.match(REGEX_REGEX);
            try {
                regex = new RegExp(match[1], match[2]);
            } catch {
                await interaction.editReply(`Invalid regex: \`${rawRegex}\``);
                return;
            }
        }

        const channel = new ChannelWrapper(/** @type {import('discord.js').GuildChannel}*/ interaction.channel);
        const messages = (await channel.getMessages(limit))
            .filter(message => {
                if (Date.now() - message.createdTimestamp > BULK_DELETE_MAX_AGE) {
                    return false;
                }

                if (user && user.id !== message.author.id) {
                    return false;
                }

                if (regex && !this.matches(message, regex.test)) {
                    return false;
                }

                return !(content && this.matches(message, s => s.toLowerCase().includes(content)));
            });

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

    /**
     * check if any contents of the message trigger this function
     * @param {Message} message
     * @param {(string) => boolean} fn
     * @return {boolean}
     */
    matches(message, fn) {
        const contents = [];
        contents.push(message.content);
        for (const embed of message.embeds) {
            contents.push(embed.description, embed.title, embed.footer?.text, embed.author?.name);
            for (const field of embed.fields) {
                contents.push(field.name, field.value);
            }
        }
        return contents.filter(s => !!s).some(fn);
    }

    getDescription() {
        return 'Bulk delete messages matching a filter';
    }

    getName() {
        return 'purge';
    }
}