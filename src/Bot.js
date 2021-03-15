const Discord = require('discord.js');
const Database = require('./Database');
const util = require('./util');
const fs = require('fs').promises;
const config = require('../config.json');

class Bot {
    static instance = new Bot();

    static getInstance() {
        return this.instance;
    }

    /**
     * @type {module:"discord.js".Client}
     */
    #client;

    /**
     * @type {Database}
     */
    #database;

    constructor() {
        this.#client = new Discord.Client({
            disableMentions: 'everyone',
            presence: { status: "dnd", activity: { type: "WATCHING", name: "you" } }
        });

        this.#database = new Database(config.db);
    }

    async start(){
        await this.#database.waitForConnection();
        console.log("Connected!");

        await this.#database.createTables();
        util.init(this.#database, this.#client);

        await this.#client.login(config.auth_token);

        await this._loadChecks();
        await this._loadFeatures();

        // errors
        this.#client.on('error', (error) => {
            console.error('An error occurred',error);
        });
    }

    async _loadChecks(){
        for (let file of await fs.readdir(`${__dirname}/checks`)) {
            let path = `${__dirname}/checks/${file}`;
            if (!file.endsWith('.js') || !(await fs.lstat(path)).isFile()) {
                continue;
            }
            try {
                let check = require(path);
                check.check(this.#database, this.#client);
                setInterval(check.check, check.interval * 1000, this.#database, this.#client);
            } catch (e) {
                console.error(`Failed to load feature '${file}'`, e);
            }
        }
    }

    async _loadFeatures(){
        for (let folder of await fs.readdir(`${__dirname}/features`)) {
            let folderPath = `${__dirname}/features/${folder}`;
            if (!(await fs.lstat(folderPath)).isDirectory()) {
                continue;
            }
            let feature = [];
            for (let file of await fs.readdir(folderPath)) {
                let path = `${__dirname}/features/${folder}/${file}`;
                if (!file.endsWith('.js') || !(await fs.lstat(path)).isFile()) {
                    continue;
                }
                try {
                    feature.push(require(path));
                } catch (e) {
                    console.error(`Failed to load message feature '${file}'`, e);
                }
            }
            this.#client.on(folder, async (...args) => {
                for (let f of feature) {
                    await Promise.resolve(f.event({database: this.#database,bot: this.#client}, ...args));
                }
            });
        }
    }
}

module.exports = Bot;
