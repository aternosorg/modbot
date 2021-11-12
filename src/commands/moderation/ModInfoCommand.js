const Command = require('../../Command');
const {MessageEmbed} = require('discord.js');
const util = require('../../util');
const Moderation = require('../../Moderation');

class ModInfoCommand extends Command {

    static description = 'Show details of a moderation';

    static usage = '<#ID>';

    static names = ['modinfo', 'moderation'];

    static userPerms = ['VIEW_AUDIT_LOG'];

    static modCommand = true;

    static supportsSlashCommands = true;

    async execute() {
        const id = this.options.getInteger('id');
        if (!id || id < 1) {
            return this.sendUsage();
        }

        /** @type {Moderation|null} */
        const moderation = await this.database.query('SELECT * FROM moderations WHERE id = ? AND guildid = ?',[id, this.source.getGuild().id]);

        if (!moderation) {
            return this.sendError('Moderation not found');
        }

        const user = await this.bot.users.fetch(moderation.userid);

        const embed = new MessageEmbed()
            .setTitle(`Moderation #${moderation.id} | ${moderation.action.toUpperCase()}`)
            .addField('Timestamp', (new Date(moderation.created*1000)).toUTCString(), true)
            .setColor(util.color.resolve(moderation.action))
            .setFooter(`${user.tag} - ${moderation.userid}`, user.avatarURL());

        if (moderation.action === 'strike') {
            embed.addField('Strikes', moderation.value.toString(), true);
        }
        else if (moderation.action === 'pardon') {
            embed.addField('Pardoned strikes', (-moderation.value).toString(), true);
        }

        if (moderation.expireTime) {
            embed.addField('Duration', util.secToTime(moderation.expireTime - moderation.created), true);
        }

        if (moderation.moderator) {
            embed.addField('Moderator', `<@!${moderation.moderator}>`, true);
        }

        embed.addField('Reason', moderation.reason.substring(0, 1024), false);

        await this.reply(embed);
    }

    static getOptions() {
        return [{
            name: 'id',
            type: 'INTEGER',
            min_value: 1,
            description: 'Moderation ID',
            required: true,
        }];
    }

    parseOptions(args) {
        const id = args.shift()?.match(/#?(\d+)/);
        return [
            {
                name: 'id',
                type: 'INTEGER',
                value: id ? parseInt(id[1]) : id,
            }
        ];
    }
}

module.exports = ModInfoCommand;
