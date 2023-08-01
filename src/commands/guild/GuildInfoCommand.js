import Command from '../Command.js';
import {time, TimestampStyles, userMention} from 'discord.js';
import KeyValueEmbed from '../../embeds/KeyValueEmbed.js';
import colors from '../../util/colors.js';
import {yesNo} from '../../util/format.js';

export default class GuildInfoCommand extends Command {

    async execute(interaction) {
        const guild = interaction.guild;
        const owner = await guild.fetchOwner();

        const embed = new KeyValueEmbed()
            .setTitle(`${guild.name}`)
            .setColor(colors.RED)
            .setThumbnail(guild.iconURL({size: 2048}))
            .addPairIf(guild.description, 'Description', guild.description)
            .addPair('Owner', userMention(owner.id))
            .addPair('Owner ID', owner.id)
            .addPair('Created', time(guild.createdAt, TimestampStyles.LongDateTime))
            .addPair('Guild ID', guild.id)
            .newLine()
            .addPair('Members', guild.memberCount)
            .addPair('Member Limit', guild.maximumMembers)
            .addPair('Verified', yesNo(guild.verified))
            .addPair('Partnered', yesNo(guild.partnered))
            .addPair('Premium Tier', guild.premiumTier)
            .newLine();

        if (guild.features.length) {
            embed.addListOrShortList('Features', guild.features);
        }
        else {
            embed.addPair('Features', 'None');
        }

        await interaction.reply(embed.toMessage());
    }

    getDescription() {
        return 'Show information about this server';
    }

    getName() {
        return 'server';
    }
}