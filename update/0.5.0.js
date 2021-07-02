const Database = require('../src/Database');
const config = require('../config.json');
const database = new Database(config.db);

async function update() {
    console.log('Starting update to v0.5.0');

    console.log('Updating tables');
    await database.waitForConnection();
    await database.query('ALTER TABLE badWords ADD `priority` int NULL;');
    console.log('Done!');
    process.exit(0);
}

update().catch(e => {
    console.error(e);
    process.exit(1);
});
