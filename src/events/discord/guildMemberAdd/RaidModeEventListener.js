import GuildMemberAddEventListener from './GuildMemberAddEventListener.js';
import GuildSettings from '../../../settings/GuildSettings.js';
import GuildWrapper from '../../../discord/GuildWrapper.js';
import {userMention} from 'discord.js';

export default class RaidModeEventListener extends GuildMemberAddEventListener {

    async execute(member) {
        const guildConfig = await GuildSettings.get(member.guild.id);
        if (guildConfig.raidMode === true && member.kickable) {
            const guild = await GuildWrapper.fetch(member.guild.id);
            await guild.log({content: `Kicked ${userMention(member.id)} because anti-raid-mode is enabled!`});
            await member.kick('anti-raid-mode');
        }
    }
}