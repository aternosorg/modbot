class ChatTriggeredFeature {

    static triggerTypes = ['regex', 'include', 'match'];

    /**
     * @param {Number} id ID in the database
     */
    constructor(id) {
        this.id = id;
    }

    /**
     * matches - does this message match this bad word
     * @param   {module:"discord.js".Message} message
     * @returns {boolean}
     */
    matches(message) {
        switch (this.trigger.type) {
            case "include":
                if (message.content.toLowerCase().includes(this.trigger.content.toLowerCase())) {
                    return true;
                }
                break;

            case "match":
                if (message.content.toLowerCase() === this.trigger.content.toLowerCase()) {
                    return true;
                }
                break;

            case "regex":
                let regex = new RegExp(this.trigger.content,this.trigger.flags);
                if (regex.test(message.content)) {
                    return true;
                }
                break;
        }

        return false;
    }
}

module.exports = ChatTriggeredFeature;
