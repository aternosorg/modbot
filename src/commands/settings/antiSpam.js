const Command = require('../../Command');

class ExampleCommand extends Command {

    static description = 'En-/disable message spam protection (deletes repeated and spammed messages)';

    static usage = 'on|off|status';

    static names = ['antispam','spammod','spamprotection'];

    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        if (this.args.length !== 1) {
            await this.sendUsage();
            return;
        }

        switch (this.args[0].toLowerCase()) {
            case "on":
                this.guildConfig.antiSpam = true;
                await this.guildConfig.save();
                await this.message.channel.send("Enabled spam protection! Fast message spam and repeated messages will now be deleted.");
                break;
            case "off":
                this.guildConfig.antiSpam = false;
                await this.guildConfig.save();
                await this.message.channel.send("Disabled spam protection!")
                break;
            case "status":
                await this.message.channel.send(`Spam protection is currently ${this.guildConfig.antiSpam ? 'enabled' : 'disabled'}.`)
                break;
            default:
                await this.sendUsage();
        }
    }
}

module.exports = ExampleCommand;
