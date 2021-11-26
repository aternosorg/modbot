const Command = require('../Command');

class ReasonCommand extends Command {

    static description = 'View or change the reason of a moderation';

    static usage = '<id> <reason>';

    static names = ['reason', 'edit'];

    static userPerms = ['VIEW_AUDIT_LOG'];

    static modCommand = true;

    static supportsSlashCommands = true;

    async execute() {
        const id = this.options.getInteger('id');
        const reason = this.options.getString('reason').substring(0, 1000);
        if (id == null || id < 1 || !reason) {
            return this.sendUsage();
        }

        const { affectedRows } = await this.database.queryAll('UPDATE moderations SET reason = ? WHERE id = ? AND guildid = ?', [reason, id, this.source.getGuild().id]);
        await this.reply(affectedRows ? `Updated reason of ${id} | ${reason}` : 'Moderation not found!');
    }

    static getOptions() {
        return [{
            name: 'id',
            type: 'INTEGER',
            min_value: 1,
            description: 'Moderation ID',
            required: true,
        },{
            name: 'reason',
            type: 'STRING',
            description: 'Updated moderation reason',
            required: true,
        }];
    }

    parseOptions(args) {
        const id = args.shift()?.match(/#?(\d+)/);
        return [
            {
                name: 'id',
                type: 'INTEGER',
                value: id ? parseInt(id[1]) : id,
            },
            {
                name: 'reason',
                type: 'STRING',
                value: args.join(' '),
            }
        ];
    }
}

module.exports = ReasonCommand;
