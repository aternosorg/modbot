import Command from '../Command.js';
import {
    MessageFlags,
    ButtonStyle, hyperlink,
    PermissionFlagsBits,
    PermissionsBitField,
    HeadingLevel,
} from 'discord.js';
import bot from '../../bot/Bot.js';
import {formatTime} from '../../util/timeutils.js';
import {readFile} from 'fs/promises';
import {exec} from 'child_process';
import {promisify} from 'util';
import {componentEmojiIfExists} from '../../util/format.js';
import BetterButtonBuilder from '../../formatting/embeds/BetterButtonBuilder.js';
import MessageBuilder from '../../formatting/MessageBuilder.js';

export const DISCORD_INVITE_LINK = 'https://discord.gg/zYYhgPtmxw';
export const GITHUB_REPOSITORY = 'https://github.com/aternosorg/modbot';
export const PRIVACY_POLICY = 'https://aternos.gmbh/en/modbot/privacy';

export const CLIENT_ID = '790967448111153153';
export const SCOPES = ['bot', 'applications.commands'];
export const PERMISSIONS = new PermissionsBitField()
    .add(PermissionFlagsBits.ViewChannel)
    .add(PermissionFlagsBits.ManageChannels)
    .add(PermissionFlagsBits.ManageRoles)
    .add(PermissionFlagsBits.KickMembers)
    .add(PermissionFlagsBits.BanMembers)
    .add(PermissionFlagsBits.ModerateMembers)
    .add(PermissionFlagsBits.ManageMessages)
    .add(PermissionFlagsBits.SendMessages)
    .add(PermissionFlagsBits.ViewAuditLog);
export const INVITE_LINK = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=${SCOPES.join('%20')}&permissions=${PERMISSIONS.bitfield}`;

export const VERSION = await getPackageVersion();

/**
 * @returns {Promise<?string>}
 */
async function getPackageVersion() {
    try {
        const pkgJson = JSON.parse((await readFile('package.json')).toString());
        if (pkgJson?.version) {
            return pkgJson.version;
        }
    } catch {
        /* ignored */
    }
    return null;
}

export const COMMIT = await getGitCommit();

/**
 * @returns {Promise<?string>}
 */
async function getGitCommit() {
    if (process.env.MODBOT_COMMIT_HASH) {
        return /** @type {string} */ process.env.MODBOT_COMMIT_HASH;
    }

    try {
        return (await promisify(exec)('git rev-parse --short HEAD'))?.stdout?.replaceAll?.('\n', '');
    } catch {
        return null;
    }
}

export default class InfoCommand extends Command {

    isAvailableInDMs() {
        return true;
    }

    async execute(interaction) {
        const buttons = [
            {name: 'Source', url: GITHUB_REPOSITORY, emoji: 'source'},
            {name: 'Privacy', url: PRIVACY_POLICY, emoji: 'privacy'},
            {name: 'Invite', url: INVITE_LINK, emoji: 'invite'},
            {name: 'Discord', url: DISCORD_INVITE_LINK, emoji: 'discord'},
        ];

        const container = new MessageBuilder()
            .heading('ModBot by Aternos', HeadingLevel.Two)
            .newLine()
            .text('ModBot is an open source moderation bot with advanced features developed by')
            .space()
            .link('Aternos', 'https://aternos.org/', 'Aternos Homepage')
            .period().space()
            .text('It uses modern Discord features like slash-commands, context-menus, timeouts, buttons,')
            .space().text('select-menus and modals and offers everything you need for moderation.')
            .space().text('Including bad-words and auto-responses with support for regex,')
            .space().text('detecting phishing urls, temporary bans, a strike system, message logging and')
            .space().text('various other forms of automatic moderation filters.')
            .separator(false)
            .text('If you want to suggest something or need help you can join our')
            .space().link('Discord', DISCORD_INVITE_LINK, 'Join the ModBot Discord')
            .space().text('or create an issue on our')
            .space().link('GitHub repository', GITHUB_REPOSITORY, 'Open the ModBot repository on GitHub')
            .period()
            .separator()
            .pairIf(VERSION, 'Version', VERSION)
            .pairIf(COMMIT, 'Commit', hyperlink(COMMIT, `${GITHUB_REPOSITORY}/tree/${COMMIT}`, 'View on GitHub'))
            .pair('Uptime', formatTime(process.uptime()))
            .pair('Ping', bot.client.ws.ping + 'ms')
            .pairIf(bot.client.shard, 'Shard ID', bot.client.shard.ids.join(',') + ' (Count: ' + bot.client.shard.count + ')')
            .button(...buttons.map(data =>
                new BetterButtonBuilder()
                    .setLabel(data.name)
                    .setStyle(ButtonStyle.Link)
                    .setURL(data.url)
                    .setEmojiIfPresent(componentEmojiIfExists(data.emoji, null))))
            .endComponent();

        await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [container],
        });
    }

    getDescription() {
        return 'Show general information about ModBot';
    }

    getName() {
        return 'info';
    }
}
