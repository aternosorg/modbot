const ModerationCommand = require('../ModerationCommand');
const Member = require('../../discord/MemberWrapper.js');

class StrikeCommand extends ModerationCommand {

    static description = 'Strike a user';

    static usage = '<@user|id> [<@user|id…>] [<count>] [<reason>]';

    static names = ['strike', 's'];

    static userPerms = ['BAN_MEMBERS'];

    static type = {
        execute: 'strike',
        done: 'striked',
    };

    static getOptions() {
        return super.getOptions().concat([{
            name: 'count',
            type: 'INTEGER',
            min_value: 1,
            description: 'Number of strikes',
            required: false,
        }]);
    }

    async executePunishment(target) {
        const member = new Member(target, this.source.getGuild());
        await member.strike(this.database, this.reason, this.source.getUser(), this.count);
        return true;
    }

    loadInfo() {
        this.count = this.getCount();
        super.loadInfo();
    }

    getCount() {
        if (this.source.isInteraction)
            return this.options.getInteger('count', false) || 1;
        if (!this.args.length || !this.args[0].match(/^\d{1,5}$/)) return 1;
        return parseInt(this.args.shift());
    }
}

module.exports = StrikeCommand;
