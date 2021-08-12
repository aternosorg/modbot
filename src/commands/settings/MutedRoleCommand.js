const Command = require('../../Command');
const util = require('../../util.js');
const {Snowflake, MessageEmbed} = require('discord.js');
const Member = require('../../Member');
const User = require('../../User');

class LogChannelCommand extends Command {

    static description = 'Specify the muted role';

    static usage = '<@role|id>|create|off|status';

    static names = ['mutedrole','muterole'];

    static userPerms = ['MANAGE_GUILD'];

    static botPerms = ['MANAGE_CHANNELS', 'MANAGE_ROLES']

    async execute() {
        if (this.args.length !== 1) {
            await this.sendUsage();
            return;
        }

        switch (this.args[0].toLowerCase()) {
            case 'off':
                this.guildConfig.mutedRole = null;
                await this.guildConfig.save();
                await this.reply(new MessageEmbed()
                    .setDescription('Disabled the muted role')
                    .setFooter('You will not be able to mute or unmute users. Currently muted users will stay muted!')
                    .setColor(util.color.red)
                );
                break;
            case 'status':
                await this.reply(new MessageEmbed()
                    .setDescription(`The muted role is ${this.guildConfig.mutedRole ? `<@&${this.guildConfig.mutedRole}>` : 'currently disabled'}.`)
                    .setColor(this.guildConfig.mutedRole ? util.color.green : util.color.red)
                );
                break;

            case 'create': {
                const role = await this.message.guild.roles.create({ name: 'muted', hoist:false });
                await this.setRole(role.id);
                break;
            }
            default: {
                /** @type {Snowflake} */
                const role = util.roleMentionToId(this.args[0]);
                if (role === null || !await util.isRole(this.message.guild, role)) return this.sendUsage();

                if (!this.message.guild.roles.resolve(role).editable) {
                    return this.reply('I am missing the required permissions to manage that role!');
                }

                await this.setRole(role);
            }
        }
    }

    /**
     * set the muted role to this ID
     * @param {Snowflake|String} id
     * @return {Promise<void>}
     */
    async setRole(id) {
        await this.reply('Updating permission overrides...');

        //channel perms
        const channels = Array.from(this.message.guild.channels.cache.values());
        for (const channel of channels) {
            if (!channel.manageable) continue;
            if (!channel.permissionsFor(id).any(['SEND_MESSAGES', 'ADD_REACTIONS', 'SPEAK'])) continue;
            await channel.permissionOverwrites.edit(id, {
                'SEND_MESSAGES': false,
                'ADD_REACTIONS': false,
                'SPEAK': false
            });
        }

        if (this.guildConfig.mutedRole && this.guildConfig.mutedRole !== id) {
            //transfer members
            await this.response.edit('Updating currently muted members...');

            const oldRole = this.guildConfig.mutedRole;
            if (!((await this.message.guild.roles.fetch(oldRole)).editable)) {
                await this.reply('Can\'t update existing members (old role too high)');
            }
            else {
                const memberIDs = await this.database.queryAll('SELECT userid FROM moderations WHERE active = TRUE AND action = \'mute\' AND guildid = ?', [this.message.guild.id]);
                for (const memberID of memberIDs) {
                    const user = await new User(memberID.userid, this.bot).fetchUser();
                    const member = await new Member(user, this.message.guild).fetchMember();

                    if (member.roles.cache.get(oldRole)) {
                        await Promise.all([
                            member.roles.remove(oldRole),
                            member.roles.add(id)
                        ]);
                    }
                }
            }
        }

        this.guildConfig.mutedRole = id;
        await this.guildConfig.save();
        await this.response.edit({embeds: [
            new MessageEmbed()
                .setDescription(`Set muted role to <@&${id}>.`)
                .setColor(util.color.green)
        ]}
        );
    }
}

module.exports = LogChannelCommand;
