const ModerationCommand = require('./ModerationCommand');
const util = require('../util');

class TimedModerationCommand extends ModerationCommand {

    static usage = '<@user|id> [<@user|id…>] [<duration>] [<reason>]';

    static timed = true;

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
