const Command = require('../../Command');

class SimilarMessagesCommand extends Command {

    static description = 'Configure message repeated message protection (deletes similar messages)';

    static usage = '<count>|off|status';

    static comment = 'Count is the number of similar messages(1-60) a user is allowed to send per minute.';

    static names = ['similarmessages','similar','repeatedmessages','repeated'];

    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        if (this.args.length !== 1) {
            await this.sendUsage();
            return;
        }

        switch (this.args[0].toLowerCase()) {
            case 'off':
                this.guildConfig.similarMessages = -1;
                await this.guildConfig.save();
                await this.reply('Disabled repeated message protection!');
                break;
            case 'status':
                await this.reply(`Repeated message protection is currently ${this.guildConfig.similarMessages === -1 ? 'disabled' : `set to ${this.guildConfig.similarMessages} similar messages per minute`}.`);
                break;
            default: {
                const count = parseInt(this.args[0]);
                if (count > 0 && count <= 60) {
                    this.guildConfig.similarMessages = count;
                    await this.guildConfig.save();
                    await this.reply(`Enabled repeated message protection! Users can now only send ${count} similar messages per minute.`);
                } else {
                    await this.sendUsage();
                }
            }
        }
    }
}

module.exports = SimilarMessagesCommand;
