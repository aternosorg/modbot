const SetConfigCommand = require('../../SetConfigCommand');
const Guild = require('../../../discord/GuildWrapper.js');
const util = require('../../../util');
const User = require('../../../discord/User.js');
const {Snowflake} = require('discord.js');

class SetMutedRoleCommand extends SetConfigCommand {
    static usage = '[<@role|roleID>]';

    async execute() {
        /** @type {Snowflake} */
        let roleID = this.source.isInteraction ?
            this.options.getRole('role')?.id : this.options.getString('roleid');

        const role = roleID ? await (new GuildWrapper(this.source.getGuild())).fetchRole(roleID) : await this.source.getGuild().roles.create({name: 'Muted', hoist: false});

        if (!role) {
            await this.sendUsage();
            return;
        }
        roleID ??= role.id;

        if (!role.editable) {
            await this.sendError('I can\'t edit this role.');
            return;
        }

        await this.reply('Updating permission overrides...');

        //channel perms
        const channels = Array.from(this.source.getGuild().channels.cache.values());
        for (const channel of channels) {
            if (!channel.manageable) continue;
            let perms = channel.permissionsFor(role);
            if (perms && !perms.any(['SEND_MESSAGES', 'ADD_REACTIONS', 'SPEAK'])) continue;
            await channel.permissionOverwrites.edit(role, {
                'SEND_MESSAGES': false,
                'ADD_REACTIONS': false,
                'SPEAK': false
            });
        }

        const guild = new GuildWrapper(this.source.getGuild());
        const oldRole = this.guildConfig.mutedRole && this.guildConfig.mutedRole !== roleID ? await guild.fetchRole(this.guildConfig.mutedRole) : null;
        if (oldRole) {
            //transfer members
            await this.source.editResponse('Updating currently muted members...');

            if (!oldRole.editable) {
                await this.sendError('Can\'t update existing members (old role too high)');
            } else {
                const memberIDs = await this.database.queryAll('SELECT userid FROM moderations WHERE active = TRUE AND action = \'mute\' AND guildid = ?', [this.source.getGuild().id]);
                for (const memberID of memberIDs) {
                    const user = await new User(memberID.userid, this.bot).fetchUser();
                    const member = await guild.fetchMember(user);

                    if (member.roles.cache.get(oldRole)) {
                        await Promise.all([
                            member.roles.remove(oldRole),
                            member.roles.add(roleID)
                        ]);
                    }
                }
            }
        }

        this.guildConfig.mutedRole = role.id;
        await this.guildConfig.save();
        await this.sendSuccess(`Set muted role to <@&${role.id}>`);
    }


    static getOptions() {
        return [{
            name: 'role',
            type: 'ROLE',
            description: 'New muted role. If no muted role is mentioned a new one will be created.',
            required: false
        }];
    }

    parseOptions(args) {
        return [{
            name: 'roleid',
            type: 'STRING',
            value: util.roleMentionToId(args.shift())
        }];
    }
}

module.exports = SetMutedRoleCommand;
