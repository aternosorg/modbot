import logger from './Logger.js';
import {exists, readJSON} from '../util/fsutils.js';

/**
 * @typedef {object} ConfigData
 * @property {string} authToken
 * @property {DatabaseConfig} database
 * @property {?string} googleApiKey
 * @property {?GoogleCloudConfig} googleCloud
 * @property {{enabled: boolean, guild: string}} debug
 * @property {string[]} featureWhitelist
 * @property {Emojis} emoji emoji ids
 */

/**
 * @typedef {object} GoogleCloudConfig
 * @property {GoogleCloudCredentials} credentials
 * @property {CloudLoggingConfig} logging
 * @property {VisionConfig} vision
 */

/**
 * @typedef {object} DatabaseConfig
 * @property {string} host
 * @property {string} user
 * @property {string} password
 * @property {string} database
 * @property {number} port
 */

/**
 * @typedef {object} VisionConfig
 * @property {boolean} enabled
 */

/**
 * @typedef {object} CloudLoggingConfig google cloud monitoring
 * @property {boolean} enabled
 * @property {string} projectId
 * @property {string} logName
 */

/**
 * @typedef {object} GoogleCloudCredentials
 * @property {string} client_email
 * @property {string} private_key
 */

/**
 * @typedef {object} Emojis
 * @property {?string} source
 * @property {?string} privacy
 * @property {?string} invite
 * @property {?string} discord
 * @property {?string} youtube
 * @property {?string} zendesk
 * @property {?string} firstPage
 * @property {?string} previousPage
 * @property {?string} refresh
 * @property {?string} nextPage
 * @property {?string} lastPage
 * @property {?string} announcement
 * @property {?string} channel
 * @property {?string} forum
 * @property {?string} stage
 * @property {?string} thread
 * @property {?string} voice
 * @property {?string} avatar
 * @property {?string} ban
 * @property {?string} moderations
 * @property {?string} mute
 * @property {?string} pardon
 * @property {?string} strike
 * @property {?string} kick
 * @property {?string} userCreated
 * @property {?string} userId
 * @property {?string} userJoined
 */

export class Config {
    /**
     * @type {ConfigData}
     */
    #data;

    /**
     * @returns {ConfigData}
     */
    get data() {
        return this.#data;
    }

    async load() {
        if (process.env.MODBOT_USE_ENV) {
            let googleCloudCredentials = process.env.MODBOT_GOOGLE_CLOUD_CREDENTIALS;
            if (googleCloudCredentials) {
                googleCloudCredentials = JSON.parse((new Buffer(googleCloudCredentials, 'base64')).toString());
            }
            else {
                googleCloudCredentials = {
                    client_email: process.env.MODBOT_GOOGLE_CLOUD_CREDENTIALS_CLIENT_EMAIL,
                    private_key: process.env.MODBOT_GOOGLE_CLOUD_CREDENTIALS_PRIVATE_KEY?.replaceAll('\\n', '\n'),
                };
            }


            // load settings from env
            this.#data = {
                authToken: process.env.MODBOT_AUTH_TOKEN,
                database: {
                    host: process.env.MODBOT_DATABASE_HOST,
                    user: process.env.MODBOT_DATABASE_USER ?? 'modbot',
                    password: process.env.MODBOT_DATABASE_PASSWORD,
                    database: process.env.MODBOT_DATABASE_DATABASE ?? 'modbot',
                    port: parseInt(process.env.MODBOT_DATABASE_PORT ?? '3306'),
                },
                googleApiKey:  process.env.MODBOT_GOOGLE_API_KEY,
                googleCloud: {
                    credentials: googleCloudCredentials,
                    vision: {
                        enabled: this.#parseBooleanFromEnv(process.env.MODBOT_GOOGLE_CLOUD_VISION_ENABLED)
                    },
                    logging: {
                        enabled: this.#parseBooleanFromEnv(process.env.MODBOT_GOOGLE_CLOUD_LOGGING_ENABLED),
                        projectId: process.env.MODBOT_GOOGLE_CLOUD_LOGGING_PROJECT_ID,
                        logName: process.env.MODBOT_GOOGLE_CLOUD_LOGGING_LOG_NAME,
                    },
                },
                featureWhitelist: (process.env.MODBOT_FEATURE_WHITELIST ?? '').split(/ *, */),
                emoji: {
                    source: process.env.MODBOT_EMOJI_SOURCE,
                    privacy: process.env.MODBOT_EMOJI_PRIVACY,
                    invite: process.env.MODBOT_EMOJI_INVITE,
                    discord: process.env.MODBOT_EMOJI_DISCORD,
                    youtube: process.env.MODBOT_EMOJI_YOUTUBE,
                    zendesk: process.env.MODBOT_EMOJI_ZENDESK,
                    firstPage: process.env.MODBOT_EMOJI_FIRST_PAGE,
                    previousPage: process.env.MODBOT_EMOJI_PREVIOUS_PAGE,
                    refresh: process.env.MODBOT_EMOJI_REFRESH,
                    nextPage: process.env.MODBOT_EMOJI_NEXT_PAGE,
                    lastPage: process.env.MODBOT_EMOJI_LAST_PAGE,
                    announcement: process.env.MODBOT_EMOJI_ANNOUNCEMENT,
                    channel: process.env.MODBOT_EMOJI_CHANNEL,
                    forum: process.env.MODBOT_EMOJI_FORUM,
                    stage: process.env.MODBOT_EMOJI_STAGE,
                    thread: process.env.MODBOT_EMOJI_THREAD,
                    voice: process.env.MODBOT_EMOJI_VOICE,
                    avatar: process.env.MODBOT_EMOJI_AVATAR,
                    ban: process.env.MODBOT_EMOJI_BAN,
                    moderations: process.env.MODBOT_EMOJI_MODERATIONS,
                    mute: process.env.MODBOT_EMOJI_MUTE,
                    pardon: process.env.MODBOT_EMOJI_PARDON,
                    strike: process.env.MODBOT_EMOJI_STRIKE,
                    kick: process.env.MODBOT_EMOJI_KICK,
                    userCreated: process.env.MODBOT_EMOJI_USER_CREATED,
                    userId: process.env.MODBOT_EMOJI_USER_ID,
                    userJoined: process.env.MODBOT_EMOJI_USER_JOINED,
                }
            };
        }
        else {
            // load settings from file
            if (!await exists('./config.json')) {
                await logger.error('No settings file found.\n' +
                    'Create a config.json or use environment variables as described in the CONFIGURATION.md');
                process.exit(1);
            }

            this.#data = await readJSON('./config.json');
            this.#data.googleCloud ??= {
                vision: {
                    enabled: false
                },
                logging: {
                    enabled: false,
                    projectId: '',
                    logName: '',
                },
                credentials: {
                    client_email: '',
                    private_key: '',
                },
            };
            this.#data.emoji ??= {};
            this.#data.featureWhitelist ??= [];
        }
    }

    /**
     * parse an environment variable as a boolean
     * @param {string} string
     * @returns {boolean}
     */
    #parseBooleanFromEnv(string) {
        return ['1', 'true', 'y'].includes(string?.toLowerCase?.());
    }
}

export default new Config();
