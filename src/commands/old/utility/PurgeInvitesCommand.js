const Command = require('../OldCommand.js');
const util = require('../../../util.js');
const config = require('../../../../config.json');

class PurgeInvitesCommand extends OldCommand {

    static names = ['purgeinvites'];

    static userPerms = ['MANAGE_GUILD'];

    static botPerms = ['MANAGE_GUILD'];

    static description = 'Purge invites based on age and maximum uses';

    static usage = '[<minimum-age>] [<maximum-uses>]';

    static comment = 'By default all invites older than 30 days with less than 10 uses are deleted.';

    static private = true;

    async execute() {
        if (!config.featureWhitelist?.includes(this.source.getGuild().id)) {
            return await this.sendError('This command is only allowed in whitelisted guilds');
        }

        const maxDate = Date.now() - (util.timeToSec(this.options.getString('minimum-age') ?? '30d') * 1000);
        const maxUses = this.options.getInteger('max-uses') ?? 10;

        let invites = await this.source.getGuild().invites.fetch({cache: false});
        invites = invites.filter(invite => invite.createdAt < maxDate && maxUses >= invite.uses);

        if (invites.size === 0) {
            await this.reply('No invites matched your filters.');
            return;
        }

        const {confirmed, component} = await this.getConfirmation(`Delete ${invites.size} invites created before <t:${Math.floor(maxDate / 1000)}:d> with less than ${maxUses} uses!`);
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
        for (const invite of invites.values()) {
            await invite.delete();
        }
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

    parseOptions(args) {
        return [{
            name: 'minimum-age',
            type: 'STRING',
            value: args.shift(),
        }, {
            name: 'max-uses',
            type: 'INTEGER',
            value: parseInt(args.shift()) || null
        }];
    }
}

module.exports = PurgeInvitesCommand;