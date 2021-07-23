const Command = require('../../Command');
const {MessageEmbed} = require('discord.js');
const util = require('../../util');
const {Punishment} = require('../../Typedefs');

class PunishCommand extends Command {

    static description = 'Configure punishments for strikes';

    static usage = '[<count> <ban|kick|mute|softban>] [<duration>]';

    static comment = 'If no punishment is set for a specific strike count the previous punishment will be used';

    static names = ['punish','punishment','punishments'];

    static userPerms = [];

    async execute() {
        if (this.args.length === 0) {
            return this.reply(new MessageEmbed()
                .setTitle('Punishments')
                .setDescription(this.guildConfig.getPunishments()
                    .map((punishment, key) => `${key} ${key === 1 ? 'strike': 'strikes'}: ${punishment.action} ${punishment.duration ? `for ${util.secToTime(punishment.duration)}` : ''}`)
                    .join('\n')||'No punishments set up'
                )
                .setFooter('Users will receive these punishments when they reach the matching strike counts.\n' +
                    'If no punishment is set for a specific strike count the previous punishment will be used'
                )
                .setColor(util.color.red)
            );
        }

        if (!this.message.member.permissions.has('MANAGE_GUILD')) return this.sendError('You are missing the MANAGE_GUILD permissions to execute this command.');
        if (this.args.length < 2) return this.sendUsage();

        const count = parseInt(this.args.shift());
        if (Number.isNaN(count) || count < 1) return this.sendUsage();

        const action = this.args.shift().toLowerCase();
        if (action === 'none') {
            await this.guildConfig.setPunishment(count, null);
            return this.reply(`Removed punishment for ${count} ${count === 1 ? 'strike': 'strikes'}`);
        }
        if (!['ban','kick','mute','softban'].includes(action)) return this.sendUsage();

        const duration = this.args.length ? util.timeToSec(this.args.join(' ')) : null;
        await this.guildConfig.setPunishment(count, /** @type {Punishment} */{action, duration});
        await this.reply(`Set punishment for ${count} ${count === 1 ? 'strike': 'strikes'} to ${action} ${duration ? `for ${util.secToTime(duration)}` : ''}.`);
    }
}

module.exports = PunishCommand;
