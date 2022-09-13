const Command = require('../OldCommand.js');
const User = require('../../../discord/UserWrapper.js');
const Moderation = require('../../../database/Moderation.js');

class ClearModerationsCommand extends OldCommand {

    static description = 'Delete all moderations for a user';

    static usage = '<@user|userId>';

    static names = ['clearmoderations','clearlogs', 'clearmods'];

    static userPerms = ['VIEW_AUDIT_LOG'];

    static modCommand = true;

    async execute() {

        let user;
        if (this.source.isInteraction) {
            user = this.options.getUser('user');
        }
        else {
            user = await User.getMentionedUser(this.options.getString('userid'), this.bot);
            if (!user) {
                return this.sendUsage();
            }
        }

        /** @type {Moderation[]} */
        const moderations = await this.database.queryAll('SELECT COUNT(id) AS modCount FROM moderations WHERE userid = ? AND guildid = ?',[user.id,this.source.getGuild().id]);
        const count = moderations[0]['modCount'];

        if (parseInt(count) === 0) {
            await this.sendError('This user doesn\'t have any moderations!');
            return;
        }

        const {confirmed, component} = await this.getConfirmation(`Are you sure you want to delete ${count} ${count === 1 ? 'moderation' : 'moderations'} for <@${user.id}>?`);

        if (!component) {
            return;
        }

        if (!confirmed) {
            await component.reply('Aborted!');
            return;
        }

        /** @property {Number} affectedRows */
        const deletion = await this.database.queryAll('DELETE FROM moderations WHERE guildid = ? AND userid = ?',[this.source.getGuild().id, user.id]);
        await component.reply(`Deleted ${deletion.affectedRows} ${deletion.affectedRows === 1 ? 'moderation' : 'moderations'}!`);
    }

    static getOptions() {
        return [{
            name: 'user',
            type: 'USER',
            description: 'user',
            required: true,
        }];
    }

    parseOptions(args) {
        return [
            {
                name: 'userid',
                type: 'STRING',
                value: args.join(' '),
            }
        ];
    }
}

module.exports = ClearModerationsCommand;
