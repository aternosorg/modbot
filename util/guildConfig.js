//saves the config for each guild
class channelConfig {
    constructor(id, logChannel) {
        //guild ID
        this.id = id;

        //log channel
        this.logChannel = logChannel;
    }
}

module.exports = channelConfig;
