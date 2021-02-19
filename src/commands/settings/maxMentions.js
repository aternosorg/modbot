const Command = require('../../Command');

class ExampleCommand extends Command {

    static description = 'Configure how many mentions users should be allowed to mention in one message';

    static usage = '[<maxiumum>|off]';

    static names = ['maxmentions','maximummentions'];

    static comment = 'Maximum is a number between 1 and 10';

    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        if (this.args.length === 0) {
            if (this.guildConfig.maxMentions === -1) {
                await this.message.channel.send('The mention limit is currently disabled.')
            }
            else {
                await this.message.channel.send(`Users can currently mention up to ${this.guildConfig.maxMentions} users in one message.`);
            }
            return;
        }

        if (this.args.length !== 1) {
            await this.sendUsage();
            return;
        }

        if (this.args[0].toLowerCase() === 'off') {
            this.guildConfig.maxMentions = -1;
            await this.guildConfig.save();
            await this.message.channel.send('Maximum mentions have been disabled.');
            return;
        }

        const limit = parseInt(this.args[0]);
        if (isNaN(limit) || limit < 1 || limit > 10) {
            await this.sendUsage();
            return;
        }
        this.guildConfig.maxMentions = limit;
        await this.guildConfig.save();
        await this.message.channel.send(`Users mentioning more than ${limit} users in one message will now receive a strike.`);
    }
}

module.exports = ExampleCommand;
