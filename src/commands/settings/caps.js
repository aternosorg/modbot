const Command = require('../../Command');

class CapsCommand extends Command {

    static description = 'Configure caps moderation (deletes messages with 70%+ caps)';

    static usage = 'on|off|status';

    static names = ['caps','capsmod'];

    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        if (this.args.length !== 1) {
            await this.sendUsage();
            return;
        }

        switch (this.args[0].toLowerCase()) {
            case "on":
                this.guildConfig.caps = true;
                await this.guildConfig.save();
                await this.message.channel.send("Enabled caps moderation!")
                break;
            case "off":
                this.guildConfig.caps = false;
                await this.guildConfig.save();
                await this.message.channel.send("Disabled caps moderation!")
                break;
            case "status":
                await this.message.channel.send(`Caps moderation is currently ${this.guildConfig.caps === false ? 'disabled' : 'enabled'}.`);
                break;
            default:
                await this.sendUsage();
        }
    }
}

module.exports = CapsCommand;
