const Command = require('../OldCommand.js');
const util = require('../../../util.js');

class DeleteCommandsCommand extends OldCommand {

    static description = 'Automatically delete commands after you execute them';

    static usage = 'on|off';

    static names = ['deletecommands', 'delcommands'];

    static supportsSlashCommands = false;

    async execute() {
        if (!this.args.length) {
            await this.sendUsage();
            return;
        }

        switch (this.args.shift().toLowerCase()) {
            case 'on': {
                this.userConfig.deleteCommands = true;
                await this.userConfig.save();
                await this.reply('Your commands will now be deleted!');
                await util.delete(this.response, {timeout: 5000});
                break;
            }

            case 'off':
                this.userConfig.deleteCommands = false;
                await this.userConfig.save();
                await this.reply('Your commands will no longer be deleted!');
                break;

            default:
                await this.sendError('Unknown value. Available options: `on`, `off`');
                return;
        }
    }
}

module.exports = DeleteCommandsCommand;
