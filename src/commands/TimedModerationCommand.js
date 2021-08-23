const ModerationCommand = require('./ModerationCommand');
const util = require('../util');
const {MessageEmbed} = require('discord.js');

class TimedModerationCommand extends ModerationCommand {

    static usage = '<@user|id> [<@user|id…>] [<duration>] [<reason>]';

    static getOptions() {
        return super.getOptions().concat([{
            name: 'duration',
            type: 'STRING',
            description: `${this.type.execute.replace(/^./, a => a.toUpperCase())} duration`,
            required: false,
        }]);
    }

    async sendSuccess(targets){
        const type = this.constructor.type.done;
        let description = `${targets.map(user => `\`${util.escapeFormatting(user.tag)}\``).join(', ')} ${targets.length === 1 ? 'has' : 'have'} been **${type}** `;

        if (this.duration) {
            description += `for ${util.secToTime(this.duration)} `;
        }
        description += `| ${this.reason.substring(0, 4000 - description.length)}`;

        return await this.reply(new MessageEmbed()
            .setColor(util.color.resolve(type))
            .setDescription(description));
    }

    loadInfo() {
        this.duration = this.getDuration();
        super.loadInfo();
    }

    /**
     * get the duration of this moderation
     */
    getDuration() {
        if (this.source.isInteraction) {
            const duration = this.options.getString('duration', false);
            if (!duration) return 0;
            return util.timeToSec(duration);
        }
        else {
            const duration = util.timeToSec(this.args.join(' '));
            while (util.isTime(this.args[0])){
                this.args.shift();
            }
            return duration;
        }
    }
}

module.exports = TimedModerationCommand;
