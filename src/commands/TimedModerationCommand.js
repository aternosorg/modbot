const ModerationCommand = require('./ModerationCommand');
const Guild = require('../Guild');
const util = require('../util');

class TimedModerationCommand extends ModerationCommand {

    static usage = '<@user|id> [<@user|id…>] [<duration>] [<reason>]';

    static timed = true;

    async dmUser(target) {
        if (this.duration)
            return await Guild.sendDM(this.message.guild, target, `You have been ${this.constructor.type.done} from \`${this.message.guild.name}\` for ${util.secToTime(this.duration)} | ${this.reason}`);
        else
            return await Guild.sendDM(this.message.guild, target, `You have been permanently ${this.constructor.type.done} from \`${this.message.guild.name}\` | ${this.reason}`);
    }

    /**
     * get the duration of this moderation
     */
    getDuration() {
        const duration = util.timeToSec(this.args.join(' '));
        while (util.isTime(this.args[0])){
            this.args.shift();
        }
        return duration;
    }
}

module.exports = TimedModerationCommand;
