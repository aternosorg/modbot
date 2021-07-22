const Command = require('../../Command');

class ReasonCommand extends Command {

    static description = 'View or change the reason of a moderation';

    static usage = '<id> <reason>';

    static names = ['reason', 'edit'];

    static userPerms = ['VIEW_AUDIT_LOG'];

    static modCommand = true;

    async execute() {
        const id = parseInt(this.args.shift());
        if (!this.args.length || !id) return this.sendUsage();

        const reason = this.args.join(' ').substring(0, 1000);

        const { affectedRows } = await this.database.queryAll('UPDATE moderations SET reason = ? WHERE id = ? AND guildid = ?', [reason, id, this.message.guild.id]);
        await this.reply(affectedRows ? `Updated reason of ${id} | ${reason}` : 'Moderation not found!');
    }
}

module.exports = ReasonCommand;
