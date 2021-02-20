const TimedModerationCommand = require('../TimedModerationCommand');

class ExampleCommand extends TimedModerationCommand {

    static description = 'Ban a user';

    static names = ['ban'];

    static userPerms = ['BAN_MEMBERS'];

    static botPerms = ['BAN_MEMBERS'];

    static type = 'ban';

    async executePunishment(target) {

    }
}

module.exports = ExampleCommand;
