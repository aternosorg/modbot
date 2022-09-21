import Logger from '../Logger.js';
import {exists, readJSON} from '../util/fsutils.js';

/**
 * @typedef {Object} ConfigData
 * @property {string} authToken
 * @property {DatabaseConfig} database
 * @property {?string} googleApiKey
 * @property {?MonitoringConfig} monitoring
 * @property {{enabled: boolean, guild: string}} debug
 * @property {string[]} featureWhitelist
 * @property {Emojis} emoji emoji ids
 */

/**
 * @typedef {Object} DatabaseConfig
 */

/**
 * @typedef {Object} MonitoringConfig google cloud monitoring
 * @property {boolean} enabled
 * @property {string} projectId
 * @property {string} logName
 * @property {MonitoringCredentials} credentials
 */

/**
 * @typedef {Object} MonitoringCredentials
 * @property {string} client_email
 * @property {string} private_key
 */

/**
 * @typedef {Object} Emojis
 * @property {?string} source
 * @property {?string} privacy
 * @property {?string} invite
 * @property {?string} discord
 */

export default class Config {
    static #instance = new Config();

    /**
     * @type {ConfigData}
     */
    #data;

    /**
     * @returns {Config}
     */
    static get instance() {
        return this.#instance;
    }

    get data() {
        return this.#data;
    }

    async load() {
        if (process.env.MODBOT_USE_ENV) {
            // load settings from env
            this.#data = {
                authToken: process.env.MODBOT_AUTH_TOKEN,
                database: {
                    host: process.env.MODBOT_DATABASE_HOST,
                    user: process.env.MODBOT_DATABASE_USER,
                    password: process.env.MODBOT_DATABASE_PASSWORD,
                    database: process.env.MODBOT_DATABASE_DATABASE,
                    port: parseInt(process.env.MODBOT_DATABASE_PORT ?? '3306'),
                },
                googleApiKey:  process.env.MODBOT_GOOGLE_API_KEY,
                monitoring: {
                    enabled: !['0', 'false'].includes(process.env.MODBOT_MONITORING_ENABLED),
                    projectId: process.env.MODBOT_MONITORING_PROJECT_ID,
                    logName: process.env.MODBOT_MONITORING_LOG_NAME,
                    credentials: {
                        client_email: process.env.MODBOT_MONITORING_CREDENTIALS_CLIENT_EMAIL,
                        private_key: process.env.MODBOT_MONITORING_CREDENTIALS_PRIVATE_KEY
                    }
                },
                debug: {
                    enabled: !['0', 'false'].includes(process.env.MODBOT_DEBUG_ENABLED),
                    guild: process.env.MODBOT_DEBUG_GUILD
                },
                featureWhitelist: (process.env.MODBOT_FEATURE_WHITELIST ?? '').split(/ *, */),
                emoji: {
                    source: process.env.MODBOT_EMOJI_SOURCE,
                    privacy: process.env.MODBOT_EMOJI_PRIVACY,
                    invite: process.env.MODBOT_EMOJI_INVITE,
                    discord: process.env.MODBOT_EMOJI_DISCORD,
                }
            };
        }
        else {
            // load settings from file
            if (!await exists('./config.json')) {
                await Logger.instance.error('No settings file found.\n' +
                    'Create a config.json or use environment variables as described in the README.md');
                // TODO write documentation
                process.exit(1);
            }

            this.#data = await readJSON('./config.json');
            this.#data.monitoring ??= {
                enabled: false,
                projectId: '',
                logName: '',
                credentials: {
                    client_email: '',
                    private_key: '',
                },
            };
            this.#data.emoji ??= {};
        }
    }
}