const Command = require('../../Command');
const VortexData = require('../../VortexData');

class ImportDataCommand extends Command {

    static description = 'Import moderation data from Vortex';

    static usage = '';

    static names = ['import'];

    static comment = 'You need to attach the .json file exported from Vortex to your message';

    static userPerms = ['MANAGE_SERVER'];

    static botPerms = [];

    async execute() {
        if (!this.message.attachments.size) {
            await this.message.channel.send('Please attach a file to your message.');
            return;
        }

        /** @type {VortexData} */
        const data = await VortexData.get(this.message.attachments.first().url);

        await insertTimedModerations(this.database, data.tempmutes, 'mute', this.message.guild.id, this.bot.user.id);
        await insertTimedModerations(this.database, data.tempbans, 'ban', this.message.guild.id, this.bot.user.id);
        await insertStrikes(this.database, data.strikes, 'strike', this.message.guild.id, this.bot.user.id);

        await this.message.channel.send(data.generateEmbed());
    }
}

/**
 * insert timed moderations in bulk
 * @param {Database} db
 * @param {Object} data
 * @param {String} type
 * @param {String} guildid
 * @param {String} botid
 * @returns {Promise<void>}
 */
async function insertTimedModerations(db, data, type, guildid, botid) {
    const users = getUsers(data, type, guildid, botid);
    if (users.length) {
        return await db.queryAll("INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator) VALUES " + users.map(() => '(?,?,?,?,?,?,?)').join(', '), users.flat());
    }
}

/**
 * insert strikes in bulk
 * @param {Object} data
 * @param {Database} db
 * @param {String} type
 * @param {String} guildid
 * @param {String} botid
 * @returns {Promise<void>}
 */
async function insertStrikes(db, data, type, guildid, botid) {
    const users = getUsers(data, type, guildid, botid);
    if (users.length) {
        return await db.queryAll("INSERT INTO moderations (guildid, userid, action, created, value, reason, moderator) VALUES " + users.map(() => '(?,?,?,?,?,?,?)').join(', '), users.flat());
    }
}

function getUsers(data, type, guildid, botid) {
    const users = [];
    for (const user of Object.keys(data)) {
        users.push([guildid, user, type, Date.now(), data[user], 'Imported from Vortex', botid])
    }
    return users;
}

module.exports = ImportDataCommand;
