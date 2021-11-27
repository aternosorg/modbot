const {ConfigCommand, GetConfigCommand, SetConfigCommand} = require('../ConfigCommand');
const SubCommand = require('../SubCommand');

class GetSpamProtectionCommand extends GetConfigCommand {

    static names = ['get','status'];

    static getParentCommand() {
        return SpamProtectionCommand;
    }

    async execute() {
        await this.reply(`Spam protection is currently ${this.getValue()}.`);
    }

    getValue() {
        if (this.guildConfig.antiSpam === -1) {
            return 'disabled';
        }
        else {
            return `set to ${this.guildConfig.antiSpam} messages per minute`;
        }
    }
}

class SetSpamProtectionCommand extends SetConfigCommand {

    static getParentCommand() {
        return SpamProtectionCommand;
    }

    async execute() {
        const count = this.options.get('value');
        console.log(count);
        console.log(this.options.data);
        if (count < 1 || count > 60) {
            await this.sendUsage();
        } else {
            this.guildConfig.antiSpam = count;
            await this.guildConfig.save();
            await this.reply(`Enabled spam protection! Users can now only send ${count} messages per minute.`);
        }
    }

    static getOptions() {
        return [{
            type: 'INTEGER',
            name: 'value',
            description: 'Maximum amount of messages a user is allowed to send per minute.',
            required: true,
            minValue: 1,
            maxValue: 60,
        }];
    }

    parseOptions(args) {
        return [{
            type: 'INTEGER',
            name: 'value',
            value: parseInt(args.shift())
        }];
    }
}

class DisableSpamProtectionCommand extends SubCommand {

    static names = ['disable', 'off'];

    static description = 'Disable the spam protection.';

    static getParentCommand() {
        return SpamProtectionCommand;
    }

    async execute() {
        this.guildConfig.antiSpam = -1;
        await this.guildConfig.save();
        await this.reply('Disabled spam protection!');
    }
}

class SpamProtectionCommand extends ConfigCommand {

    static names = ['spamprotection', 'antispam','spammod'];

    static userPerms = ['MANAGE_GUILD'];

    static description = 'Configure message spam protection (deletes spammed messages)';

    static getSubCommands() {
        return [GetSpamProtectionCommand, SetSpamProtectionCommand, DisableSpamProtectionCommand];
    }
}

module.exports = SpamProtectionCommand;
