const Command = require('../Command');
const Moderation = require('../../Moderation');

class ClearModerationsCommand extends Command {

    static description = 'Delete a moderation';

    static usage = '<#id>';

    static names = ['deletemoderation','delmod'];

    static userPerms = ['VIEW_AUDIT_LOG'];

    static modCommand = true;

    async execute() {
        const id = this.options.getInteger('id');
        if (!id || id < 1) {
            return await this.sendUsage();
        }

        /** @type {Moderation|null} */
        const moderation = await this.database.query('SELECT id FROM moderations WHERE id = ? AND guildid = ?', [id, this.source.getGuild().id]);

        if (moderation === null) {
            await this.sendError('Moderation not found!');
            return;
        }

        const {component, confirmed} = await this.getConfirmation(`Are you sure you want to delete the moderation #${id}?`);
        if (!component) {
            return;
        }

        if (!confirmed) {
            await component.reply('Aborted!');
            return;
        }

        await this.database.queryAll('DELETE FROM moderations WHERE id = ? AND guildid = ?', [id, this.source.getGuild().id]);
        await component.reply(`Deleted the moderation #${id}!`);
    }

    static getOptions() {
        return [{
            name: 'id',
            type: 'INTEGER',
            min_value: 1,
            description: 'Moderation ID',
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
            }
        ];
    }
}

module.exports = ClearModerationsCommand;
