const Command = require('../../Command');
const Moderation = require('../../Moderation');

class ClearModerationsCommand extends Command {

    static description = 'Delete a moderation';

    static usage = '<#id>';

    static names = ['deletemoderation','delmod'];

    static userPerms = ['VIEW_AUDIT_LOG'];

    static modCommand = true;

    async execute() {
        const regex = this.args.shift()?.match(/#?(\d+)/);
        if (regex == null) {
            return await this.sendUsage();
        }
        const id = parseInt(regex[1]);

        /** @type {Moderation|null} */
        const moderation = await this.database.query('SELECT id FROM moderations WHERE id = ? AND guildid = ?', [id, this.message.guild.id]);

        if (moderation === null) {
            await this.reply('Moderation not found!');
            return;
        }

        const {interaction, confirmed} = await this.getConfirmation(`Are you sure you want to delete the moderation #${id}?`);

        if (!interaction) {
            return;
        }

        if (!confirmed) {
            await interaction.reply('The moderation was not deleted!');
            return;
        }

        await this.database.queryAll('DELETE FROM moderations WHERE id = ? AND guildid = ?', [id, this.message.guild.id]);
        await interaction.reply(`Deleted the moderation #${id}!`);
    }
}

module.exports = ClearModerationsCommand;
