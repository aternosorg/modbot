const Command = require('../Command');
const {Snowflake, MessageEmbed} = require('discord.js');
const User = require('../../User');
const util = require('../../util');

class AvatarCommand extends Command{

    static names = ['avatar', 'av'];

    static usage = '[<@user|id>]';

    static description = 'Show someones avatar';

    static supportsSlashCommands = true;

    async execute() {
        const user = await this._getUser();

        if (!user) {
            return this.sendUsage();
        }

        const avatarEmbed = new MessageEmbed()
            .setTitle(`Avatar of ${util.escapeFormatting(user.tag)}`)
            .setImage(user.displayAvatarURL({dynamic: true, size: 2048, format: 'png'}))
            .setFooter(`Command executed by ${util.escapeFormatting(this.source.getUser().tag)}`)
            .setTimestamp();

        await this.reply(avatarEmbed);
    }

    async _getUser() {
        if (this.source.isInteraction) {
            return this.options.getUser('user') ?? this.source.getUser();
        }
        else {
            /** @type {Snowflake} */
            const userID = this.options.getString('userID');
            if (userID) {
                const user = new User(userID, this.bot);
                return await user.fetchUser();
            }
            else {
                return this.source.getUser();
            }
        }
    }

    static getOptions() {
        return [{
            name: 'user',
            type: 'USER',
            description: 'The user who\'s avatar you want to view.',
            required: false,
        }];
    }

    parseOptions(args) {
        return [{
            name: 'userID',
            type: 'STRING',
            value: util.userMentionToId(args.join(' ')),
        }];
    }
}

module.exports = AvatarCommand;
