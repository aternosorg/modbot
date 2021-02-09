const Command = require('../../Command');
const Log = require('../../Log');

class RaidModeCommand extends Command {

    static description = 'en/disable anti-raid-mode';

    static usage = 'on|off|status';

    static names = ['raidmode','antiraidmode','antiraid'];

    static modCommand = true;

    static userPerms = ['BAN_MEMBERS'];

    static botPerms = ['MANAGE_CHANNELS'];

    async execute() {

        if (this.args.length !== 1) {
            await this.sendUsage();
            return;
        }

        switch (this.args[0].toLowerCase()) {
            case "on":
                this.guildConfig.raidMode = true;
                await this.guildConfig.save();
                await this.message.channel.send("Enabled anti-raid-mode!");
                await Log.log(/** @type {module:"discord.js".Snowflake} */this.message.guild.id, `${this.message.author.id} enabled anti-raid-mode!`)
                break;

            case "off":
                this.guildConfig.raidMode = false;
                await this.guildConfig.save();
                await this.message.channel.send("Disabled anti-raid-mode!")
                await Log.log(/** @type {module:"discord.js".Snowflake} */this.message.guild.id, `${this.message.author.id} disabled anti-raid-mode!`)
                break;

            case "status":
                await this.message.channel.send(`Anti-raid-mode is currently ${this.guildConfig.raidMode === true ? 'enabled' : 'disabled'}!`)
                break;

            default:
                await this.sendUsage();
                break;
        }
    }
}

module.exports = RaidModeCommand;
