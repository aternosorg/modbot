//saves the config for each guild
class channelConfig {
    constructor(id, logChannel, mutedRole) {
        //guild ID
        this.id = id;

        //log channel
        this.logChannel = logChannel;

        //muted role
        this.mutedRole = mutedRole
    }
}

module.exports = channelConfig;
