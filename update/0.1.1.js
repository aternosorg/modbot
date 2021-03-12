const Database = require('../src/Database');
const config = require('../config.json');
const Discord = require('discord.js');
const database = new Database(config.db);
const client = new Discord.Client();

async function update() {
    console.log('Starting update to v0.1.1');

    console.log('Updating tables...');
    await database.query('ALTER TABLE `channels` ADD COLUMN IF NOT EXISTS `guildid` VARCHAR(20)');
    console.log('Done!')
    console.log('Updating entries...')
    const channelIDs = await database.queryAll('SELECT id FROM channels WHERE guildid IS null');
    if (channelIDs.length === 0) {
        console.log('No entries to update!');
        process.exit(0);
    }

    console.log('Logging into Discord....');
    await client.login(config.auth_token);
    console.log('Done!');

    let updates = [];
    for (const channelID of channelIDs) {
        updates.push(updateGuildID(channelID.id));
    }
    updates = await Promise.all(updates);

    const removed = updates.reduce(((previousValue, currentValue) => {
        if (currentValue)
            return previousValue;
        else
            return previousValue + 1;
    }), 0);

    console.log(`Updated ${updates.length} database entries, removed ${removed === true ? 0 : removed} faulty entries!`);
    process.exit(0);
}

update().catch(e => {
    console.error(e);
    process.exit(1);
});

/**
 * @param {Snowflake} channelID
 * @return {Promise<Boolean>}
 */
async function updateGuildID(channelID) {
    try {
        /** @type {module:"discord.js".GuildChannel} */
        const channel = await client.channels.fetch(/** @type {Snowflake} */ channelID);
        await database.query('UPDATE channels SET guildid = ? WHERE id = ?',[channel.guild.id, channelID]);
    }
    catch (e) {
        if (e.code === 10003) {
            await database.query('DELETE FROM channels WHERE id = ?',[channelID]);
            return false;
        }
        if (e.code === 50001) {
            return false;
        }
        throw e;
    }
    return true;
}
