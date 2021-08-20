const Command = require('../../Command');
const User = require('../../User');
const Moderation = require('../../Moderation');

class ClearModerationsCommand extends Command {

    static description = 'Delete all moderations for a user';

    static usage = '<@user|userId>';

    static names = ['clearmoderations','clearlogs', 'clearmods'];

    static userPerms = ['VIEW_AUDIT_LOG'];

    static modCommand = true;

    async execute() {
        const user = await User.getMentionedUser(this.args.shift(), this.bot);
        if (user === null) {
            return await this.sendUsage();
        }

        /** @type {Moderation[]} */
        const moderations = await this.database.queryAll('SELECT COUNT(id) AS modCount FROM moderations WHERE userid = ? AND guildid = ?',[user.id,this.message.guild.id]);
        const count = moderations[0]['modCount'];

        if (parseInt(count) === 0) {
            await this.reply('This user doesn\'t have any moderations!');
            return;
        }

        const {confirmed, component} = await this.getConfirmation(`Are you sure you want to delete ${count} ${count === 1 ? 'moderations' : 'moderation'} for <@${user.id}>?`);

        if (!component) {
            return;
        }

        if (!confirmed) {
            await component.reply('The moderation was not deleted!');
            return;
        }

        /** @property {Number} affectedRows */
        const deletion = await this.database.queryAll('DELETE FROM moderations WHERE guildid = ? AND userid = ?',[this.message.guild.id, user.id]);
        await component.reply(`Deleted ${deletion.affectedRows} ${deletion.affectedRows === 1 ? 'moderation' : 'moderations'}!`);
    }

}

module.exports = ClearModerationsCommand;
