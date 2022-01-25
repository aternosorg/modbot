const Command = require('../Command');
const util = require('../../util');

class PurgeInvitesCommand extends Command {

    static names = ['purgeinvites'];

    static userPerms = ['MANAGE_GUILD'];

    static botPerms = ['MANAGE_GUILD'];

    static description = 'Purge invites based on age and maximum uses';

    static usage = '[<minimum-age>] [<maximum-uses>]';

    static comment = 'By default all invites older than 30 days with less than 10 uses are deleted.';

    static supportsSlashCommands = true;

    async execute() {
        const maxDate = Date.now() - (util.timeToSec(this.options.getString('minimum-age') ?? '30d') * 1000);
        const maxUses = this.options.getInteger('max-uses') ?? 10;

        let invites = await this.source.getGuild().invites.fetch({cache: false});
        invites = invites.filter(invite => invite.createdAt < maxDate && maxUses >= invite.uses);

        if (invites.size === 0) {
            await this.reply('No invites matched your filters.');
            return;
        }

        const {confirmed, component} = await this.getConfirmation(`Delete ${invites.size} invites older created before <t:${Math.floor(maxDate / 1000)}:d> with less than ${maxUses} uses!`);
        if (!confirmed) {
            if (component) {
                await component.reply({
                    ephemeral: true,
                    content: 'No invites have been deleted'
                });
            }
            else {
                await this.reply('No invites have been deleted');
            }
            return;
        }

        await component.deferReply({ephemeral: true});
        await component.editReply(`Deleting ${invites.size} invites...`);
        await Promise.all(invites.map(invite => invite.delete()));
        await component.editReply(`Deleted ${invites.size} invites!`);
    }

    static getOptions() {
        return [{
            name: 'minimum-age',
            type: 'STRING',
            description: 'Only invites older than this will be deleted',
            required: false,
        }, {
            name: 'max-uses',
            type: 'INTEGER',
            minValue: 0,
            maxValue: 1000,
            description: 'Invites with more uses than specified here won\'t be deleted.',
            required: false,
        }];
    }
}

module.exports = PurgeInvitesCommand;