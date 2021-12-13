const {ConfigCommand, GetConfigCommand, SetConfigCommand} = require('../ConfigCommand');

class GetCapsCommand extends GetConfigCommand {

    async execute() {
        await this.reply(`Spam protection is currently ${this.getValue()}.`);
    }

    getValue() {
        return this.guildConfig.caps === false ? 'disabled' : 'enabled';
    }
}

class SetCapsCommand extends SetConfigCommand {

    static usage = 'enabled|disabled';

    async execute() {
        const enabled = this.options.getBoolean('enabled');
        if (typeof enabled !== 'boolean') {
            await this.sendUsage();
            return;
        }

        this.guildConfig.caps = enabled;
        await this.guildConfig.save();
        await this.reply((enabled ? 'Enabled' : 'Disabled') + ' caps moderation!');
    }

    static getOptions() {
        return [{
            name: 'enabled',
            type: 'BOOLEAN',
            required: true,
            description: 'Should messages with over 70% caps be deleted?'
        }];
    }

    parseOptions(args) {
        let value = null;
        if (args.length && ['enabled', 'disabled'].includes(args[0].toLowerCase())) {
            value = args.shift().toLowerCase() === 'enabled';
        }
        return [{
            name: 'enabled',
            type: 'BOOLEAN',
            value
        }];
    }
}

class CapsCommand extends ConfigCommand {

    static description = 'Configure caps moderation (deletes messages with 70%+ caps)';

    static usage = 'get|set';

    static names = ['caps','capsmod'];

    static userPerms = ['MANAGE_GUILD'];

    static getSubCommands() {
        return [
            GetCapsCommand,
            SetCapsCommand
        ];
    }
}

module.exports = CapsCommand;
