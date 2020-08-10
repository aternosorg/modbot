//saves the config for each configured channel
class channelConfig {
    constructor(id, json) {
        //channel ID
        this.id = id;

        if (json) {
          //channel Mode (automod)
          this.mode = json.mode;
          //IP cooldown time
          this.cooldown = json.cooldown;
          //allow invites
          this.invites = json.invites;
        }
    }
}

module.exports = channelConfig;
