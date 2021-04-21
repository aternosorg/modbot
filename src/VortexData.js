const Request = require('./Request');
const Discord = require('discord.js');

class VortexData{
    /**
     * key: userid
     * value: timestamp
     * @type {Object}
     */
    tempmutes;

    /**
     * key: userid
     * value: strike count
     * @type {Object}
     */
    strikes;

    /**
     * key: userid
     * value: timestamp
     * @type {Object}
     */
    tempbans;

    /**
     * @param {Object} data
     * @param {Object} data.tempmutes
     * @param {Object} data.strikes
     * @param {Object} data.tempbans
     */
    constructor(data) {
        this.tempmutes = data.tempmutes;
        this.strikes = data.strikes;
        this.tempbans = data.tempbans;
    }

    generateEmbed() {
        return new Discord.MessageEmbed()
            .setTitle('Imported Data')
            .addField('Mutes', Object.keys(this.tempmutes).length, true)
            .addField('Strikes', Object.keys(this.strikes).length, true)
            .addField('Bans', Object.keys(this.tempbans).length, true)
    }

    /**
     * @param {String} url
     * @returns {Promise<VortexData>}
     */
    static async get(url) {
        const request = new Request(url);
        let data;
        try {
            data = await request.getJSON();
        }
        catch (e) {
            if (typeof(e) === 'string' && e.startsWith('Failed to parse JSON response of')){
                throw new Error("Invalid VortexData");
            }
            throw e;
        }
        data = data.JSON;

        if (!data.tempmutes || !data.tempbans || !data.strikes) {
            throw new Error("Invalid VortexData");
        }

        return new VortexData(data);
    }
}

module.exports = VortexData;
