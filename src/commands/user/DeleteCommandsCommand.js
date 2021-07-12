const Command = require('../../Command');

class DeleteCommandsCommand extends Command {

    static description = 'Automatically delete commands after you execute them';

    static usage = 'on|off';

    static names = ['deletecommands', 'delcommands'];

    async execute() {
        if (!this.args.length) {
            await this.sendUsage();
            return;
        }

        switch (this.args.shift().toLowerCase()) {
            case 'on': {
                this.userConfig.deleteCommands = true;
                await this.userConfig.save();
                const response = await this.message.channel.send('Your commands will now be deleted!');
                await response.delete({timeout: 5000});
                break;
            }

            case 'off':
                this.userConfig.deleteCommands = false;
                await this.message.channel.send('Your commands will no longer be deleted!');
                break;

            default:
                await this.sendError('Unknown value. Available options: `on`, `off`');
                return;
        }
    }
}

module.exports = DeleteCommandsCommand;
