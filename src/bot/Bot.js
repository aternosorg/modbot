import {
    Client,
    Partials,
    GatewayIntentBits,
    AllowedMentionsTypes,
    ActivityType
} from 'discord.js';

import {createRequire} from 'module';
const require = createRequire(import.meta.url);
const config = require('../../config.json');

export default class Bot {
    static #instance = null;

    /**
     * @type {Client}
     */
    #client;

    constructor() {
        this.#client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildBans,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.DirectMessages,
            ],
            allowedMentions: {
                parse: [
                    AllowedMentionsTypes.Role,
                    AllowedMentionsTypes.User
                ]
            },
            presence: { status: 'dnd', activities: [{ type: ActivityType.Watching, name: 'you' }] },
            partials: [
                Partials.GuildMember,
                Partials.Channel,
            ],
        });
    }

    static get instance() {
        return this.#instance ??= new Bot();
    }

    get client() {
        return this.#client;
    }

    async start(){
        await this.#client.login(config.authToken);
    }
}
