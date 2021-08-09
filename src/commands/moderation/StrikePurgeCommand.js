const ModerationCommand = require('../ModerationCommand');
const Member = require('../../Member');
const util = require('../../util');
const {Message} = require('discord.js');

class StrikePurgeCommand extends ModerationCommand {

    static description = 'Strike a user and purge their messages';

    static usage = '<@user|id> [<@user|id…>] [<count>] [<reason>]';

    static names = ['strikepurge', 'sp'];

    static userPerms = ['BAN_MEMBERS'];

    static type = {
        execute: 'strike',
        done: 'striked',
    };

    async executePunishment(target) {
        const member = new Member(target, this.message.guild);
        await member.strike(this.database, this.reason, this.message.author, this.count);
        return true;
    }

    async postPunishment(successes) {
        let messages = await util.getMessages(this.message.channel, {
            before: this.message.id,
            limit: 100
        });
        messages = messages.filter(/** @type {Message} */msg => successes.some( u => msg.author.id === u.id));
        await util.bulkDelete(this.message.channel, messages);
    }

    loadInfo() {
        this.count = this.getCount();
        super.loadInfo();
    }

    getCount() {
        if (!this.args.length || !this.args[0].match(/^\d{1,5}$/)) return 1;
        return parseInt(this.args.shift());
    }
}

module.exports = StrikePurgeCommand;
