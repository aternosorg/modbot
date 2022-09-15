import Command from '../Command.js';
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    bold, ButtonBuilder, ButtonStyle,
    Collection,
    CommandInteractionOptionResolver,
    EmbedBuilder, PermissionFlagsBits, PermissionsBitField,
    time,
    TimestampStyles
} from 'discord.js';
import Bot from '../../bot/Bot.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import MemberWrapper from '../../discord/MemberWrapper.js';

export default class UserInfoCommand extends Command {

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ViewAuditLog);
    }

    supportsUserCommands() {
        return true;
    }

    async promptForOptions(interaction) {
        interaction.options = new CommandInteractionOptionResolver(Bot.instance.client, [{
            name: 'user',
            user: interaction.targetUser,
            type: ApplicationCommandOptionType.User,
        }], {
            users: /** @type {Collection<import('discord.js').Snowflake, import('discord.js').User>} */
                new Collection().set(interaction.targetUser.id, interaction.targetUser)
        });
        return interaction;
    }

    buildOptions(builder) {
        builder.addUserOption(option =>
            option.setName('user')
                .setDescription('The user you want to view')
                .setRequired(true)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const user = await interaction.options.getUser('user', true);
        const message = await this.generateUserMessage(user, interaction);
        message.ephemeral = true;

        await interaction.reply(message);
    }

    /**
     * generate user message with embed and buttons
     * @param {import('discord.js').User} user
     * @param {import('discord.js').Interaction} interaction
     * @return {Promise<{embeds: EmbedBuilder[], components: ActionRowBuilder[]}>}
     */
    async generateUserMessage(user, interaction) {
        const memberWrapper = new MemberWrapper(user, new GuildWrapper(interaction.guild));
        const member = await memberWrapper.fetchMember();

        /** @type {Map<string, string|number>} */
        const data = new Map()
            .set('Discord ID', user.id)
            .set('Created', time(user.createdAt, TimestampStyles.LongDate));
        /** @type {ActionRowBuilder<ButtonBuilder>} */
        const actionRow = new ActionRowBuilder()
            .addComponents(
                /** @type {*} */ new ButtonBuilder()
                    .setLabel('Refresh')
                    .setCustomId(`userinfo:refresh:${user.id}`)
                    .setStyle(ButtonStyle.Secondary),
                /** @type {*} */ new ButtonBuilder()
                    .setLabel('Strike')
                    .setCustomId(`userinfo:strike:${user.id}`)
                    .setStyle(ButtonStyle.Danger),
            );

        if (member) {
            data.set('Joined', time(member.joinedAt, TimestampStyles.LongDate));
        }

        {
            const strikeCount = await memberWrapper.getStrikeSum();
            data.set('Moderations', (await memberWrapper.getModerations()).length)
                .set('Strike count', strikeCount);
            if (strikeCount) {
                actionRow.addComponents(
                    /** @type {*} */ new ButtonBuilder()
                        .setLabel('Pardon')
                        .setCustomId(`userinfo:pardon:${user.id}`)
                        .setStyle(ButtonStyle.Success)
                );
            }
        }

        {
            const mute = await memberWrapper.getMuteInfo();
            if (mute.muted) {
                data.set('\nMuted', mute.reason);
                if (mute.end) {
                    data.set('Muted until', time(Math.floor(mute.end / 1_000)));
                }
                actionRow.addComponents(
                    /** @type {*} */ new ButtonBuilder()
                        .setLabel('Unmute')
                        .setCustomId(`userinfo:unmute:${user.id}`)
                        .setStyle(ButtonStyle.Success)
                );
            }
            else {
                actionRow.addComponents(
                    /** @type {*} */ new ButtonBuilder()
                        .setLabel('Mute')
                        .setCustomId(`userinfo:mute:${user.id}`)
                        .setStyle(ButtonStyle.Danger)
                );
            }
        }

        {
            const ban = await memberWrapper.getBanInfo();
            if (ban.banned) {
                data.set('\nBanned', ban.reason);
                if (ban.end) {
                    data.set('Banned until', time(Math.floor(ban.end / 1_000)));
                }
                actionRow.addComponents(
                    /** @type {*} */ new ButtonBuilder()
                        .setLabel('Unban')
                        .setCustomId(`userinfo:unban:${user.id}`)
                        .setStyle(ButtonStyle.Success)
                );
            }
            actionRow.addComponents(
                /** @type {*} */ new ButtonBuilder()
                    .setLabel('Ban')
                    .setCustomId(`userinfo:ban:${user.id}`)
                    .setStyle(ButtonStyle.Danger)
            );
        }

        return {
            embeds: [new EmbedBuilder()
                .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                .setDescription(Array.from(data.entries())
                    .map(([name, value]) => bold(name) + ': ' + value)
                    .join('\n'))
            ],
            components: [actionRow],
        };
    }

    getDescription() {
        return 'Show information about a user';
    }

    getName() {
        return 'user';
    }
}