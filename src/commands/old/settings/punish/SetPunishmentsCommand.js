const SubCommand = require('../../SubCommand.js');
const util = require('../../../../util.js');
const {Punishment} = require('../../../../Typedefs.js');


class SetPunishmentsCommand extends SubCommand {

    static userPerms = ['MANAGE_GUILD'];

    static usage = '<count> ban|kick|mute|softban|none [<duration>]';

    static names = ['set'];

    static description = 'Set the punishment for a specific strike count';

    async execute() {
        const count = this.options.getNumber('count');
        if (Number.isNaN(count) || count < 1) {
            return this.sendUsage();
        }

        const action = this.options.getString('punishment').toLowerCase();

        if (action === 'none') {
            await this.guildConfig.setPunishment(count, null);
            return this.reply(`Removed punishment for ${count} ${count === 1 ? 'strike': 'strikes'}`);
        }

        if (!['ban','kick','mute','softban'].includes(action)) {
            return this.sendUsage();
        }

        let duration = this.options.getString('duration');
        duration = duration ? util.timeToSec(duration) : null;
        await this.guildConfig.setPunishment(count, /** @type {Punishment} */{action, duration});
        await this.reply(`Set punishment for ${count} ${count === 1 ? 'strike': 'strikes'} to ${action} ${duration ? `for ${util.secToTime(duration)}` : ''}.`);
    }

    static getOptions() {
        return [{
            name: 'count',
            type: 'NUMBER',
            required: true,
            description: 'Strike count',
            minValue: 1,
        }, {
            name: 'punishment',
            type: 'STRING',
            required: true,
            description: 'Punishment for reaching this strike count',
            choices: ['ban', 'kick', 'mute', 'softban', 'none'].map(s => {return {name: s, value: s}; })
        }, {
            name: 'duration',
            type: 'STRING',
            required: false,
            description: 'Punishment duration (for mutes and bans)'
        }];
    }

    parseOptions(args) {
        return [{
            name: 'count',
            type: 'NUMBER',
            value: parseInt(args.shift())
        },{
            name: 'punishment',
            type: 'STRING',
            value: args.shift()?.toLowerCase()
        }, {
            name: 'duration',
            type: 'STRING',
            value: args.join(' ')
        }];
    }

}

module.exports = SetPunishmentsCommand;
