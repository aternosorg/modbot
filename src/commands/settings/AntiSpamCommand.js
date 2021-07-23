const Command = require('../../Command');

class AntiSpamCommand extends Command {

    static description = 'Configure message spam protection (deletes spammed messages)';

    static usage = '<count>|off|status';

    static comment = 'Count is the number of messages(1-60) a user is allowed to send per minute.';

    static names = ['antispam','spammod','spamprotection'];

    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        if (this.args.length !== 1) {
            await this.sendUsage();
            return;
        }

        switch (this.args[0].toLowerCase()) {
            case 'off':
                this.guildConfig.antiSpam = -1;
                await this.guildConfig.save();
                await this.message.channel.send('Disabled spam protection!');
                break;
            case 'status':
                await this.message.channel.send(`Spam protection is currently ${this.guildConfig.antiSpam === -1 ? 'disabled' : `set to ${this.guildConfig.antiSpam} messages per minute`}.`);
                break;
            default: {
                const count = parseInt(this.args[0]);
                if (count > 0 && count <= 60) {
                    this.guildConfig.antiSpam = count;
                    await this.guildConfig.save();
                    await this.message.channel.send(`Enabled spam protection! Users can now only send ${count} messages per minute.`);
                } else {
                    await this.sendUsage();
                }
            }
        }
    }
}

module.exports = AntiSpamCommand;
