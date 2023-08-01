import SubCommand from '../SubCommand.js';
import WhereParameter from '../../database/WhereParameter.js';
import Moderation from '../../database/Moderation.js';

/**
 * @abstract
 */
export default class CompletingModerationCommand extends SubCommand {
    async complete(interaction) {
        const focussed = interaction.options.getFocused(true);
        switch (focussed.name) {
            case 'id': {
                const options = [], params = [
                    new WhereParameter('guildid', interaction.guild.id),
                ];
                const value = parseInt(focussed.value);
                if (value) {
                    options.unshift({name: value, value: value});
                    params.push(new WhereParameter('id', `%${value}%`, 'LIKE'));
                }
                else {
                    params.push(new WhereParameter('moderator', interaction.user.id));
                }

                const moderations = await Moderation.select(params, 5, false);

                for (const moderation of moderations) {
                    const [user, moderator] = await Promise.all([
                        moderation.getUser(),
                        moderation.getModerator(),
                    ]);

                    options.push({
                        name: `#${moderation.id} - ${moderation.action} ${user?.displayName ?? 'unknown'} by ${moderator?.displayName ?? 'unknown'}`,
                        value: moderation.id
                    });
                }

                return options;
            }
        }

        return super.complete(interaction);
    }
}