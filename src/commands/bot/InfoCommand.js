import Command from '../Command.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle, hyperlink,
    PermissionFlagsBits,
    PermissionsBitField
} from 'discord.js';
import Bot from '../../bot/Bot.js';
import Config from '../../bot/Config.js';
import KeyValueEmbed from '../../embeds/KeyValueEmbed.js';
import {formatTime} from '../../util/timeutils.js';
import {readFile} from 'fs/promises';
import {exec} from 'child_process';
import {promisify} from 'util';

const DISCORD_INVITE_LINK = 'https://discord.gg/zYYhgPtmxw';
const GITHUB_REPOSITORY = 'https://github.com/aternosorg/modbot';
const PRIVACY_POLICY = 'https://aternos.gmbh/en/modbot/privacy';

const CLIENT_ID = '790967448111153153';
const SCOPES = ['bot', 'applications.commands'];
const PERMISSIONS = new PermissionsBitField()
    .add(PermissionFlagsBits.ViewChannel)
    .add(PermissionFlagsBits.ManageChannels)
    .add(PermissionFlagsBits.ManageRoles)
    .add(PermissionFlagsBits.KickMembers)
    .add(PermissionFlagsBits.BanMembers)
    .add(PermissionFlagsBits.ModerateMembers)
    .add(PermissionFlagsBits.ManageMessages)
    .add(PermissionFlagsBits.SendMessages);
const INVITE_LINK = `https://discordapp.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=${SCOPES.join('%20')}&permissions=${PERMISSIONS.bitfield}`;

const VERSION = await getPackageVersion();
async function getPackageVersion() {
    try {
        const pkgJson = JSON.parse((await readFile('package.json')).toString());
        if (pkgJson?.version) {
            return pkgJson.version;
        }
    } catch {/* ignored */}
    return null;
}

const COMMIT = await getGitCommit();
async function getGitCommit() {
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
            { name: 'Source', url: GITHUB_REPOSITORY, emoji: 'source' },
            { name: 'Privacy', url: PRIVACY_POLICY, emoji: 'privacy' },
            { name: 'Invite', url: INVITE_LINK, emoji: 'invite' },
            { name: 'Discord', url: DISCORD_INVITE_LINK, emoji: 'discord' },
        ];

        await interaction.reply({
            ephemeral: true,
            embeds: [new KeyValueEmbed()
                .setAuthor({name: 'ModBot by Aternos', iconURL: Bot.instance.client.user.displayAvatarURL()})
                .addLine(
                    'ModBot is an open source moderation bot with advanced features developed by [Aternos](https://aternos.org/). ' +
                    'It uses modern Discord features like slash-commands, context-menus, timeouts, buttons, select-menus ' +
                    'and modals and offers everything you need for moderation. Including bad-words and auto-responses ' +
                    'with support for regex, detecting phishing urls, temporary bans, a strike system, message logging ' +
                    'and various other forms of automatic moderation filters.'
                )
                .newLine()
                .addLine(
                    `If you want to suggest something or need help you can join our [Discord](${DISCORD_INVITE_LINK}) ` +
                    `or create an issue on our [Github](${GITHUB_REPOSITORY}) repository.`
                )
                .newLine()
                .addPairIf(VERSION, 'Version', VERSION)
                .addPairIf(COMMIT, 'Commit', hyperlink(COMMIT, `https://github.com/aternosorg/modbot/tree/${COMMIT}`, 'View on GitHub'))
                .addPair('Uptime', formatTime(process.uptime()))
                .addPair('Ping', Bot.instance.client.ws.ping + 'ms')
            ],
            components: [
                /** @type {ActionRowBuilder} */
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */ buttons.map(data =>
                            new ButtonBuilder()
                                .setLabel(data.name)
                                .setStyle(ButtonStyle.Link)
                                .setURL(data.url)
                                .setEmoji(Config.instance.data.emoji[data.emoji] ?? {}))
                    )
            ]
        });
    }

    getDescription() {
        return 'Show general information about ModBot';
    }

    getName() {
        return 'info';
    }
}