const ModerationCommand = require('ModerationCommand');

class TimedModerationCommand extends ModerationCommand {

    static usage = '<@user|id> [<@user|id…>] [<duration>] [<reason>]';

    async execute() {
        this.targetedUsers = await this.getTargetedUsers();
        if (this.targetedUsers === null) return;

        this.duration = this.getDuration();
        this.reason = this.getReason();
        for (const target of this.targetedUsers) {
            if (await this.isProtected(target)) return;
            await this.executePunishment(target);
        }
    }

    /**
     * get the duration of this moderation
     */
    getDuration() {
        this.duration = util.timeToSec(this.args.join(' '));
        while (util.isTime(this.args[0])){
            this.args.shift();
        }
    }
}

module.exports = TimedModerationCommand;
