const Command = require('../Command');
const util = require('../../util');
const Member = require('../../Member');
const {MessageEmbed} = require('discord.js');
const icons = require('../../icons');

class UserInfoCommand extends Command {

    static description = 'Show info about a user';

    static usage = '<@user|id>';

    static names = ['userinfo','user','check', 'u'];

    static userPerms = ['BAN_MEMBERS'];

    static modCommand = true;

    static supportsSlashCommands = true;

    async execute() {
        let user;
        if (this.source.isInteraction) {
            user = this.options.getUser('user');
        }
        else {
            const userID = this.options.getString('user');
            if (!userID || !await util.isUser(userID)) {
                return this.sendUsage();
            }
            user = await this.bot.users.fetch(userID);
        }

        const member = new Member(user, this.source.getGuild()),
            guildMember = await member.fetchMember(),
            guildID = this.source.getGuild().id;
        let [moderations, strikes, mute, ban] = await Promise.all([
            this.database.query('SELECT COUNT(*) AS count FROM moderations WHERE userid = ? AND guildid = ?',[user.id, guildID]),
            member.getStrikeSum(this.database),
            this.database.query('SELECT * FROM moderations WHERE active = TRUE AND userid = ? AND guildid = ? AND action = \'mute\'',[user.id, guildID]),
            this.database.query('SELECT * FROM moderations WHERE active = TRUE AND userid = ? AND guildid = ? AND action = \'ban\'', [user.id, guildID]),
        ]);
        if (!mute && guildMember && guildMember.roles.cache.has(this.guildConfig.mutedRole)) mute = {reason: 'Unknown reason and timer'};
        let muteTime = getRemainingDuration(mute);
        let banTime = getRemainingDuration(ban);
        if (!ban && await member.fetchBanInfo()) ban = member.banInfo;


        const embed = new MessageEmbed()
            .setAuthor(user.tag, user.avatarURL())
            .setDescription(
                `**ID:** ${user.id}\n` +
                `**Account Created:** <t:${Math.floor(user.createdTimestamp/1000)}:D>\n` +
                (guildMember?.joinedAt ? `**Joined Guild:** <t:${Math.floor(guildMember.joinedTimestamp/1000)}:D>\n` : '') +
                `**Moderations:** ${moderations.count}\n` +
                `**Strikes:** ${strikes}\n` +
                `**Muted:** ${mute ? `${icons.yes} - ${mute.reason}`: icons.no}\n` +
                (muteTime ? `**Remaining:** ${muteTime}\n` : '') +
                `**Banned:** ${ban ? `${icons.yes} - ${ban.reason || 'Unknown Reason'}` : icons.no}\n` +
                (banTime ? `**Remaining:** ${banTime}\n` : '')
            )
            .setColor(getColor(ban, mute));

        await this.reply(embed);

    }

    static getOptions() {
        return [{
            name: 'user',
            type: 'USER',
            description: 'The user in question',
            required: true,
        }];
    }

    parseOptions(args) {
        return [
            {
                name: 'user',
                type: 'STRING',
                value: util.userMentionToId(args.shift()),
            }
        ];
    }
}

function getRemainingDuration(info) {
    if (!info?.expireTime) return null;
    return `<t:${info.expireTime}:R>`;
}

function getColor(ban, mute) {
    if (ban) return util.color.red;
    if (mute) return util.color.orange;
    return util.color.green;
}

module.exports = UserInfoCommand;
