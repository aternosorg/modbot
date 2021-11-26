const Command = require('../Command');
const Log = require('../../Log');
const {GuildInfo} = require('../../Typedefs');

class RaidModeCommand extends Command {

    static description = 'En-/disable anti-raid-mode (Kicks everybody that joins while enabled).';

    static usage = 'on|off|status';

    static names = ['raidmode','antiraidmode','antiraid'];

    static modCommand = true;

    static supportsSlashCommands = true;

    static userPerms = ['BAN_MEMBERS'];

    static botPerms = ['KICK_MEMBERS'];

    async execute() {
        let command = this.options.getString('command');
        if (!command) {
            await this.sendUsage();
            return;
        }

        switch (command) {
            case 'on':
                this.guildConfig.raidMode = true;
                await this.guildConfig.save();
                await this.reply('Enabled anti-raid-mode! Nobody can join this server now.');
                await Log.logEmbed(/** @type {GuildInfo} */ this.source.getGuild().id, {
                    description: `<@!${this.source.getUser().id}> enabled anti-raid-mode!`
                });
                break;

            case 'off':
                this.guildConfig.raidMode = false;
                await this.guildConfig.save();
                await this.reply('Disabled anti-raid-mode!');
                await Log.logEmbed(/** @type {GuildInfo} */ this.source.getGuild().id, {
                    description: `<@!${this.source.getUser().id}> disabled anti-raid-mode!`
                });
                break;

            case 'status':
                await this.reply(`Anti-raid-mode is currently ${this.guildConfig.raidMode === true ? 'enabled' : 'disabled'}!`);
                break;

            default:
                await this.sendUsage();
                break;
        }
    }


    static getOptions() {
        return [{
            name: 'command',
            type: 'STRING',
            description: 'Sub-command',
            required: true,
            choices: [
                {
                    name: 'on',
                    value: 'on',
                },
                {
                    name: 'off',
                    value: 'off',
                },
                {
                    name: 'status',
                    value: 'status',
                },
            ]
        }];
    }

    parseOptions(args) {
        return [
            {
                name: 'command',
                type: 'STRING',
                value: args.join(' ').toLowerCase(),
            }
        ];
    }
}

module.exports = RaidModeCommand;
