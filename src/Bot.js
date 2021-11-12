const {Client, Collection} = require('discord.js');
const Database = require('./Database');
const util = require('./util');
const fs = require('fs').promises;
const config = require('../config.json');
const Monitor = require('./Monitor');
const CommandManager = require('./CommandManager');
const SlashCommand = require('./SlashCommand');

class Bot {
    static instance = new Bot();

    static getInstance() {
        return this.instance;
    }

    /**
     * @type {Client}
     */
    #client;

    /**
     * @type {Database}
     */
    #database;

    /**
     * @type {Monitor}
     */
    #monitor = Monitor.getInstance();

    constructor() {
        this.#client = new Client({
            intents: [
                'GUILDS',
                'GUILD_MEMBERS',
                'GUILD_BANS',
                'GUILD_MESSAGES',
                'GUILD_MESSAGE_REACTIONS',
                'DIRECT_MESSAGES'
            ],
            allowedMentions: {
                parse: ['roles', 'users']
            },
            presence: { status: 'dnd', activities: [{ type: 'WATCHING', name: 'you' }] },
            partials: ['GUILD_MEMBER', 'CHANNEL'],
        });

        this.#database = new Database(config.db);
    }

    async start(){
        await this.#monitor.notice('Starting modbot');
        await this.#database.waitForConnection();
        await this.#monitor.info('Connected to database!');
        console.log('Connected!');

        await this.#database.createTables();
        util.init(this.#database, this.#client);

        await this.#client.login(config.auth_token);
        await this.#monitor.info('Logged into Discord');

        await Promise.all([
            this._loadChecks(),
            this._loadFeatures(),
            this._loadSlashCommands()
        ]);
    }

    async _loadChecks(){
        for (let file of await fs.readdir(`${__dirname}/checks`)) {
            let path = `${__dirname}/checks/${file}`;
            if (!file.endsWith('.js') || !(await fs.lstat(path)).isFile()) {
                continue;
            }

            let check;
            try {
                check = require(path);
            }
            catch (e) {
                await this.#monitor.critical(`Failed to load check '${file}'`, e);
                console.error(`Failed to load check '${file}'`, e);
                continue;
            }

            try {
                check.check(this.#database, this.#client);
                setInterval(check.check, check.interval * 1000, this.#database, this.#client);
            } catch (e) {
                await this.#monitor.error(`Failed to execute check '${file}'`, e);
                console.error(`Failed to execute check '${file}'`, e);
            }
        }
    }

    async _loadFeatures(){
        for (let folder of await fs.readdir(`${__dirname}/features`)) {
            let folderPath = `${__dirname}/features/${folder}`;
            if (!(await fs.lstat(folderPath)).isDirectory()) {
                continue;
            }
            let features = [];
            for (let file of await fs.readdir(folderPath)) {
                let path = `${__dirname}/features/${folder}/${file}`;
                if (!file.endsWith('.js') || !(await fs.lstat(path)).isFile()) {
                    continue;
                }
                try {
                    features.push(require(path));
                } catch (e) {
                    await this.#monitor.critical(`Failed to load feature '${folder}/${file}'`, e);
                    console.error(`Failed to load feature '${folder}/${file}'`, e);
                }
            }
            this.#client.on(folder, async (...args) => {
                for (let f of features) {
                    await Promise.resolve(f.event({database: this.#database,bot: this.#client}, ...args));
                }
            });
        }
    }

    async _loadSlashCommands() {
        console.log('Loading slash commands!');
        /**
         * @type {Collection<String, SlashCommand>}
         */
        const commands = SlashCommand.getFromClasses(CommandManager.getCommandClasses());

        if (config.debug?.enabled) {
            const guild = await this.#client.guilds.fetch(config.debug.guild);
            await guild.commands.set(Array.from(commands.values()));
        }

        const commandManager = this.#client.application.commands;
        await commandManager.fetch();

        for (const registeredCommand of commandManager.cache.values()) {
            const key = registeredCommand.type + ':' + registeredCommand.name;
            if (commands.has(key)) {
                const newCommand = commands.get(key);
                commands.delete(key);
                if (newCommand.matchesDefinition(registeredCommand))
                    continue;
                await registeredCommand.edit(newCommand);
            }
            else {
                await registeredCommand.delete();
            }
        }

        for (const command of commands.values()) {
            await commandManager.create(command);
        }
        console.log('Slash commands loaded!');
    }
}

module.exports = Bot;
