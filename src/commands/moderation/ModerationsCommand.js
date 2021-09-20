const Command = require('../../Command');
const {MessageEmbed} = require('discord.js');
const util = require('../../util');
const User = require('../../User');
const Moderation = require('../../Moderation');

/**
 * number of moderations that will be displayed on a single page. (3-25)
 * @type {number}
 */
const moderationsPerPage = 20;

class ModerationsCommand extends Command {

    static description = 'List all moderations for a user';

    static usage = '<@user|userId>';

    static names = ['moderations','modlog','modlogs'];

    static userPerms = ['VIEW_AUDIT_LOG'];

    static modCommand = true;

    static supportsSlashCommands = true;

    static supportedContextMenus = {
        USER: true
    }

    async execute() {
        let user, userID;
        if (this.source.isInteraction) {
            user = this.options.getUser('user', false);
            userID = user.id;
        } else {
            userID = this.options.getString('userID', false);
            if (!userID) {
                return this.sendUsage();
            }
            user = await (new User(userID, this.bot)).fetchUser();
            if (!user) {
                return this.sendUsage();
            }
        }

        const moderations = await this.database.queryAll('SELECT * FROM moderations WHERE userid = ? AND guildid = ?', [userID, this.source.getGuild().id]);

        if (moderations.length === 0) {
            return this.reply(
                new MessageEmbed()
                    .setColor(util.color.green)
                    .setAuthor(`Moderations for ${user.tag}`, user.avatarURL())
                    .setDescription('No moderations')
            );
        }

        await this.multiPageResponse((index) => {
            const start = index * moderationsPerPage;
            let end = (index + 1) * moderationsPerPage;
            if (end > moderations.length) end = moderations.length;

            const embed = new MessageEmbed()
                .setColor(util.color.orange)
                .setAuthor(`Moderations for ${user.tag}`, user.avatarURL());

            for (const /** @type {Moderation} */ data of moderations.slice(start, end)) {
                let text = '';

                if (data.action === 'strike') {
                    text += `Strikes: ${data.value}\n`;
                }
                else if (data.action === 'pardon') {
                    text += `Pardoned Strikes: ${-data.value}\n`;
                }

                if (data.expireTime) {
                    text += `Duration: ${util.secToTime(data.expireTime - data.created)}\n`;
                }

                if (data.moderator) {
                    text += `Moderator: <@!${data.moderator}>\n`;
                }

                const limit = 6000 / moderationsPerPage - text.length;
                text += `Reason: ${data.reason.length < limit ? data.reason : data.reason.slice(0, limit - 3) + '...'}`;

                embed.addField(`${data.action.toUpperCase()} [#${data.id}] - ${(new Date(data.created*1000)).toUTCString()}`, text);
            }
            return embed
                .setAuthor(`Moderation ${start + 1} to ${end} for ${user.tag} | total ${moderations.length}`, user.avatarURL());
        }, Math.ceil(moderations.length / moderationsPerPage));

    }

    static getOptions() {
        return [{
            name: 'user',
            type: 'USER',
            description: 'User',
            required: true,
        }];
    }

    parseOptions(args) {
        return [
            {
                name: 'userID',
                type: 'STRING',
                value: util.userMentionToId(args[0]),
            }
        ];
    }
}

module.exports = ModerationsCommand;
