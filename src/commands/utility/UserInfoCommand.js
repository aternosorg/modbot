const Command = require('../../Command');
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

    async execute() {
        if (this.args.length !== 1) return this.sendUsage();

        const userID = util.userMentionToId(this.args.shift());
        if (!userID || !await util.isUser(userID)) return this.sendUsage();

        const user = await this.bot.users.fetch(userID),
            member = new Member(user, this.message.guild),
            guildMember = await member.fetchMember(),
            guildID = this.message.guild.id;
        let [moderations, strikes, mute, ban] = await Promise.all([
            this.database.query('SELECT COUNT(*) AS count FROM moderations WHERE userid = ? AND guildid = ?',[userID,guildID]),
            member.getStrikeSum(this.database),
            this.database.query('SELECT * FROM moderations WHERE active = TRUE AND userid = ? AND guildid = ? AND action = \'mute\'',[userID,guildID]),
            this.database.query('SELECT * FROM moderations WHERE active = TRUE AND userid = ? AND guildid = ? AND action = \'ban\'', [userID,guildID]),
        ]);
        if (!mute && guildMember && guildMember.roles.cache.has(this.guildConfig.mutedRole)) mute = {reason: 'Unknown reason and timer'};
        let muteTime = getRemainingDuration(mute);
        let banTime = getRemainingDuration(ban);
        if (!ban && await member.fetchBanInfo()) ban = member.banInfo;


        const embed = new MessageEmbed()
            .setAuthor(user.tag, user.avatarURL())
            .setDescription(
                `**ID:** ${userID}\n` +
                `**Account Created:** ${user.createdAt.toUTCString()}\n` +
                (guildMember?.joinedAt ? `**Joined Guild:** ${guildMember.joinedAt.toUTCString()}\n` : '') +
                `**Moderations:** ${moderations.count}\n` +
                `**Strikes:** ${strikes}\n` +
                `**Muted:** ${mute ? `${icons.yes} - ${mute.reason}`: icons.no}\n` +
                (muteTime ? `**Remaining:** ${muteTime}\n` : '') +
                `**Banned:** ${ban ? `${icons.yes} - ${ban.reason || 'Unknown Reason'}` : icons.no}\n` +
                (banTime ? `**Remaining:** ${banTime}\n` : '')
            )
            .setColor(getColor(ban, mute));

        await this.message.channel.send(embed);

    }
}

function getRemainingDuration(info) {
    if (!info?.expireTime) return null;
    /** @type {Number|null} */
    let remaining = info.expireTime - Math.floor(Date.now()/1000);
    if (remaining <= 0) return '1s';
    return util.secToTime(remaining);
}

function getColor(ban, mute) {
    if (ban) return util.color.red;
    if (mute) return util.color.orange;
    return util.color.green;
}

module.exports = UserInfoCommand;
