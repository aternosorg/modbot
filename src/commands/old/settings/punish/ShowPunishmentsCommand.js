const SubCommand = require('../../SubCommand.js');
const {MessageEmbed} = require('discord.js');
const util = require('../../../../util.js');

class ShowPunishmentsCommand extends SubCommand {

    static names = ['show'];

    static description = 'Show punishments';

    async execute() {
        await this.reply(new MessageEmbed()
            .setTitle('Punishments')
            .setDescription(this.guildConfig.getPunishments()
                .map((punishment, key) => `${key} ${key === 1 ? 'strike': 'strikes'}: ${punishment.action} ${punishment.duration ? `for ${util.secToTime(punishment.duration)}` : ''}`)
                .join('\n')||'No punishments set up')
            .setFooter({text: 'Users will receive these punishments when they reach the matching strike counts.\n' +
                    'If no punishment is set for a specific strike count the previous punishment will be used'})
            .setColor(util.color.red)
        );
    }
}

module.exports = ShowPunishmentsCommand;
