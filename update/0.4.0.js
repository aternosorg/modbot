const Database = require('../src/Database');
const config = require('../config.json');
const database = new Database(config.db);
const GuildConfig = require('../src/GuildConfig');

async function update() {
    console.log('Starting update to v0.4.0');

    console.log('Updating guild log channels')
    await database.waitForConnection();
    const guilds = await database.queryAll('SELECT id, config FROM guilds');
    let updated = 0;

    for (const guild of guilds) {
        const gc = new GuildConfig(guild.id, guild.config);
        if (gc.logChannel) {
            gc.messageLogChannel = gc.logChannel;
            await gc.save();
            updated ++;
        }
    }

    console.log(`Done! Added message log to ${updated} of ${guilds.length} guilds!`);

    process.exit(0);
}

update().catch(e => {
    console.error(e);
    process.exit(1);
});
