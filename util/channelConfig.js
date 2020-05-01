//saves the config for each configured channel
class channelConfig {
    constructor(id, mode, cooldown) {
        //channel ID
        this.id = id;

        //channel Mode (automod)
        this.mode = mode;

        //IP cooldown time
        this.cooldown = cooldown;
    }
}

module.exports = channelConfig;
